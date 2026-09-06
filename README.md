# একাদশ (XI) অনলাইন ভর্তি ফরম — Student & Admin Portal

## স্ট্যাক
Node.js + Express + EJS · Supabase (Postgres + Storage) · Vercel hosting

## সেটআপ

### ১) Supabase প্রজেক্ট বানানো
1. https://supabase.com এ প্রজেক্ট তৈরি করুন
2. SQL Editor এ গিয়ে `supabase-schema.sql` ফাইলের কোড রান করুন
3. Storage → New bucket → নাম দিন `photos`, **Public bucket** টিক দিয়ে বানান
4. Project Settings → API থেকে `Project URL` এবং `service_role` key কপি করুন

### ২) লোকাল সেটআপ
```bash
npm install
cp .env.example .env
# .env ফাইলে Supabase URL, service_role key, admin user/pass, JWT secret বসান
npm run dev
```
লোকালে চালু হবে: http://localhost:3000

### ৩) GitHub এ পুশ
```bash
git init
git add .
git commit -m "Initial commit: XI admission portal"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```
`.env` ফাইলটি `.gitignore` এ থাকায় GitHub এ যাবে না — এটাই কাম্য।

### ৪) Vercel এ ডিপ্লয়
1. vercel.com এ GitHub রিপো ইমপোর্ট করুন
2. Project → Settings → Environment Variables এ .env এর সবগুলো ভ্যারিয়েবল বসান
3. Deploy করুন

## রুট
- `/login` — সাইটে ঢোকার গেট (GATE_EMAIL + GATE_PASSWORD, শুধু এটা জানা মানুষই ভেতরে ঢুকতে পারবে)
- `/` — হোম পেজ (গেট পার হলে)
- `/admission` — দুই-ধাপের ভর্তি ফরম: Personal Information → SSC Information
- `/status` — আবেদনের অবস্থা চেক (Application ID দিয়ে)
- `/logout` — গেট সেশন থেকে লগআউট
- `/admin/login` — এডমিন লগইন (গেট থেকে সম্পূর্ণ আলাদা, ড্যাশবোর্ডের জন্য)
- `/admin/dashboard` — এডমিন প্যানেল (Approve/Reject, ফিল্টার)

## ভর্তি ফরমের নিয়ম
- নাম (Full name, Father's name, Mother's name) বাংলা ও ইংরেজি দুই ভাষায় আলাদা ঘরে — বাংলা ঘরে ইংরেজি বা ইংরেজি ঘরে বাংলা টাইপ করা যাবে না
- Date of Birth — দিন / মাস / বছর আলাদা ড্রপডাউন
- Gender — Male / Female / Others
- মোবাইল নম্বর — ঠিক ১১ ডিজিট, নম্বর ছাড়া কিছু লেখা যাবে না
- Email — ঐচ্ছিক
- Current ও Permanent Address — প্রতিটির জন্য Village, Post Office, Thana, District আলাদা ঘর ("Current Address এর মতোই" টিক দিলে Permanent এ অটো কপি হয়)
- Blood Group — ড্রপডাউন (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Select Group — Science / Commerce / Arts

## নিরাপত্তা নোট
- `SUPABASE_SERVICE_ROLE_KEY` কখনো ফ্রন্টএন্ডে বা GitHub এ পুশ করবেন না
- প্রোডাকশনে `GATE_PASSWORD` এবং `ADMIN_PASS` অবশ্যই শক্তিশালী পাসওয়ার্ড দিন
- স্কিমা বদলেছে বলে Supabase এ আগে টেবিল বানানো থাকলে `supabase-schema.sql` আবার রান করলে পুরনো টেবিল মুছে নতুন করে বানাবে (`DROP TABLE IF EXISTS`) — আসল ডাটা থাকলে আগে ব্যাকআপ নিন
