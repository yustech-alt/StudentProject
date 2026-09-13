# ProjectSupport

A marketplace that connects Nigerian university students with verified experts for
milestone-based final year project support, with real payments and payouts.

## Stack

- Vite, React, TypeScript, Tailwind CSS, shadcn/ui
- Supabase (Postgres, Auth, Storage, Edge Functions, Realtime)
- Paystack for payments

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL and publishable key
npm run dev
```

## Database

All schema lives in `supabase/migrations/`. To apply it to your own Supabase
project:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## Edge functions

Three functions live in `supabase/functions/`:

- `setup-first-admin`: one-time bootstrap for the first admin account.
- `paystack-initialize`: starts a Paystack checkout for a project's package price.
- `paystack-webhook`: verifies Paystack's payment confirmation and activates the project.

Deploy them and set your Paystack secret key:

```bash
npx supabase functions deploy setup-first-admin
npx supabase functions deploy paystack-initialize
npx supabase functions deploy paystack-webhook
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

Then point your Paystack webhook URL (Dashboard > Settings > API Keys & Webhooks) at:

```
https://<your-project-ref>.supabase.co/functions/v1/paystack-webhook
```

## Testing

```bash
npm run test
```

## Roles

- **Student**: posts a project, pays for a package, works through milestones with an expert.
- **Expert**: applies for review, gets verified by an admin, gets assigned to projects, requests payouts.
- **Admin**: reviews expert applications, assigns experts to projects, manages payouts and disputes.

The first admin account is created once, at `/admin-setup`, by any logged-in
user, and only while no admin exists yet. After that, promote further admins
directly in the `user_roles` table.
# StudentProject
