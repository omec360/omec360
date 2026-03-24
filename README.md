# עומק 360 - רשת חברתית סגורה

רשת חברתית פנימית לתלמידי תכנית עומק 360.

## התקנה והפעלה

### דרישות
- Node.js 18+ (הורד מ-[nodejs.org](https://nodejs.org))
- חשבון Supabase (חינמי ב-[supabase.com](https://supabase.com))

### שלב 1 — התקנת תלויות
```bash
cd omek360-app
npm install
```

### שלב 2 — הגדרת Supabase
1. צור פרויקט חדש ב-[supabase.com](https://supabase.com)
2. לך ל-**SQL Editor** והרץ את כל הקוד מ-`supabase/migrations/001_init.sql`
3. לך ל-**Settings > API** והעתק את:
   - `Project URL`
   - `anon public` key

### שלב 3 — משתני סביבה
```bash
cp .env.local.example .env.local
```
ואז ערוך את `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### שלב 4 — הפעלה
```bash
npm run dev
```
פתח [http://localhost:3000](http://localhost:3000)

---

## הגדרת מנהל ראשון
1. הוסף את האימייל שלך ב-Supabase SQL Editor:
   ```sql
   insert into allowed_emails (email) values ('your@email.com');
   ```
2. הירשם דרך הממשק
3. עדכן את התפקיד שלך למנהל:
   ```sql
   update profiles set role = 'admin' where id = 'YOUR_USER_ID';
   ```
4. כעת תוכל להוסיף אימיילים של תלמידים דרך `/admin/students`

---

## מבנה הפרויקט
```
src/
├── app/
│   ├── (auth)/login/      # דף כניסה
│   ├── (app)/
│   │   ├── feed/          # פיד ראשי
│   │   ├── upload/        # העלאת פוסט
│   │   ├── post/[id]/     # פוסט בודד
│   │   └── profile/[id]/  # פרופיל תלמיד
│   └── admin/             # לוח ניהול
├── components/
│   ├── Navbar.tsx
│   ├── PostCard.tsx
│   ├── CommentSection.tsx
│   ├── MediaUploader.tsx
│   └── ProfileHeader.tsx
└── lib/supabase/          # חיבור ל-Supabase
```

## פיצ'רים
- **רשת סגורה** — רק אימיילים שאושרו מראש יכולים להירשם
- **פיד** — כל הפוסטים של כל התלמידים
- **העלאת תוכן** — טקסט, תמונות, וידאו
- **פידבק** — תגובות על כל פוסט
- **פרופיל אישי** — לכל תלמיד
- **לוח ניהול** — למנהל/מורה
