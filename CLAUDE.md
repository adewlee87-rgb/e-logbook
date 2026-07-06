# e-log — Universal E-Logbook (MVP, 4-day build)

Web platform digitizing the SIWES industrial training logbook for Nigerian universities.
PITCH DEMO: prioritize working + matching the design over perfect architecture.

## Roles
- student (default on signup): creates/edits/submits log entries with media
- supervisor: reviews assigned students' entries, comments, approves/rejects
- itf_official: views approved entries, adds official comments
- admin: manages users, assigns roles + supervisors, sees stats

## Stack
- Next.js 14 App Router + TypeScript + Tailwind (src/ dir, @/* alias)
- Supabase: Postgres, Auth (EMAIL + password), Storage (bucket: entry-media)
- Server logic via Server Actions / API routes — no separate backend
- Deploy: Vercel

## Auth (matches design)
- Standard email + password via Supabase Auth
- Signup fields: first name, last name, email, school name, password
- Everyone signs up as role='student'; admin promotes roles later
- Email verification: Supabase OTP (4-6 digit code) on signup
- Forgot/reset password flow included
- After login read profiles.role and route: student->/student, supervisor->/supervisor, itf_official->/itf, admin->/admin

## Database
- profiles: id (refs auth.users), first_name, last_name, email, role, school, department, level, place_of_work, passport_photo_url
- logbook_entries: id, student_id, type (daily/weekly/monthly), title, date, objective, observations, status (draft/submitted/approved/rejected), created_at, updated_at
- entry_media: id, entry_id, file_url, file_type
- reviews: id, entry_id, reviewer_id, reviewer_role, comment, reviewed_at
- notifications: id, user_id, message, is_read, created_at
- supervisors_students: supervisor_id, student_id

## Design system (from Figma)
- Primary: #FFC107 (buttons, links, active states); button text: #1A1A1A semibold
- Buttons: full-width pill (rounded-full); disabled = bg #9CA3AF, white text
- Inputs: white, border #E5E7EB, rounded-lg, left icon; FOCUSED = 2px solid black border
- Placeholders: #9CA3AF. Labels: #333 small/medium
- Success banner: light green bg, dark green text, thick green left border
- Error banner: light red/pink bg, dark red text, thick red left border
- Font: Inter (via next/font)
- Auth layout: split screen. LEFT: full-height photo, dark gradient overlay, white bold headline + subtext bottom-left area, carousel dots (yellow pill active). RIGHT: white, centered form max-w ~460px
- Status badges (dashboards): draft=grey, submitted=blue, approved=green, rejected=red

## Rules
- Design PNGs live in /design — match them closely
- Migrations go in /supabase/migrations as pasteable .sql
- Loading, empty, error states everywhere
- Small descriptive commits; no unrequested features
