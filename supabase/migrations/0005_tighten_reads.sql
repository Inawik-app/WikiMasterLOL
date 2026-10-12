-- The site is open to any Discord account: a signed-in player now reads only their own rows.
-- Everything shown about other players (friends, their collections, who discovered a card)
-- goes through the server, which checks what may be seen. Apply once, after 0004.

drop policy "Signed-in players read every profile" on public.profiles;
drop policy "Signed-in players read every collection" on public.collection;

create policy "Players read their own profile"
  on public.profiles for select to authenticated using (id = (select auth.uid()));

create policy "Players read their own collection"
  on public.collection for select to authenticated using (user_id = (select auth.uid()));

-- Only the server reads who discovered what.
revoke select on public.discoveries from authenticated;

-- Internal helpers: nothing for a client to call.
revoke execute on function public.next_seal_milestone(integer) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.next_seal_milestone(integer) to service_role;
