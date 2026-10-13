-- Duplicates that upgrade a card (ranks, chromas), and a rate limit for the server actions.
-- Apply once in the Supabase SQL editor, after 0006.

-- `copies` now counts for ranked skins: it is the rank (1 = Fer ... 10 = Challenger).
--   chromas       chromas the player has unlocked for this skin
--   chroma        the one currently worn, null for the original look
--   chroma_picks  chromas earned by duplicates and not chosen yet
alter table public.collection
  add column chromas integer[] not null default '{}',
  add column chroma integer,
  add column chroma_picks integer not null default 0 check (chroma_picks >= 0);

-- New version of open_booster; the three-argument one from 0003 stays until the site is updated.
-- For each card the server says what a duplicate does (p_modes: 'essence', 'rank' or 'chroma')
-- and where that stops (p_caps: highest rank, or number of chromas). Past the cap, or in
-- 'essence' mode, a duplicate gives p_essences as before.
-- Returns, for each card: outcome 'new', 'essence', 'rank' or 'chroma', and the rank reached.
create function public.open_booster(p_user uuid, p_cards text[], p_essences integer[], p_modes text[], p_caps integer[])
returns table (card text, outcome text, level integer)
language plpgsql
set search_path = ''
as $$
declare
  i integer;
  changed integer;
  gained integer := 0;
  today date := (now() at time zone 'Europe/Paris')::date;
begin
  if array_length(p_cards, 1) is distinct from array_length(p_essences, 1)
     or array_length(p_cards, 1) is distinct from array_length(p_modes, 1)
     or array_length(p_cards, 1) is distinct from array_length(p_caps, 1) then
    raise exception 'arrays differ in length';
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
    card := p_cards[i];
    level := null;
    insert into public.collection (user_id, card_id) values (p_user, p_cards[i])
      on conflict do nothing;
    get diagnostics changed = row_count;
    if changed = 1 then
      outcome := 'new';
    else
      outcome := 'essence';
      if p_modes[i] = 'rank' then
        update public.collection c set copies = c.copies + 1
          where c.user_id = p_user and c.card_id = p_cards[i] and c.copies < p_caps[i]
          returning c.copies into level;
        if found then outcome := 'rank'; end if;
      elsif p_modes[i] = 'chroma' then
        update public.collection c set chroma_picks = c.chroma_picks + 1
          where c.user_id = p_user and c.card_id = p_cards[i]
            and c.chroma_picks + cardinality(c.chromas) < p_caps[i];
        if found then outcome := 'chroma'; end if;
      end if;
      if outcome = 'essence' then
        gained := gained + p_essences[i];
      end if;
    end if;
    return next;
  end loop;

  update public.profiles set essence = essence + gained where id = p_user;
end;
$$;

-- Spends one earned pick to unlock a chroma, and wears it. Fails with 'no_pick' when the
-- player has none left or already owns that chroma. The server checks that the chroma
-- belongs to the skin.
create function public.unlock_chroma(p_user uuid, p_card text, p_chroma integer)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.collection
    set chromas = chromas || p_chroma, chroma = p_chroma, chroma_picks = chroma_picks - 1
    where user_id = p_user and card_id = p_card and chroma_picks > 0 and not (p_chroma = any (chromas));
  if not found then
    raise exception 'no_pick';
  end if;
end;
$$;

-- Rate limit: how many server actions a player has run in the current window.
create table public.rate_limits (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);
alter table public.rate_limits enable row level security; -- no policy: the server only

-- Counts one action. False when the player went over p_max actions in p_seconds.
create function public.rate_limit(p_user uuid, p_max integer, p_seconds integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  current_hits integer;
begin
  insert into public.rate_limits as r (user_id, window_start, hits) values (p_user, now(), 1)
    on conflict (user_id) do update
      set hits = case when r.window_start < now() - make_interval(secs => p_seconds) then 1 else r.hits + 1 end,
          window_start = case when r.window_start < now() - make_interval(secs => p_seconds) then now() else r.window_start end
    returning r.hits into current_hits;
  return current_hits <= p_max;
end;
$$;

revoke execute on function public.open_booster(uuid, text[], integer[], text[], integer[]) from public, anon, authenticated;
revoke execute on function public.unlock_chroma(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.rate_limit(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.open_booster(uuid, text[], integer[], text[], integer[]) to service_role;
grant execute on function public.unlock_chroma(uuid, text, integer) to service_role;
grant execute on function public.rate_limit(uuid, integer, integer) to service_role;
