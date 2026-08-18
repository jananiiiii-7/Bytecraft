-- ByteCraft V1: minimal learning-state and coaching foundation.
-- This migration intentionally excludes XP, achievements, leaderboards, and analytics economies.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_date date,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.concepts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  topic text not null,
  core_idea text not null,
  intuition text not null,
  tiny_example text not null,
  common_mistake text not null,
  prerequisite_slugs text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  url text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  topic text not null,
  pattern text not null,
  why_recommended text not null,
  prerequisite_slugs text[] not null default '{}',
  concept_slugs text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_concepts (
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.concepts(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'needs_review')),
  completed_at timestamptz,
  last_practiced_at timestamptz,
  review_count integer not null default 0,
  primary key (user_id, concept_id)
);

create table if not exists public.problem_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  status text not null check (status in ('started', 'attempted', 'solved', 'failed', 'needs_review')),
  approach_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  concept_id uuid references public.concepts(id) on delete set null,
  problem_id uuid references public.problems(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid references public.concepts(id) on delete set null,
  problem_id uuid references public.problems(id) on delete set null,
  mode text not null default 'coach',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coaching_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.coaching_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists learning_goals_user_current_idx on public.learning_goals(user_id, is_current);
create index if not exists problem_attempts_user_problem_idx on public.problem_attempts(user_id, problem_id);
create index if not exists learning_events_user_created_idx on public.learning_events(user_id, created_at desc);
create index if not exists coaching_sessions_user_updated_idx on public.coaching_sessions(user_id, updated_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.learning_goals enable row level security;
alter table public.user_concepts enable row level security;
alter table public.problem_attempts enable row level security;
alter table public.learning_events enable row level security;
alter table public.coaching_sessions enable row level security;
alter table public.coaching_messages enable row level security;

alter table public.concepts enable row level security;
alter table public.problems enable row level security;

drop policy if exists "profiles own access" on public.profiles;
create policy "profiles own access" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "learning goals own access" on public.learning_goals;
drop policy if exists "learnning goals own access" on public.learning_goals;
create policy "learning goals own access" on public.learning_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user concepts own access" on public.user_concepts;
create policy "user concepts own access" on public.user_concepts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "problem attempts own access" on public.problem_attempts;
create policy "problem attempts own access" on public.problem_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "learning events own access" on public.learning_events;
create policy "learning events own access" on public.learning_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "coaching sessions own access" on public.coaching_sessions;
create policy "coaching sessions own access" on public.coaching_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "coaching messages through own session" on public.coaching_messages;
create policy "coaching messages through own session" on public.coaching_messages
for all using (exists (select 1 from public.coaching_sessions s where s.id = session_id and s.user_id = auth.uid()))
with check (exists (select 1 from public.coaching_sessions s where s.id = session_id and s.user_id = auth.uid()));

drop policy if exists "concepts readable" on public.concepts;
create policy "concepts readable" on public.concepts for select to authenticated using (true);
drop policy if exists "problems readable" on public.problems;
create policy "problems readable" on public.problems for select to authenticated using (true);

insert into public.concepts (slug, title, topic, core_idea, intuition, tiny_example, common_mistake, prerequisite_slugs, sort_order) values
('arrays', 'Arrays', 'Foundations', 'Arrays store values in indexed order, making direct access fast.', 'Think of an array as a row of numbered boxes. The index tells you which box to open.', 'Read nums[3] when you need the fourth value.', 'Confusing an index with a value or walking the array more times than necessary.', '{}', 1)
on conflict (slug) do update set title = excluded.title, topic = excluded.topic, core_idea = excluded.core_idea, intuition = excluded.intuition, tiny_example = excluded.tiny_example, common_mistake = excluded.common_mistake, prerequisite_slugs = excluded.prerequisite_slugs, sort_order = excluded.sort_order;
insert into public.concepts (slug, title, topic, core_idea, intuition, tiny_example, common_mistake, prerequisite_slugs, sort_order) values
('hash-maps', 'Hash Maps', 'Lookup Patterns', 'A hash map trades memory for fast key-based lookup.', 'Instead of searching every box, label useful information so you can jump to it.', 'Store each number as a key before checking whether its complement exists.', '', '{arrays}', 2)
on conflict (slug) do update set title = excluded.title, topic = excluded.topic, core_idea = excluded.core_idea, intuition = excluded.intuition, tiny_example = excluded.tiny_example, common_mistake = excluded.common_mistake, prerequisite_slugs = excluded.prerequisite_slugs, sort_order = excluded.sort_order;
insert into public.concepts (slug, title, topic, core_idea, intuition, tiny_example, common_mistake, prerequisite_slugs, sort_order) values
('two-pointers', 'Two Pointers', 'Traversal Patterns', 'Two indices can scan a structured sequence without repeated work.', 'Place two fingers on meaningful positions and move the one that can improve the answer.', 'Move left or right inward on a sorted array.', '', '{arrays}', 3)
on conflict (slug) do update set title = excluded.title, topic = excluded.topic, core_idea = excluded.core_idea, intuition = excluded.intuition, tiny_example = excluded.tiny_example, common_mistake = excluded.common_mistake, prerequisite_slugs = excluded.prerequisite_slugs, sort_order = excluded.sort_order;
insert into public.concepts (slug, title, topic, core_idea, intuition, tiny_example, common_mistake, prerequisite_slugs, sort_order) values
('sliding-window', 'Sliding Window', 'Traversal Patterns', 'A window tracks a contiguous range while expanding and shrinking deliberately.', 'Keep only the active segment instead of recomputing every subarray from scratch.', 'Move the right edge forward, then move the left edge when a constraint breaks.', '', '{arrays,hash-maps}', 4)
on conflict (slug) do update set title = excluded.title, topic = excluded.topic, core_idea = excluded.core_idea, intuition = excluded.intuition, tiny_example = excluded.tiny_example, common_mistake = excluded.common_mistake, prerequisite_slugs = excluded.prerequisite_slugs, sort_order = excluded.sort_order;

insert into public.problems (slug, title, url, difficulty, topic, pattern, why_recommended, prerequisite_slugs, concept_slugs, sort_order)
values
('two-sum', 'Two Sum', 'https://leetcode.com/problems/two-sum/', 'easy', 'Arrays', 'Hash Map', 'Recommended because you just learned how lookup can replace repeated searching.', '{arrays}', '{arrays,hash-maps}', 1),
('valid-anagram', 'Valid Anagram', 'https://leetcode.com/problems/valid-anagram/', 'easy', 'Hash Maps', 'Frequency Map', 'Recommended because it turns a concept into a small, concrete counting problem.', '{arrays,hash-maps}', '{hash-maps}', 2),
('best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', 'easy', 'Arrays', 'One-Pass Scan', 'Recommended because it asks you to track the right information while scanning once.', '{arrays}', '{arrays}', 3),
('valid-palindrome', 'Valid Palindrome', 'https://leetcode.com/problems/valid-palindrome/', 'easy', 'Two Pointers', 'Two Pointers', 'Recommended because two meaningful ends of a sequence suggest a two-pointer approach.', '{arrays,two-pointers}', '{arrays,two-pointers}', 4),
('longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', 'medium', 'Sliding Window', 'Sliding Window', 'Recommended after lookup patterns because the window needs fast membership checks.', '{arrays,hash-maps,sliding-window}', '{hash-maps,sliding-window}', 5)
on conflict (slug) do update set title = excluded.title, url = excluded.url, difficulty = excluded.difficulty, topic = excluded.topic, pattern = excluded.pattern, why_recommended = excluded.why_recommended, prerequisite_slugs = excluded.prerequisite_slugs, concept_slugs = excluded.concept_slugs, sort_order = excluded.sort_order;
