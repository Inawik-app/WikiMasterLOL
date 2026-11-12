-- Who found each card first, kept for good. Apply once in the Supabase SQL editor, after 0011.
-- Until now the discoverer was worked out from who owns the card today, so a gift made the
-- receiver look like the discoverer.

create table public.discoverers (
  card_id text primary key,
  -- shortcut: a deleted account takes its discoveries with it; those cards then read as
  -- undiscovered even if others own them. Reassign them on deletion if that ever matters.
  user_id uuid not null references public.profiles (id) on delete cascade,
  found_at timestamptz not null default now()
);
create index discoverers_user_id_idx on public.discoverers (user_id);
alter table public.discoverers enable row level security; -- no policy: the server only

-- Every card that enters a collection is offered as a discovery; only the first one sticks.
-- A gift moves a row (update, not insert), so it never changes the discoverer.
create function public.record_discovery()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.discoverers (card_id, user_id, found_at)
    values (new.card_id, new.user_id, new.first_obtained_at)
    on conflict (card_id) do nothing;
  return new;
end;
$$;

create trigger on_collection_insert
  after insert on public.collection
  for each row execute function public.record_discovery();

-- Fill it from what is known today: the earliest owner of each card...
insert into public.discoverers (card_id, user_id, found_at)
  select distinct on (card_id) card_id, user_id, first_obtained_at
  from public.collection
  order by card_id, first_obtained_at;

-- ...corrected by the gifts that list their cards (since migration 0010): a card given away
-- was the giver's before the gift. The earliest giver wins when they had it before the owner
-- found above.
with first_gift as (
  select distinct on (card) card, from_id, given_at
  from public.gifts, unnest(card_ids) as card
  order by card, given_at
)
update public.discoverers d
  set user_id = g.from_id, found_at = g.given_at
  from first_gift g
  -- The gift is logged a moment after the card moves: a minute of slack covers it.
  where d.card_id = g.card and g.given_at <= d.found_at + interval '1 minute' and g.from_id <> d.user_id;

-- The view keeps its name and columns, so the site reads it as before.
drop view public.discoveries;
create view public.discoveries with (security_invoker = true) as
  select d.card_id, p.username, d.found_at as first_obtained_at
  from public.discoverers d
  join public.profiles p on p.id = d.user_id;
grant select on public.discoveries to service_role;
