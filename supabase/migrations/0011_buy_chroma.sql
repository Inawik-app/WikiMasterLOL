-- Buying a chroma with essence. Apply once, after 0010.

-- Pays for a chroma of a skin the player owns, unlocks it and wears it, all or nothing.
-- The server sets the price and checks that the chroma belongs to the skin. Fails with:
--   not_enough_essence  the player cannot afford it
--   no_chroma           the player does not own the skin, or already has this chroma
create function public.buy_chroma(p_user uuid, p_card text, p_chroma integer, p_price integer)
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
  update public.collection
    set chromas = chromas || p_chroma, chroma = p_chroma
    where user_id = p_user and card_id = p_card and not (p_chroma = any (chromas));
  if not found then
    raise exception 'no_chroma';
  end if;
end;
$$;

revoke execute on function public.buy_chroma(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.buy_chroma(uuid, text, integer, integer) to service_role;
