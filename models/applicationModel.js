const supabase = require('../supabase');
const { customAlphabet } = require('nanoid');

// 6-digit alphanumeric generator for unique tracking IDs
const genId = customAlphabet('0123456789', 6);

function generateApplicationId() {
  const year = new Date().getFullYear();
  return `XI-${year}-${genId()}`;
}

/**
 * 1. Create New Application
 */
async function createApplication(data) {
  const application_id = generateApplicationId();

  const payload = {
    ...data,
    application_id,
    father_income: Number(data.father_income) || 0,
    mother_income: Number(data.mother_income) || 0,
    passing_year: parseInt(data.passing_year, 10) || new Date().getFullYear(),
    gpa: parseFloat(data.gpa) || 0,
  };

  const { data: row, error } = await supabase
    .from('applications')
    .insert([payload])
    .select('id, application_id, full_name_en, group_name, mobile, ssc_roll, created_at')
    .single();

  if (error) throw error;
  return row;
}

/**
 * 2. Get Single Application by Tracking ID OR SSC Roll
 */
async function getApplicationByAppId(query) {
  if (!query) return null;
  const cleanQuery = String(query).trim();

  const selectColumns = [
    'id', 'application_id', 'class_roll', 'receipt_no', 'full_name_en', 'full_name_bn',
    'father_name_en', 'father_name_bn', 'father_income', 'mother_name_en', 'mother_name_bn',
    'mother_income', 'date_of_birth', 'gender', 'religion', 'blood_group', 'mobile',
    'email', 'present_village', 'present_post_office', 'present_thana', 'present_district',
    'permanent_village', 'permanent_post_office', 'permanent_thana', 'permanent_district',
    'ssc_roll', 'ssc_reg', 'ssc_board', 'passing_year', 'gpa', 'ssc_group', 'group_name',
    'academic_session', 'activity_category', 'activity_sub', 'photo_url', 'status',
    'compulsory_subjects', 'elective_subjects', 'fourth_subject', 'created_at'
  ].join(', ');

  const { data, error } = await supabase
    .from('applications')
    .select(selectColumns)
    .or(`application_id.eq.${cleanQuery},ssc_roll.eq.${cleanQuery}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Database query error in getApplicationByAppId:', error);
    return null;
  }

  return data;
}

/**
 * 3. Get All Applications (Admin Dashboard / Register)
 */
async function getAllApplications({ status, group_name, search, page = 1, limit = 100 } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const selectColumns = [
    'id', 'application_id', 'class_roll', 'receipt_no', 'full_name_en', 'full_name_bn',
    'father_name_en', 'father_name_bn', 'father_income', 'mother_name_en', 'mother_name_bn',
    'mother_income', 'date_of_birth', 'gender', 'religion', 'blood_group', 'mobile',
    'email', 'present_village', 'present_post_office', 'present_thana', 'present_district',
    'permanent_village', 'permanent_post_office', 'permanent_thana', 'permanent_district',
    'ssc_roll', 'ssc_reg', 'ssc_board', 'passing_year', 'gpa', 'ssc_group', 'group_name',
    'academic_session', 'activity_category', 'activity_sub', 'photo_url', 'status',
    'compulsory_subjects', 'elective_subjects', 'fourth_subject', 'created_at'
  ].join(', ');

  let query = supabase
    .from('applications')
    .select(selectColumns, { count: 'exact' })
    .order('class_roll', { ascending: true, nullsFirst: false })
    .range(from, to);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  
  if (group_name && group_name !== 'all') {
    query = query.eq('group_name', group_name);
  }

  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(`full_name_en.ilike.%${s}%,application_id.ilike.%${s}%,class_roll.ilike.%${s}%,mobile.ilike.%${s}%,receipt_no.ilike.%${s}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  
  return { data, total: count, page, limit };
}

/**
 * 4. Quick Status Update
 */
async function updateStatus(id, status) {
  const { data, error } = await supabase
    .from('applications')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select('id, status')
    .single();

  if (error) throw error;
  return data;
}

/**
 * 5. Update Complete Application Form (All Data Editable)
 */
async function updateFullApplication(id, data) {
  let cleanDob = data.date_of_birth;
  if (cleanDob && cleanDob.includes('T')) {
    cleanDob = cleanDob.split('T')[0];
  }

  const payload = {
    full_name_en: data.full_name_en ? data.full_name_en.trim() : '',
    full_name_bn: data.full_name_bn ? data.full_name_bn.trim() : '',
    father_name_en: data.father_name_en ? data.father_name_en.trim() : '',
    father_name_bn: data.father_name_bn ? data.father_name_bn.trim() : '',
    father_income: Number(data.father_income) || 0,
    mother_name_en: data.mother_name_en ? data.mother_name_en.trim() : '',
    mother_name_bn: data.mother_name_bn ? data.mother_name_bn.trim() : '',
    mother_income: Number(data.mother_income) || 0,
    date_of_birth: cleanDob,
    gender: data.gender,
    religion: data.religion || null,
    blood_group: data.blood_group || null,
    mobile: data.mobile ? data.mobile.trim() : '',
    email: data.email ? data.email.trim() : null,
    present_village: data.present_village ? data.present_village.trim() : '',
    present_post_office: data.present_post_office ? data.present_post_office.trim() : '',
    present_thana: data.present_thana ? data.present_thana.trim() : '',
    present_district: data.present_district ? data.present_district.trim() : '',
    permanent_village: data.permanent_village ? data.permanent_village.trim() : '',
    permanent_post_office: data.permanent_post_office ? data.permanent_post_office.trim() : '',
    permanent_thana: data.permanent_thana ? data.permanent_thana.trim() : '',
    permanent_district: data.permanent_district ? data.permanent_district.trim() : '',
    ssc_roll: data.ssc_roll ? data.ssc_roll.trim() : '',
    ssc_reg: data.ssc_reg ? data.ssc_reg.trim() : '',
    ssc_board: data.ssc_board ? data.ssc_board.trim() : '',
    passing_year: parseInt(data.passing_year, 10) || 2025,
    gpa: parseFloat(data.gpa) || 0,
    ssc_group: data.ssc_group,
    group_name: data.group_name,
    class_roll: data.class_roll ? data.class_roll.trim() : null,
    receipt_no: data.receipt_no ? data.receipt_no.trim() : null,
    status: data.status || 'Approved',
    compulsory_subjects: data.compulsory_subjects,
    elective_subjects: data.elective_subjects,
    fourth_subject: data.fourth_subject,
    
    // --> Co-Curricular Activities Updated Here <--
    activity_category: data.activity_category || 'None', 
    
    updated_at: new Date().toISOString(),
  };

  const { data: row, error } = await supabase
    .from('applications')
    .update(payload)
    .eq('id', id)
    .select('id, application_id, status');

  if (error) {
    console.error('Supabase updateFullApplication error:', error);
    throw error;
  }

  return row ? row[0] : null;
}

/**
 * 6. Update Quick Admission Assignment Only
 */
async function updateAdmissionDetails(id, details) {
  const { data, error } = await supabase
    .from('applications')
    .update({
      class_roll: details.class_roll,
      receipt_no: details.receipt_no,
      group_name: details.group_name,
      compulsory_subjects: details.compulsory_subjects,
      elective_subjects: details.elective_subjects,
      fourth_subject: details.fourth_subject,
      status: details.status || 'Approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, class_roll, receipt_no, status')
    .single();

  if (error) throw error;
  return data;
}

/**
 * 7. Delete Admission Record
 */
async function deleteApplication(id) {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * 8. Upload Photo
 */
async function uploadPhoto(fileBuffer, fileName, mimeType) {
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${Date.now()}-${cleanFileName}`;

  const { error } = await supabase.storage
    .from('student-photos')
    .upload(path, fileBuffer, { 
      contentType: mimeType, 
      upsert: false 
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('student-photos')
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * 9. Admission Analysis
 * গ্রুপ ভিত্তিক মোট আবেদন, অ্যাপ্রুভড সংখ্যা, এবং Approved স্টুডেন্টদের
 * ইলেকটিভ ও ৪র্থ বিষয়ের ব্রেকডাউন (কম্পলসরি বাদে, যেহেতু সবাই একই কম্পলসরি নেয়)
 */
function splitSubjects(str) {
  // Split on commas that separate subjects, but NOT commas inside
  // parentheses (e.g. "Economics (109, 110)" must stay as ONE subject,
  // not split into "Economics (109" and "110)").
  const result = [];
  let depth = 0;
  let current = '';
  for (const char of String(str)) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth <= 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result.filter(Boolean);
}

async function getAdmissionAnalytics() {
  const { data, error } = await supabase
    .from('applications')
    .select('group_name, status, elective_subjects, fourth_subject, application_id, ssc_roll, class_roll');

  if (error) throw error;

  const totalByGroup = {};
  const approvedByGroup = {};
  const electiveCounts = {};      // { group: { subjectName: count } }
  const fourthSubjectCounts = {}; // { group: { subjectName: count } }
  const electiveRolls = {};       // { group: { subjectName: [class_roll, ...] } }
  const fourthSubjectRolls = {};  // { group: { subjectName: [class_roll, ...] } }
  const pendingByGroup = {};      // { group: [ { application_id, ssc_roll }, ... ] }

  // Sort rolls numerically where possible, alphabetically otherwise
  const rollSort = (a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  };

  (data || []).forEach((row) => {
    const group = row.group_name || 'Unspecified';
    totalByGroup[group] = (totalByGroup[group] || 0) + 1;

    if (row.status === 'Approved') {
      approvedByGroup[group] = (approvedByGroup[group] || 0) + 1;
      const roll = row.class_roll || row.ssc_roll || '-';

      if (row.elective_subjects) {
        if (!electiveCounts[group]) electiveCounts[group] = {};
        if (!electiveRolls[group]) electiveRolls[group] = {};
        splitSubjects(row.elective_subjects).forEach((sub) => {
          electiveCounts[group][sub] = (electiveCounts[group][sub] || 0) + 1;
          if (!electiveRolls[group][sub]) electiveRolls[group][sub] = [];
          electiveRolls[group][sub].push(roll);
        });
      }

      if (row.fourth_subject) {
        if (!fourthSubjectCounts[group]) fourthSubjectCounts[group] = {};
        if (!fourthSubjectRolls[group]) fourthSubjectRolls[group] = {};
        const sub = row.fourth_subject.trim();
        fourthSubjectCounts[group][sub] = (fourthSubjectCounts[group][sub] || 0) + 1;
        if (!fourthSubjectRolls[group][sub]) fourthSubjectRolls[group][sub] = [];
        fourthSubjectRolls[group][sub].push(roll);
      }
    } else {
      if (!pendingByGroup[group]) pendingByGroup[group] = [];
      pendingByGroup[group].push({
        application_id: row.application_id || '-',
        ssc_roll: row.ssc_roll || '-',
      });
    }
  });

  // Sort every roll list once, in place
  Object.values(electiveRolls).forEach((subj) => Object.values(subj).forEach((list) => list.sort(rollSort)));
  Object.values(fourthSubjectRolls).forEach((subj) => Object.values(subj).forEach((list) => list.sort(rollSort)));

  return { totalByGroup, approvedByGroup, electiveCounts, fourthSubjectCounts, electiveRolls, fourthSubjectRolls, pendingByGroup };
}

module.exports = {
  createApplication,
  getApplicationByAppId,
  getAllApplications,
  updateStatus,
  updateFullApplication,
  updateAdmissionDetails,
  deleteApplication,
  uploadPhoto,
  getAdmissionAnalytics,
};