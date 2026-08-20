# Universal E-Logbook (MVP — 4-day build)

Web platform digitizing the SIWES industrial training logbook for Nigerian universities.
This is a PITCH DEMO. Prioritize working + visually matching the design over perfect architecture.

## Roles
- student: creates/edits/submits log entries with media evidence
- supervisor: reviews assigned students' entries, comments, approves/rejects
- admin: manages users, assigns supervisors to students, sees platform stats

## Stack
- Next.js 14 App Router + TypeScript + Tailwind CSS (single codebase, src/ dir, @/* alias)
- Supabase: Postgres (DB), Auth (login), Storage (bucket: entry-media)
- Server logic via Next.js API routes / Server Actions — NO separate backend
- Deploy target: Vercel

## Auth pattern (important)
- Users log in with E-mail + password
- Trick: convert matric to internal email for Supabase Auth
  e.g. RUN/CMP/21/0001 -> run-cmp-21-0001@elogbook.app
- Real E-mail stored in profiles table for display
- After login, read profiles.role and route: student->/student, supervisor->/supervisor, admin->/admin
- Middleware protects each route group by role

## Database tables
- profiles: id (refs auth.users), name, matric_number (unique), role, school, department, level, place_of_work, passport_photo_url
- logbook_entries: id, student_id, type (daily/weekly/monthly), title, date, objective, observations, status (draft/submitted/approved/rejected), created_at, updated_at
- entry_media: id, entry_id, file_url, file_type
- reviews: id, entry_id, reviewer_id, reviewer_role, comment, reviewed_at
- notifications: id, user_id, message, is_read, created_at
- supervisors_students: supervisor_id, student_id

## Status badge colors
draft=grey, submitted=blue, approved=green, rejected=red

## Design
- Figma exports live in /design — ALWAYS open the relevant PNG before building a screen and match layout, colors, spacing closely
- Primary color: 
- Font: FILL_IN_FROM_FIGMA

## Rules
- Every migration goes in /supabase/migrations as a .sql file I can paste into the Supabase SQL editor
- Loading, empty, and error states on every screen
- Small, descriptive git commits after each working feature
- Do not add features that aren't asked for
