update public.user_memberships as membership
set status = 'trialing',
    trial_days = discount.grant_days,
    trial_started_at = redemption.created_at,
    trial_ends_at = redemption.created_at + make_interval(days => discount.grant_days),
    updated_at = now()
from public.discount_codes as discount
join public.discount_code_redemptions as redemption
  on redemption.discount_code_id = discount.id
where membership.discount_code_id = discount.id
  and redemption.user_id = membership.user_id
  and discount.active = true
  and discount.grant_days is not null
  and membership.status <> 'active'
  and (
    membership.trial_ends_at is null
    or membership.trial_ends_at < redemption.created_at + make_interval(days => discount.grant_days)
  );
