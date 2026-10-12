-- Boosters and essence. Apply once in the Supabase SQL editor, after 0001.

-- booster_anchor: boosters are counted from this moment, one per hour, eight at most.
--   available = min(8, whole hours elapsed since booster_anchor)
-- A new player starts with a full stock. The same two numbers (1 hour, 8 boosters) are in
-- src/lib/booster.ts for the display: change both together.
-- essence: earned when a booster gives a card the player already owns.
alter table public.profiles
  add column booster_anchor timestamptz not null default now() - interval '8 hours',
  add column essence integer not null default 0 check (essence >= 0);

-- Opens one booster for a player, in a single transaction:
--   1. takes one booster from the stock, or fails with 'no_booster';
--   2. adds each card to the collection; a card already owned gives its essence instead.
-- The cards and their essence values are drawn by the server (src/lib/booster.ts) and passed in.
-- Two calls at the same time cannot both spend the same booster: the first UPDATE locks the
-- player's row, and the second then sees the stock already reduced.
create function public.open_booster(p_user uuid, p_cards text[], p_essences integer[])
returns table (card text, is_new boolean)
language plpgsql
set search_path = ''
as $$
declare
  i integer;
  inserted integer;
  gained integer := 0;
begin
  if array_length(p_cards, 1) is distinct from array_length(p_essences, 1) then
    raise exception 'cards and essences differ in length';
  end if;

  update public.profiles
    set booster_anchor = greatest(booster_anchor, now() - interval '8 hours') + interval '1 hour'
    where id = p_user and booster_anchor <= now() - interval '1 hour';
  if not found then
    raise exception 'no_booster';
  end if;

  for i in 1 .. array_length(p_cards, 1) loop
    insert into public.collection (user_id, card_id) values (p_user, p_cards[i])
      on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then
      gained := gained + p_essences[i];
    end if;
    card := p_cards[i];
    is_new := inserted = 1;
    return next;
  end loop;

  update public.profiles set essence = essence + gained where id = p_user;
end;
$$;

-- Only the server may open boosters: players cannot call this from their browser.
revoke execute on function public.open_booster(uuid, text[], integer[]) from public, anon, authenticated;
grant execute on function public.open_booster(uuid, text[], integer[]) to service_role;
