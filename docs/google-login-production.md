# Google sign-in on the live site

Live site: **https://bond-lab-hkdse.vercel.app**

## 1. Configure the Google web client

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select your Bond Lab project.
2. Open **Google Auth Platform → Clients** and select your **Web application** client.
3. Under **Authorized JavaScript origins**, add:

       https://bond-lab-hkdse.vercel.app

4. Under **Authorized redirect URIs**, add:

       https://bond-lab-hkdse.vercel.app/api/auth/callback/google

5. Click **Save**. Origins have no trailing path; the redirect must include the complete callback path.
6. For local testing with this same client, also retain the origin `http://localhost:3000` and redirect `http://localhost:3000/api/auth/callback/google`.

## 2. Choose who can sign in

Open **Google Auth Platform → Audience**.

- **Internal:** use this only when the project belongs to the school's Google Workspace organization. Your school may need to allow the app.
- **External / Testing:** add the school accounts that will test the app to **Test users**, as required by the console. This is suitable for the initial live check.
- **External / In production:** when ready to let school users join, use **Publish app** and follow any branding or verification requirements Google displays. Publishing the Google OAuth app is separate from deploying the website. School administrator restrictions can still apply.

Bond Lab checks the verified email domain and Google's Workspace domain on the server. Only exact domains in the private `AUTH_SCHOOL_DOMAINS` setting are accepted, even if the Google consent screen is external. Exact verified-email exceptions may be configured with `AUTH_ALLOWED_EMAILS`. The school’s Microsoft sign-in page may appear as part of its normal Google SSO flow.

## 3. Configure Vercel

Open **Vercel → bond-lab-hkdse → Settings → Environment Variables**. Set these for **Production**:

| Name | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Client ID from the web client above |
| `GOOGLE_CLIENT_SECRET` | Secret from that same client |
| `BETTER_AUTH_URL` | `https://bond-lab-hkdse.vercel.app` |
| `BETTER_AUTH_SECRET` | A fresh random secret of at least 32 characters; different from local development |
| `AUTH_SCHOOL_DOMAINS` | Your actual approved Google Workspace domains, comma-separated; no wildcard or URL |
| `AUTH_ALLOWED_EMAILS` | Optional comma-separated exact verified Google email exceptions |

Configure `AUTH_SCHOOL_DOMAINS` **before deploying this version**. Without it, school-domain access is denied, including returning users; existing accounts and saved data are not deleted. Use the current allowed domains to preserve access. Do not use the fictional `school.example,academy.example` test values in production.

Keep all these settings server-only: do not prefix them with `NEXT_PUBLIC_`. Mark credentials, the school-domain list, and private exceptions as sensitive. Never commit credentials or paste them into chat. Keep the existing production database settings. After changing Vercel variables, redeploy so the new deployment uses them. Do not change a working `BETTER_AUTH_SECRET` routinely; doing so invalidates existing session cookies.

The initial release configures these values from the locally supplied Google client. If you create or rotate a client later, update Vercel as well as `.env.local` and redeploy.

## 4. Test the live site

1. Open the live URL and choose **Continue with Google**.
2. Sign in with an approved school Google account. Complete any normal school SSO steps yourself. The first sign-in creates your live account and asks you to choose a display name.
3. Choose your display name, then complete or skip the tutorial, solve a question, and wait for **Saved to your account**.
4. Reload and check that the XP and answer remain. Open **Leaderboard**, select your player, and optionally choose a nickname.
5. Sign out and choose **Play as guest**. The guest game should show no XP or levels.

Local and live databases are separate. Local test scores are not copied to the live site. For a real cross-device check, sign into the live URL on another device and check the saved draft.

The short URL above is canonical. Pages on the former project-team alias redirect here. Only the two known production origins are trusted; unrelated websites are not allowed to make account-changing requests. Google shows an account chooser on each attempt, so you can back out and retry with your school account.

## Troubleshooting

- **Invalid origin:** reopen the short live URL above. Ensure Vercel’s Production BETTER_AUTH_URL matches it exactly, then redeploy. Do not disable origin checking.
- **redirect_uri_mismatch:** check the full callback URL above in the same Google client whose credentials are in Vercel. Do not use a temporary deployment URL to sign in.
- **access_denied / app in testing:** check Audience and Test users. Publishing the website alone does not publish the Google OAuth app.
- **App blocked / admin_policy_enforced:** ask the school’s Google Workspace administrator to permit Bond Lab.
- **Sign-in unavailable:** check both Google credentials, select Production, and redeploy.
- **School account rejected:** use a Google-verified account whose exact email domain is in `AUTH_SCHOOL_DOMAINS` and matches Google’s hosted-domain claim. Check the Production variable and redeploy after editing it.

References: [Better Auth Google setup](https://better-auth.com/docs/authentication/google), [Google OAuth production readiness](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification).
