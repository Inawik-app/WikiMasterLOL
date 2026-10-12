-- Friends. Apply once in the Supabase SQL editor, after 0003.

-- A friendship is two rows, one in each direction, written and removed together by the server.
-- That keeps "who are my friends" a plain lookup on user_id.
create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create index friendships_friend_id_idx on public.friendships (friend_id);

alter table public.friendships enable row level security;

-- A player reads their own list. No write policy: only the server writes.
create policy "Players read their own friendships"
  on public.friendships for select to authenticated using (user_id = (select auth.uid()));
