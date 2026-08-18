create table if not exists public.assessment_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')), version text not null default 'v1-three-problem',
  onboarding jsonb not null default '{}'::jsonb, started_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.assessment_items (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  problem_slug text not null, sequence integer not null, started_at timestamptz not null default now(), completed_at timestamptz, duration_seconds integer
);
create table if not exists public.assessment_responses (
  id uuid primary key default gen_random_uuid(), item_id uuid not null unique references public.assessment_items(id) on delete cascade,
  result text not null check (result in ('solved','partial','stuck')), hint_count integer not null default 0,
  approach text not null default '', complexity text not null default '', data_structure text, code text, explanation text, metadata jsonb not null default '{}'::jsonb
);
create table if not exists public.learner_observations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  assessment_session_id uuid references public.assessment_sessions(id) on delete set null, problem_slug text not null,
  skill text not null, observation_type text not null, evidence text not null, created_at timestamptz not null default now()
);
create table if not exists public.learner_hypotheses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null, status text not null check (status in ('unknown','developing','strong')), confidence numeric not null default 0,
  evidence_count integer not null default 0, evidence jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now(), unique(user_id, skill)
);
create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null default '', timeline text not null default '', available_time text not null default '', recommendation jsonb not null default '{}'::jsonb,
  status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.learning_path_items (
  id uuid primary key default gen_random_uuid(), path_id uuid not null references public.learning_paths(id) on delete cascade,
  position integer not null, item_type text not null, title text not null, target_skill text, reason text not null, estimated_minutes integer not null default 30, status text not null default 'queued'
);

alter table public.assessment_sessions enable row level security;
alter table public.assessment_items enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.learner_observations enable row level security;
alter table public.learner_hypotheses enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_path_items enable row level security;
create policy "assessment sessions own access" on public.assessment_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assessment items own access" on public.assessment_items for all using (exists (select 1 from public.assessment_sessions s where s.id = session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.assessment_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "assessment responses own access" on public.assessment_responses for all using (exists (select 1 from public.assessment_items i join public.assessment_sessions s on s.id = i.session_id where i.id = item_id and s.user_id = auth.uid())) with check (exists (select 1 from public.assessment_items i join public.assessment_sessions s on s.id = i.session_id where i.id = item_id and s.user_id = auth.uid()));
create policy "observations own access" on public.learner_observations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "hypotheses own access" on public.learner_hypotheses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "paths own access" on public.learning_paths for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "path items own access" on public.learning_path_items for all using (exists (select 1 from public.learning_paths p where p.id = path_id and p.user_id = auth.uid())) with check (exists (select 1 from public.learning_paths p where p.id = path_id and p.user_id = auth.uid()));
