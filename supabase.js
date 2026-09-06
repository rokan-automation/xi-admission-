const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase = null;

// কি (Key) থাকলে আসল কানেকশন নেবে, না থাকলে ডামি হিসেবে চলবে
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } catch (err) {
    console.warn('Supabase কানেক্ট করা যায়নি, ডামি মোডে চলছে।');
  }
}

// ডাটাবেজ না থাকলেও যেন কোনো পেজ বা ফর্ম ক্র্যাশ না করে
if (!supabase) {
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: {}, error: null })
      }),
      single: () => Promise.resolve({ data: {}, error: null })
    })
  };
}

module.exports = supabase;