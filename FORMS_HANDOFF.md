# Forms Module — Handoff

Built Tue May 19 2026 while you were at the gym. End-to-end smoke-tested. Committed locally on `master` as `8de296d`, **not pushed** — pull the trigger when you've eyeballed it.

## What you got

A Wufoo replacement, drop-in for QuizFeast:

- **Admin UI** at `/admin/forms` — build forms with drag-rank fields (text, textarea, email, number, url, select, radio, checkbox, date), set required flags, success messages, max submission caps, optional webhook notify (Discord/Slack/Zapier).
- **Public form URL** at `/f/<slug>` — clean white page, mobile-friendly, honeypot anti-spam, server-side validation, per-IP rate limit (5/min).
- **Submissions view** at `/admin/forms/<id>` → Submissions tab.
- **CSV export** button on each form's admin page.
- **Per-form submission webhook** (Discord/Slack/Zapier). Fire-and-forget.

## Files added

```
src/lib/forms-db.js                                  JSON-file store
src/lib/admin-auth.js                                Cookie auth check
src/lib/rate-limit.js                                Token bucket
src/components/FormBuilder.jsx                       Form designer UI
src/components/PublicForm.jsx                        Public-facing form
src/components/AdminLogoutButton.jsx                 (server/client split helper)
src/app/admin/{layout,login,forms,forms/new,forms/[id]}/page.jsx
src/app/f/[slug]/page.jsx                            Public viewer
src/app/api/admin/{login,logout}/route.js
src/app/api/forms/{route,[id]/route,
                   [id]/submit/route,
                   [id]/submissions/route,
                   [id]/submissions/[subId]/route,
                   [id]/export/route}.js
tests/forms_db_test.mjs                              13 passing tests
render.yaml                                          + 1GB persistent disk
next.config.mjs                                      + output: 'standalone'
.gitignore                                           + data/ + *.db
```

## Before you push & deploy

1. **Generate an admin token** — a long random string. PowerShell:
   ```powershell
   -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
   ```
2. **Set Render env var** `ADMIN_TOKEN` to that string (Dashboard → quizfeast service → Environment).
3. **Render disk**: render.yaml declares a 1 GB disk at `/app/data`. On the first deploy after pushing, Render will provision it (~$0.25/mo). Without it, your forms database wipes on every redeploy — same trap receipts.law hit.
4. **Push**: `git push origin master` from this directory.
5. **First login**: `https://quizfeast.com/admin/login` → paste your ADMIN_TOKEN. Cookie persists 30 days.

## Cancelling Wufoo (do this yourself)

I can't cancel for you — needs your account login. Steps:

1. Sign in at https://www.wufoo.com/login/
2. **Account → Billing → Cancel** (or the gear icon → Account Information → Cancel Subscription)
3. They will try to retain you with a discount. If you genuinely don't need it, decline and confirm cancel.
4. **Export your existing forms first** if you have submissions you want to keep — `Forms → [each form] → Entries → Export to CSV`. Drop those into the new system's `data/` folder if you want them, or just archive them.
5. **Update anywhere Wufoo URLs are embedded** (your site footer, contact pages, anywhere you've shared a Wufoo link) to the new `/f/<slug>` URL.

Save: **$45/mo = $540/yr**.

## Local dev

```bash
cd "C:/Users/dwayn/OneDrive/Desktop/Create Apps/QuizFeast"
npm run dev
# then http://localhost:3000/admin/login
# In dev, if ADMIN_TOKEN is unset the admin is OPEN (no login needed).
# In production it's closed unless ADMIN_TOKEN is set.
```

## Tests

```bash
node tests/forms_db_test.mjs    # 13/13 passing
```

## Things I deliberately did NOT do

- **Did not push to GitHub** — your call.
- **Did not provision the Render disk** — it'll happen on next deploy automatically once render.yaml is in main.
- **Did not pre-fill ADMIN_TOKEN env var on Render** — would need your Render API key + deciding the secret. You do it.
- **Did not migrate existing Wufoo submissions** — manual export/import if you want them. Most contact-form-style forms don't carry old data over.
- **Did not add Supabase auth or multi-user** — single-owner mode for now, matching how you use Wufoo. If you ever want public users building their own forms inside QuizFeast, swap admin-auth.js for the Supabase pattern from receipts.law.
- **Did not touch the Wufoo account** — you cancel it.

## Known gotchas

- The standalone Next.js server doesn't serve `public/` or `.next/static` by default. `npm run start` (the non-standalone path) does. Render's `node .next/standalone/server.js` works because Render mounts those automatically in its build pipeline.
- If two submissions land in the exact same millisecond, ordering is by file-append order (already correct).
- Webhook fires fire-and-forget; if it fails the submission is still saved. No retry queue.
- `node_modules` reinstall warning: `npm install` may complain about a missing `better-sqlite3` reference in package-lock.json. If so: `rm package-lock.json node_modules && npm install`. (I uninstalled it but Windows file locks sometimes leave residue.)
