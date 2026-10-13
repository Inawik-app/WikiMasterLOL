-- Gifts between friends. Apply once in the Supabase SQL editor, after 0007.

-- Gives cards and essence to a friend, all or nothing.
-- A card moves with everything it carries (rank, chromas); it stops being the giver's favourite
-- and counts as just obtained by the receiver. Fails with:
--   not_friends         the two players are not friends
--   not_enough_essence  the giver does not have that much essence
--   already_owned       the receiver already has one of the cards
--   not_owned           the giver does not have one of the cards
create function public.give(p_from uuid, p_to uuid, p_cards text[], p_essence integer)
returns void
language plpgsql
set search_path = ''
as $$
declare
  moved integer;
begin
  if p_from = p_to or p_essence < 0 then
    raise exception 'invalid_gift';
  end if;
  if not exists (select 1 from public.friendships where user_id = p_from and friend_id = p_to) then
    raise exception 'not_friends';
  end if;

  if p_essence > 0 then
    update public.profiles set essence = essence - p_essence where id = p_from and essence >= p_essence;
    if not found then
      raise exception 'not_enough_essence';
    end if;
    update public.profiles set essence = essence + p_essence where id = p_to;
  end if;

  if coalesce(cardinality(p_cards), 0) > 0 then
    if exists (select 1 from public.collection where user_id = p_to and card_id = any (p_cards)) then
      raise exception 'already_owned';
    end if;
    update public.collection
      set user_id = p_to, favorite = false, first_obtained_at = now()
      where user_id = p_from and card_id = any (p_cards);
    get diagnostics moved = row_count;
    if moved <> (select count(distinct c) from unnest(p_cards) as c) then
      raise exception 'not_owned';
    end if;
  end if;
end;
$$;

revoke execute on function public.give(uuid, uuid, text[], integer) from public, anon, authenticated;
grant execute on function public.give(uuid, uuid, text[], integer) to service_role;
