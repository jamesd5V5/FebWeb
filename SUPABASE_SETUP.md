## Supabase setup (GitHub Pages friendly)

This app is a static frontend. It **cannot write to JSON files** in your repo at runtime.
Instead, it stores quiz answers in **Supabase Postgres** and computes accuracy across days from those rows.

### 1) Supabase Auth settings
- In Supabase dashboard → **Authentication → Providers → Email**
  - Enable **Email**
  - Enable **Email + Password**
  - For easiest testing: disable “Confirm email” (optional, your choice)

### 2) Create tables + RLS (SQL Editor)
Paste this into **SQL Editor** and run:

```sql
create extension if not exists pgcrypto;

-- Couples
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Couple membership: links auth users to a couple and assigns role (james/jess)
create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('james','jess')),
  display_name text not null,
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (couple_id, role)
);

-- One row per answered question per user
create table if not exists public.quiz_answers (
  couple_id uuid not null references public.couples(id) on delete cascade,
  day_key text not null,
  question_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  guess text not null check (guess in ('james','jess')),
  correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (couple_id, day_key, question_id, user_id)
);

alter table public.couple_members enable row level security;
alter table public.quiz_answers enable row level security;

-- IMPORTANT:
-- Do NOT write a couple_members policy that queries couple_members inside itself.
-- Postgres will throw: "infinite recursion detected in policy for relation \"couple_members\""
-- (That’s what you hit.)

-- Couple members can read ONLY their own membership row.
-- (The app no longer needs to read the other person’s member row.)
drop policy if exists "cm_read_for_members" on public.couple_members;
drop policy if exists "cm_read_own" on public.couple_members;
create policy "cm_read_own"
on public.couple_members
for select
using (user_id = auth.uid());

-- Members can read answers for couples they belong to
drop policy if exists "qa_read_for_members" on public.quiz_answers;
create policy "qa_read_for_members"
on public.quiz_answers
for select
using (
  exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = quiz_answers.couple_id
      and cm.user_id = auth.uid()
  )
);

-- Members can write their own answers (only in their couple)
drop policy if exists "qa_insert_own" on public.quiz_answers;
create policy "qa_insert_own"
on public.quiz_answers
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = quiz_answers.couple_id
      and cm.user_id = auth.uid()
  )
);

drop policy if exists "qa_update_own" on public.quiz_answers;
create policy "qa_update_own"
on public.quiz_answers
for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = quiz_answers.couple_id
      and cm.user_id = auth.uid()
  )
);

drop policy if exists "qa_delete_own" on public.quiz_answers;
create policy "qa_delete_own"
on public.quiz_answers
for delete
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = quiz_answers.couple_id
      and cm.user_id = auth.uid()
  )
);
```

### 3) Create your couple (SQL Editor)
Run:

```sql
insert into public.couples default values returning id;
```

Copy the returned UUID and paste it into `app.js` as `CONFIG.supabase.coupleId`.

### 4) Create users (in the app)
Open the site and use **Sign up** for:
- James email/password
- Jess email/password

### 5) Link both users to the couple (SQL Editor)
After both accounts exist, run:

```sql
-- Replace emails + couple id.
-- James
insert into public.couple_members (couple_id, user_id, role, display_name)
values (
  'PASTE_COUPLE_ID_HERE',
  (select id from auth.users where email = 'james@example.com'),
  'james',
  'James'
);

-- Jess
insert into public.couple_members (couple_id, user_id, role, display_name)
values (
  'PASTE_COUPLE_ID_HERE',
  (select id from auth.users where email = 'jess@example.com'),
  'jess',
  'Jess'
);
```

Once those rows exist, both accounts will see the **same** progress + multi-day accuracy.

