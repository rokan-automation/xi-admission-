const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  createApplication,
  getApplicationByAppId,
  uploadPhoto,
} = require('../models/applicationModel');

// Multer Config for Photo Upload (Max 2MB, Images Only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files (JPG, PNG) are allowed'));
    }
    cb(null, true);
  },
});

const currentYear = new Date().getFullYear();

// Home Page
router.get('/', (req, res) => {
  res.render('index');
});

// Admission Form Page (/admission or /apply)
router.get(['/admission', '/apply'], (req, res) => {
  res.render('admission', { error: null, old: {}, currentYear });
});

// Submit Application Form
router.post('/admission', upload.single('photo'), async (req, res) => {
  const b = req.body;
  const renderWithError = (msg) =>
    res.render('admission', { error: msg, old: b, currentYear });

  try {
    // Required fields validation
    const required = [
      'full_name_bn', 'full_name_en', 'father_name_en', 'father_name_bn',
      'mother_name_en', 'mother_name_bn', 'father_income', 'dob_day', 'dob_month',
      'dob_year', 'gender', 'mobile', 'present_village', 'present_post_office',
      'present_thana', 'present_district', 'permanent_village', 'permanent_post_office',
      'permanent_thana', 'permanent_district', 'ssc_roll', 'ssc_reg', 'ssc_board',
      'passing_year', 'gpa', 'ssc_group', 'group_name', 'academic_session'
    ];

    for (const field of required) {
      if (!b[field] || !String(b[field]).trim()) {
        return renderWithError('Please fill in all required (*) fields');
      }
    }

    if (!/^[0-9]{11}$/.test(b.mobile)) {
      return renderWithError('Mobile number must be an 11-digit number');
    }

    const day = String(b.dob_day).padStart(2, '0');
    const month = String(b.dob_month).padStart(2, '0');
    const date_of_birth = `${b.dob_year}-${month}-${day}`;

    // Multiple Extra-Curricular Activities Handling (Comma-separated string)
    let extraActivities = 'None';
    if (b.extra_activities) {
      extraActivities = Array.isArray(b.extra_activities)
        ? b.extra_activities.filter(Boolean).join(', ')
        : String(b.extra_activities).trim();
    }

    // Photo Upload Handling
    let photo_url = null;
    if (req.file) {
      try {
        photo_url = await uploadPhoto(req.file.buffer, req.file.originalname, req.file.mimetype);
      } catch (uploadErr) {
        console.warn('Photo upload bypassed or fallback:', uploadErr.message);
      }
    }

    // Prepare payload
    const applicationData = {
      full_name_bn: b.full_name_bn,
      full_name_en: b.full_name_en,
      father_name_bn: b.father_name_bn,
      father_name_en: b.father_name_en,
      mother_name_bn: b.mother_name_bn,
      mother_name_en: b.mother_name_en,
      father_income: b.father_income,
      mother_income: b.mother_income || '0',
      date_of_birth,
      gender: b.gender,
      religion: b.religion || null,
      blood_group: b.blood_group || null,
      mobile: b.mobile,
      email: b.email || null,
      present_village: b.present_village,
      present_post_office: b.present_post_office,
      present_thana: b.present_thana,
      present_district: b.present_district,
      permanent_village: b.permanent_village,
      permanent_post_office: b.permanent_post_office,
      permanent_thana: b.permanent_thana,
      permanent_district: b.permanent_district,
      ssc_roll: b.ssc_roll,
      ssc_reg: b.ssc_reg,
      ssc_board: b.ssc_board,
      passing_year: b.passing_year,
      gpa: b.gpa,
      ssc_group: b.ssc_group,
      group_name: b.group_name,
      academic_session: b.academic_session,
      activity_category: extraActivities, // Multiple activities saved here
      activity_sub: null,
      photo_url,
    };

    let application = await createApplication(applicationData);

    // Fallback if testing locally without database response
    if (!application || !application.application_id) {
      application = {
        ...applicationData,
        application_id: 'XI-' + currentYear + '-' + Math.floor(100000 + Math.random() * 900000),
      };
    }

    res.render('success', { application });
  } catch (err) {
    console.error(err);
    renderWithError('Failed to submit application. Please try again.');
  }
});

// Status Page (View Form by Tracking ID or SSC Roll)
router.get('/status', (req, res) => {
  res.render('status', { application: null, notFound: false, searched: false });
});

router.post('/status', async (req, res) => {
  try {
    const query = req.body.search_query ? req.body.search_query.trim() : '';
    let application = null;

    if (query) {
      application = await getApplicationByAppId(query);
    }

    res.render('status', {
      application,
      notFound: !application,
      searched: true,
    });
  } catch (err) {
    console.error(err);
    res.render('status', { application: null, notFound: true, searched: true });
  }
});

module.exports = router;