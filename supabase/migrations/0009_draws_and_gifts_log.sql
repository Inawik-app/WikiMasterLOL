-- What the weekly recap needs to talk about luck and generosity.
-- Apply once in the Supabase SQL editor, after 0008.

-- Every card that came out of a booster, duplicates included: the collection only keeps the
-- new ones, which is not enough to compare a player's week with the odds.
-- Five rows per booster. The recap deletes rows older than two months.
create table public.draws (
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id text not null,
  rarity text not null,
  drawn_at timestamptz not null default now()
);
create index draws_drawn_at_idx on public.draws (drawn_at);
create index draws_user_id_idx on public.draws (user_id);

-- Every gift made between friends.
create table public.gifts (
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  cards integer not null default 0 check (cards >= 0),
  essence integer not null default 0 check (essence >= 0),
  given_at timestamptz not null default now()
);
create index gifts_given_at_idx on public.gifts (given_at);
create index gifts_from_id_idx on public.gifts (from_id);
create index gifts_to_id_idx on public.gifts (to_id);

-- No policy: only the server reads and writes these.
alter table public.draws enable row level security;
alter table public.gifts enable row level security;
