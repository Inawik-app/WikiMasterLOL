-- Forge seal, spending essence, and who discovered what.
-- Apply once in the Supabase SQL editor, after 0002.

-- Forge seal: one point for each day the player opens at least one booster. It never resets.
-- Days 14, 21 and 28 of every 28-day cycle give a card (mythic, ultimate, transcendent).
--   seal_days        days played so far
--   seal_last_day    the last day that counted, in Paris time
--   seal_claimed_day the last reward day the player has collected
alter table public.profiles
  add column seal_days integer not null default 0 check (seal_days >= 0),
  add column seal_last_day date,
  add column seal_claimed_day integer not null default 0 check (seal_claimed_day >= 0);

-- Same as in 0002, plus the seal: the first booster of the day adds one day.
create or replace function public.open_booster(p_user uuid, p_cards text[], p_essences integer[])
returns table (card text, is_new boolean)
language plpgsql
set search_path = ''
as $$
declare
  i integer;
  inserted integer;
  gained integer := 0;
  today date := (now() at time zone 'Europe/Paris')::date;
begin
  if array_length(p_cards, 1) is distinct from array_length(p_essences, 1) then
    raise exception 'cards and essences differ in length';
  end if;

  update public.profiles
    set booster_anchor = greatest(booster_anchor, now() - interval '8 hours') + interval '1 hour',
        seal_days = seal_days + case when seal_last_day is distinct from today then 1 else 0 end,
        seal_last_day = today
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

-- The next reward day after the one last collected: 14, 21, 28, 42, 49, 56...
-- The same rule is in src/lib/forge.ts for the display.
create function public.next_seal_milestone(p_claimed integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select min(d)
  from (values ((p_claimed / 28) * 28 + 14), ((p_claimed / 28) * 28 + 21), ((p_claimed / 28) * 28 + 28)) as m(d)
  where d > p_claimed;
$$;

-- Collects the next seal reward. The server picks the card (one the player does not own);
-- if the player already owns every card of that rarity it passes essence instead.
-- Fails with 'no_seal' when p_day is not the next reward or has not been reached.
create function public.claim_seal(p_user uuid, p_day integer, p_card text, p_essence integer)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.profiles
    set seal_claimed_day = p_day, essence = essence + coalesce(p_essence, 0)
    where id = p_user
      and p_day = public.next_seal_milestone(seal_claimed_day)
      and p_day <= seal_days;
  if not found then
    raise exception 'no_seal';
  end if;
  if p_card is not null then
    insert into public.collection (user_id, card_id) values (p_user, p_card);
  end if;
end;
$$;

-- Pays for a card with essence. Both steps succeed or neither does: an error on the second
-- (card already owned) also cancels the payment.
create function public.spend_essence(p_user uuid, p_card text, p_price integer)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_price <= 0 then
    raise exception 'invalid price';
  end if;
  update public.profiles set essence = essence - p_price where id = p_user and essence >= p_price;
  if not found then
    raise exception 'not_enough_essence';
  end if;
  insert into public.collection (user_id, card_id) values (p_user, p_card);
end;
$$;

-- Only the server may call these.
revoke execute on function public.open_booster(uuid, text[], integer[]) from public, anon, authenticated;
revoke execute on function public.claim_seal(uuid, integer, text, integer) from public, anon, authenticated;
revoke execute on function public.spend_essence(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.open_booster(uuid, text[], integer[]) to service_role;
grant execute on function public.claim_seal(uuid, integer, text, integer) to service_role;
grant execute on function public.spend_essence(uuid, text, integer) to service_role;

-- Who found each card first. Used to reveal the rarest cards to the whole group.
create view public.discoveries with (security_invoker = true) as
  select distinct on (c.card_id) c.card_id, p.username, c.first_obtained_at
  from public.collection c
  join public.profiles p on p.id = c.user_id
  order by c.card_id, c.first_obtained_at;

grant select on public.discoveries to authenticated, service_role;
