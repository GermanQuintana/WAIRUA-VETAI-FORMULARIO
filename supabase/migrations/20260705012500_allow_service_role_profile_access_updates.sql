create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;

  if auth.uid() = new.id then
    new.role := old.role;
    new.roles := old.roles;
    new.account_type := old.account_type;
    new.partner_category := old.partner_category;
  end if;

  return new;
end;
$$;
