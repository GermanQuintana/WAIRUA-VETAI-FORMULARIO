# Stripe setup

## 1. Create products and prices in Stripe

- Create one recurring product for `WAIRUA VetAI Premium`.
- Create one monthly price and copy its `price_...` id.
- Create one annual price and copy its `price_...` id.
- If you want partner discounts inside Stripe, create the matching coupon or promotion code and copy its id.

## 2. Configure environment variables in Supabase

Set these secrets for Edge Functions:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_ANNUAL_PRICE_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 3. Deploy the schema and functions

Apply [schema.sql](/Users/germanquintana/Documents/PROYECTOS%20CODEX/GUIA%20TERAPEUTICA/supabase/schema.sql), then deploy:

- `supabase functions deploy stripe-create-checkout-session`
- `supabase functions deploy stripe-create-billing-portal-session`
- `supabase functions deploy stripe-webhook`

## 4. Connect the Stripe webhook

Create a webhook endpoint in Stripe pointing to:

- `https://<your-project-ref>.functions.supabase.co/stripe-webhook`

Subscribe at least to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## 5. Enable invoices in Stripe

- In Stripe Billing, keep subscription invoicing enabled.
- In the Stripe customer portal configuration, enable invoice history so users can download invoices from the portal.

## 6. Optional partner discounts

If you use `discount_codes` in Supabase and want Stripe to bill the same discounted amount:

- Fill `stripe_coupon_id` or `stripe_promotion_code_id` in `public.discount_codes`.
- Reuse the same code naming between Supabase and Stripe to avoid confusion.
