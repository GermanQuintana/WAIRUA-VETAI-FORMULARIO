# WAIRUA VetAI project context

## Product

- WAIRUA VetAI is a bilingual (Spanish/English) veterinary clinical web application for official medicine searches, therapeutic knowledge, calculators, and professional workflows.
- The product should feel trustworthy, precise, calm, and easy to use during a consultation. Prefer clear orientation and direct actions over marketing language inside the authenticated application.
- The public landing page explains the product before sign-in. Registration must not be the only way to understand what WAIRUA does.
- Official sources currently referenced by the product include CIMAVET, CIMA, and AEMPS. USDA FoodData Central is used through a server-side Supabase Edge Function for clinical nutrition searches.

## Company identity

- Legal name: Wairua Veterinary Precision Medicine, S.L.U.
- Legal form: Sociedad Limitada Unipersonal (startup).
- Tax ID (NIF): B25948050.
- Public contact email currently used by the app: `gerqd79@gmail.com`.
- Registered address: Avenida da Mariña 63, 2.º A, 27880 Burela, Lugo, Spain.
- The registered address is the founder's private home and is temporary until the company has commercial premises. Do not show it in ordinary interface copy, marketing content, screenshots, or permanent footers. Use it only where legally required, such as the full legal notice or formal company documents.
- Legal and privacy copy in the repository is an implementation draft and should receive professional legal review before public launch.
- The current app uses only technical/exempt storage and has no analytics, advertising, or tracking integration. The UI shows a single acknowledgement notice without category controls. Do not add granular consent choices unless a non-essential integration is actually introduced.

## Stack and commands

- Frontend: React 18, TypeScript, and Vite 5.
- Styling: native CSS. `src/styles.css` contains the original shared system and `src/design.css` is imported afterwards for the current public/clinical redesign and overrides.
- Backend services: Supabase Auth, Postgres, and Edge Functions.
- Billing: Stripe through Supabase Edge Functions.
- Hosting: Vercel; build output is `dist`.
- Install and run: `npm install`, then `npm run dev`.
- Required verification after code changes: `npm run build` (`tsc && vite build`). There is currently no automated test suite, so browser verification is required for interaction or layout changes.

## Important files

- `src/App.tsx`: application orchestrator, authentication boundary, navigation, medicine searches, and authenticated workspace composition.
- `src/components/PublicLanding.tsx`: public presentation shown before sign-in.
- `src/components/AuthAccessPanel.tsx`: sign-in, registration, plans, trial, profile, billing, and admin access UI.
- `src/components/LegalCompliance.tsx`: legal footer, privacy/terms/cookie dialogs, and cookie preference UI.
- `src/components/ThemeIcon.tsx`: shared sun/moon representation.
- `src/services/supabase.ts`: authentication, profiles, roles, memberships, discounts, support, and admin access operations.
- `src/services/cimavet.ts` and `src/services/cima.ts`: official veterinary and human medicine API clients.
- `src/data/`: curated and generated clinical datasets. Preserve provenance and evidence when modifying clinical content.
- `supabase/schema.sql`, `supabase/migrations/`, and `supabase/functions/`: database and server-side behavior.
- `supabase/stripe-setup.md`: billing deployment and secret configuration.

## Authentication and access

- Supabase supports email/password and Google OAuth. Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the app uses its demo fallback.
- Account types: `free`, `premium`, `company`, and `partner`.
- Editorial roles: `viewer`, `contributor`, `editor`, `reviewer`, and `admin`. A user may hold multiple roles; do not reduce role handling to a single-role assumption.
- Editorial states include `draft`, `under_review`, `approved`, and publication status.
- The full-access trial is 10 days. After it ends, free functionality remains available unless premium is activated.

## Plans

- Individual Premium: 18 EUR/month.
- Clinic: 39 EUR/month plus 7 EUR/veterinarian/month.
- Free access includes official veterinary medicine and essential OTC/basic searches; premium unlocks advanced knowledge and the complete clinical toolkit.
- Do not claim that prices include VAT until the company confirms the tax presentation. Pricing must be visible before paid checkout and should explain what remains free.

## UI and content conventions

- Every user-facing change must work in Spanish and English, light and dark themes, desktop and mobile layouts.
- In the authenticated app, favor compact workspace hierarchy, readable density, and high contrast. Avoid repeated page titles, oversized language controls, and decorative card grids.
- The theme control represents the current mode: sun in light mode and moon in dark mode. Keep the glyph optically and geometrically centered.
- Use `/favicon-wairua-128.png` as the transparent WAIRUA mark in compact UI. Do not reuse `src/assets/wairua-logo.jpg` where its white rectangular background would be visible.
- Keep company name and logo from being duplicated in the same compact brand block.
- Public presentation navigation uses concise slides/dots so users can understand the product without excessive vertical scrolling; keep sign-in readily accessible.
- Do not remove or weaken keyboard labels, accessible names, focus states, or responsive behavior when simplifying the visual design.

## Clinical and editorial safety

- WAIRUA supports professional judgement; it does not replace the official product information, applicable regulation, or the responsible veterinarian's clinical decision.
- OTC product links must point to the official manufacturer or brand website, never to retailers, distributors, marketplaces, or third-party product databases. Prefer the official product page; if neither the official product page nor the manufacturer's catalogue is functional, show a non-clickable "official page unavailable / manufacturer website issue" notice and do not replace it with a commercial reseller.
- New or changed therapeutic recommendations need a verifiable scientific or official source, applicable species, indication, dose context, contraindications, and evidence level where relevant.
- Prefer clinical guidelines, systematic reviews, controlled studies, and official regulatory records. Explicitly label low evidence and justify off-label content.
- Never invent regulatory, therapeutic, company, or pricing facts to fill missing content.

## Environment and secrets

- Public frontend variables are documented in `.env.example`: `VITE_APP_BASE_PATH`, CIMA/CIMAVET base URLs, and Supabase public URL/anon key.
- Never commit `.env` files or expose service-role, Stripe secret/webhook, USDA, or other server secrets through a `VITE_` variable.
- `USDA_FDC_API_KEY` belongs in Supabase secrets. Stripe secret keys and price IDs also belong in Supabase Edge Function secrets.
- When deploying, keep Supabase Auth Site URL and Redirect URLs aligned with the Vercel production/preview domains.

## Change and verification checklist

- Preserve unrelated user changes in the working tree.
- After every WAIRUA production deployment, explicitly remind the user to close the current session and sign in again before validating the changes. If the site was already open before deployment, also ask them to force-refresh or close and reopen the tab so the new bundle is loaded.
- For UI work, verify the public landing, authentication screen, and authenticated workspace when the change can affect them.
- Check both themes for contrast and inspect common responsive breakpoints.
- For auth, roles, billing, or database changes, inspect the corresponding Supabase function/migration and avoid relying only on frontend state.
- Run `npm run build` before handing off changes. Report any existing bundle-size warning separately from functional build failures.
