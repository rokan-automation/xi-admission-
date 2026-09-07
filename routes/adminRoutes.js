const express = require('express');
const jwt = require('jsonwebtoken');
const archiver = require('archiver');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { 
  getAllApplications, 
  getApplicationByAppId,
  updateFullApplication,
  deleteApplication,
  getAdmissionAnalytics
} = require('../models/applicationModel');

// Redirect root to dashboard
router.get('/', (req, res) => {
  res.redirect('/admin/dashboard');
});

// Admin Login GET
router.get('/login', (req, res) => {
  res.render('admin-login', { error: null });
});

// Admin Login POST
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USER || 'admin';
  const validPass = process.env.ADMIN_PASS || 'admin2026@';

  if (username === validUser && password === validPass) {
    const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '8h' });
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    });
    return res.redirect('/admin/dashboard');
  }

  res.render('admin-login', { error: 'Invalid username or password' });
});

// Admin Logout
router.get('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin/login');
});

// Admin Dashboard (Server-side Filtered & Optimized)
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const group_name = req.query.group || 'all';
    const search_query = req.query.search_query ? req.query.search_query.trim() : '';
    const updated = req.query.updated === '1';

    let searchedStudent = null;
    let notFound = false;

    // Search Student by Tracking ID or SSC Roll
    if (search_query) {
      searchedStudent = await getApplicationByAppId(search_query);
      if (!searchedStudent) notFound = true;
    }

    // Server-side Filtering with Pagination/Limit (Optimized for Vercel)
    const result = await getAllApplications({ status: 'Approved', group_name, limit: 50 });
    const approvedApplications = Array.isArray(result) ? result : (result.data || []);

    // Admission Analysis (group-wise totals, approvals, elective/4th subject breakdown)
    const analytics = await getAdmissionAnalytics();

    res.render('admin', { 
      approvedApplications, 
      group_name, 
      search_query,
      searchedStudent,
      notFound,
      updated,
      analytics
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.render('admin', { 
      approvedApplications: [], 
      group_name: 'all', 
      search_query: '',
      searchedStudent: null,
      notFound: false,
      updated: false,
      analytics: { totalByGroup: {}, approvedByGroup: {}, electiveCounts: {}, fourthSubjectCounts: {}, electiveRolls: {}, fourthSubjectRolls: {}, pendingByGroup: {} }
    });
  }
});

// Download all approved students' photos (for a group, or all) as a ZIP, named by roll number
router.get('/download-photos', requireAdmin, async (req, res) => {
  try {
    const group_name = req.query.group || 'all';

    const result = await getAllApplications({ status: 'Approved', group_name, limit: 1000 });
    const list = Array.isArray(result) ? result : (result.data || []);

    if (!list.length) {
      return res.status(404).send('No approved students found for this group.');
    }

    // Sort by class_roll numerically so files land in the zip in roll order
    const sorted = [...list].sort((a, b) => {
      const ra = parseInt(a.class_roll, 10);
      const rb = parseInt(b.class_roll, 10);
      if (!isNaN(ra) && !isNaN(rb)) return ra - rb;
      return String(a.class_roll || '').localeCompare(String(b.class_roll || ''));
    });

    const zipLabel = group_name === 'all' ? 'All-Groups' : group_name.replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Photos-${zipLabel}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error('Zip error:', err);
      if (!res.headersSent) res.status(500).end();
    });
    archive.pipe(res);

    for (const app of sorted) {
      if (!app.photo_url) continue;
      try {
        const response = await fetch(app.photo_url);
        if (!response.ok) continue;
        const buffer = Buffer.from(await response.arrayBuffer());

        const contentType = response.headers.get('content-type') || '';
        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';

        const rollLabel = app.class_roll ? String(app.class_roll).padStart(2, '0') : 'NoRoll';
        const safeName = (app.full_name_en || 'Student').replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_');
        const fileName = `Roll-${rollLabel}_${safeName}.${ext}`;

        archive.append(buffer, { name: fileName });
      } catch (photoErr) {
        console.error(`Failed to fetch photo for ${app.application_id}:`, photoErr.message);
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('Error creating photo zip:', err);
    if (!res.headersSent) res.status(500).send('Failed to generate photo zip.');
  }
});

// Full Application Update & Approval Route (Handles both Section 1 and Section 2)
router.post('/update-full-application/:id', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    
    const electiveStr = Array.isArray(b.elective_subjects) 
      ? b.elective_subjects.join(', ') 
      : (b.elective_subjects || '');

    let extraActivities = 'None';
    if (b.activity_category) {
      extraActivities = b.activity_category;
    } else if (b.extra_activities) {
      extraActivities = Array.isArray(b.extra_activities)
        ? b.extra_activities.filter(Boolean).join(', ')
        : String(b.extra_activities).trim();
    }

    // Force Type Conversions to prevent Supabase rejection (Ensures GPA & Incomes don't turn to 0 or null)
    const updatePayload = {
      ...b,
      father_income: Number(b.father_income) || 0,
      mother_income: Number(b.mother_income) || 0,
      passing_year: Number(b.passing_year) || null,
      gpa: parseFloat(b.gpa) || 0.00,
      elective_subjects: electiveStr,
      activity_category: extraActivities,
      updated_at: new Date()
    };

    // Remove any undefined values to keep DB safe
    Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

    // Send to Database
    await updateFullApplication(req.params.id, updatePayload);

  } catch (err) {
    console.error('Error updating full application:', err);
  }

  // Redirect back with updated flag (Triggers 3-second custom toast)
  res.redirect('/admin/dashboard?updated=1');
});

// Delete Admission Record
router.post('/delete/:id', requireAdmin, async (req, res) => {
  try {
    await deleteApplication(req.params.id);
  } catch (err) {
    console.error('Error deleting application:', err);
  }
  res.redirect('/admin/dashboard');
});

module.exports = router;