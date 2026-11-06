-- Supabase Dashboard → SQL Editor → New query → paste → Run

create table public.scores (
  id bigint generated always as identity primary key,
  board text not null check (char_length(board) between 1 and 40),
  name text not null check (char_length(name) between 1 and 16),
  score int not null check (score between 0 and 10000000),
  created_at timestamptz not null default now()
);

create index scores_board_score_idx on public.scores (board, score desc);

alter table public.scores enable row level security;

-- sab leaderboard dekh sakte hain
create policy "anyone can read scores" on public.scores
  for select using (true);

-- sab naya score daal sakte hain (edit/delete nahi)
create policy "anyone can add scores" on public.scores
  for insert with check (true);
