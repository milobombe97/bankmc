# Nevolute Inc. — transactional email (Resend + Supabase Edge Functions)

Emails are sent **only** from the Supabase Edge Function `transactional-email`. The Vite app never calls Resend.

**Flow:** Database change → **Database Webhook** → Edge Function → **Resend** → customer (+ CC `info@nevoluteinc.com` on user-facing mail).

---

## 1. Resend setup

1. Create an account at [resend.com](https://resend.com).
2. Add and verify your sending domain (e.g. `nevoluteinc.com`) with the DNS records Resend provides (SPF, DKIM, optional DMARC).
3. Create an API key with **Sending access** only.
4. Set the default sender to match your verified domain, e.g. `info@nevoluteinc.com`.

Until the domain is verified you can test with Resend’s sandbox `onboarding@resend.dev` (only delivers to your Resend account email). Update `FROM_EMAIL` in `supabase/functions/_shared/constants.ts` for production.

---

## 2. Supabase secrets (Edge Function only)

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link the project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Set secrets (never put these in the frontend or `.env` committed to git):

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
supabase secrets set SUPABASE_WEBHOOK_SECRET=choose_a_long_random_string
```

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend API (Edge Function only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Look up profile emails / related rows |
| `SUPABASE_URL` | Project URL for admin client |
| `SUPABASE_WEBHOOK_SECRET` | Validates Database Webhook requests (`x-webhook-secret` header) |

`SUPABASE_URL` and service role are also available in the Edge runtime in hosted projects; setting them explicitly keeps local `supabase functions serve` working.

---

## 3. Deploy the Edge Function

```bash
supabase functions deploy transactional-email --no-verify-jwt
```

Function URL:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/transactional-email
```

`supabase/config.toml` sets `verify_jwt = false` so Database Webhooks can call the function with the shared secret instead of a user JWT.

---

## 4. Database Webhooks (Dashboard)

In **Supabase Dashboard → Database → Webhooks**, create one webhook per table (or one webhook with filters if your plan supports it). Recommended: **separate webhooks** for clarity.

**HTTP request settings (all webhooks):**

| Field | Value |
|-------|--------|
| Method | `POST` |
| URL | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/transactional-email` |
| Headers | `x-webhook-secret: <same as SUPABASE_WEBHOOK_SECRET>` |
| Content type | `application/json` |

### Webhook matrix

| Name | Table | Events | Emails triggered |
|------|--------|--------|------------------|
| `email-profiles` | `public.profiles` | INSERT, UPDATE | Welcome (INSERT); suspended / deleted (UPDATE status) |
| `email-kyc` | `public.kyc_submissions` | INSERT, UPDATE | KYC submitted; approved / rejected |
| `email-receipts` | `public.receipts` | INSERT, UPDATE | Receipt submitted; approved / rejected |
| `email-transactions` | `public.transactions` | INSERT | Transfer completed (outgoing `xfer-*` rows only) |

Payload must include **`old_record`** on UPDATE webhooks (default in Supabase) so status transitions are detected.

---

## 5. Events covered

| Event | Trigger | Recipients |
|-------|---------|------------|
| Sign up | `profiles` INSERT | User + CC admin |
| KYC submitted | `kyc_submissions` INSERT | User + CC admin; admin copy email |
| KYC approved / rejected | `kyc_submissions` UPDATE (`status`) | User + CC admin |
| Receipt submitted | `receipts` INSERT | User + CC admin; admin copy |
| Receipt approved / rejected | `receipts` UPDATE (`status`) | User + CC admin |
| Transfer | `transactions` INSERT (`Transfer`, approved, outgoing leg) | Sender + receiver + admin (P2P); user + admin (internal) |
| Account suspended | `profiles` UPDATE → `suspended` | User + CC admin; admin notice |
| Account deleted | `profiles` UPDATE → `deleted` | User + CC admin; admin notice |

Templates live in `supabase/functions/_shared/templates/`.

---

## 6. Testing

### Local serve (optional)

```bash
supabase functions serve transactional-email --no-verify-jwt --env-file supabase/.env.local
```

Create `supabase/.env.local` (gitignored) with the same secrets as above.

### Sample curl (welcome)

```bash
curl -X POST "http://localhost:54321/functions/v1/transactional-email" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{
    "type": "INSERT",
    "table": "profiles",
    "record": {
      "id": "00000000-0000-4000-8000-000000000001",
      "email": "you@example.com",
      "first_name": "Test",
      "last_name": "User",
      "status": "active"
    }
  }'
```

### Test matrix (production)

1. **Welcome** — Register a new user (profile row inserted).
2. **KYC** — Submit KYC; approve/reject in admin.
3. **Receipt** — Top-up + upload receipt; approve/decline in admin payments.
4. **Transfer** — P2P transfer by email; check sender, receiver, and `info@nevoluteinc.com`.
5. **Suspend / delete** — Admin client page → Suspend or Soft delete.

Check **Edge Functions → transactional-email → Logs** in Supabase and **Resend → Emails** for delivery.

---

## 7. Security notes

- Resend key and service role **only** in Supabase secrets.
- Webhook secret required on every request; rotate if leaked.
- Do not enable JWT verification on this function for DB webhooks; use the shared secret instead.
- Remove or disable the legacy Vercel route `api/supabase-webhook.ts` if you still have it deployed.

---

## 8. Maintenance

- Edit copy/layout in `supabase/functions/_shared/templates/`.
- Redeploy after changes: `supabase functions deploy transactional-email --no-verify-jwt`.
- Admin CC address: `ADMIN_EMAIL` in `supabase/functions/_shared/constants.ts`.
