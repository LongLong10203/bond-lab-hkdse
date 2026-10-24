# Test Google login locally

This setup keeps the app, accounts, and progress database on your PC. Google handles the sign-in page. No GitHub push or Vercel deployment is needed.

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select **Bond Lab**.
2. Open **Google Auth Platform**, then **Get started** if this project has no OAuth configuration. Set the app name to **Bond Lab** and select your support/contact email.
3. Choose **Internal** only if the project belongs to the school's Google Workspace organization. Otherwise choose **External**. While in testing, add your school Google account under **Audience → Test users** if required by the console. Bond Lab independently enforces the school domain on its server.
4. Under **Clients**, create a **Web application**:
   - Name: `Bond Lab local`
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the client ID and secret into `.env.local` in the project directory:

   ```dotenv
   BETTER_AUTH_URL=http://localhost:3000
   BETTER_AUTH_SECRET=<a random secret of at least 32 characters>
   GOOGLE_CLIENT_ID=<your Google web client ID>
   GOOGLE_CLIENT_SECRET=<your Google web client secret>
   ```

   Keep existing database settings and other entries. If `BETTER_AUTH_SECRET` is already populated, keep it. For a fresh checkout, generate it with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Do not paste credentials into chat or commit them.
6. Start the local database (`npm run db:start`), apply migrations (`npm run setup`), and start the app (`npm run dev`). Restart the app after changing credentials.
7. Visit **http://localhost:3000** and choose **Continue with Google** on the welcome page. Use your `@syss.edu.hk` Google Workspace account. The first successful login registers it automatically and asks you to choose a display name.

You can use the same Google web client for local and production testing: keep both origins and both callback URLs in that client. If you replace the credentials in `.env.local`, restart the local server. Production credentials must also be updated in Vercel; changes to your local file do not automatically update the live site.

## What to check

- Your school email appears with **Sign out**.
- Complete a question. Your XP and solved count update.
- Start a synthesis, edit a drawing or conditions, and switch steps. Wait for **Saved to your account**.
- Reload or sign out and back in. The account's scores and drafts should return.
- Open a separate browser, sign into the same school account, and verify its progress returns.
- A personal Gmail or other-domain account cannot register or log in. The Google chooser allows switching accounts; the callback enforces the restriction.
- Guest progress remains separate. Signed-in drafts are stored on the server, not in the guest browser-storage keys.

The local database persists in `.postgres/data`. Do not delete that directory if you want to retain local test accounts and progress. This database is separate from production; local test accounts will not appear on the existing live website.

## If Google reports an error

- **redirect_uri_mismatch:** use exactly `http://localhost:3000/api/auth/callback/google` in the Web application's redirect URI list. Use `localhost`, not `127.0.0.1`, and match the port.
- **access_denied / app in testing:** check the audience and test-user settings.
- **admin_policy_enforced / app blocked:** the school Workspace administrator must permit the app. Do not bypass the school policy.
- **School account rejected:** the email must end in exactly `@syss.edu.hk`, be verified by Google, and Google's hosted-domain claim must be `syss.edu.hk`.
- **Sign-in button disabled:** fill in both Google credentials and restart the local app.

References: [Better Auth Google provider](https://better-auth.com/docs/authentication/google), [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

## Browser regression checks

`tests/browser-accounts.ts` runs isolated-browser checks for draft restoration, mobile layouts, save failure/retry, and sign-out. It requires Playwright and a Chrome/Chromium executable. Run with the app and local database available:

```sh
npx tsx tests/browser-accounts.ts
```

If Playwright is supplied by a separate runtime, set `BOND_LAB_PLAYWRIGHT_PACKAGE` to that runtime's `package.json` path. Set `CHROME_PATH` to the browser executable when Playwright's bundled Chromium is unavailable. Screenshots are written to the ignored `test-results/` directory. Temporary users are removed after the check. A real school-account OAuth test remains necessary; session fixtures do not prove Google Cloud or school administrator configuration.
