# Sign in with Google flow

## Endpoint
`POST /api/user/google-signin`

## Steps

```
User clicks "Sign in with Google" on login or signup page
        │
        ▼
Google Identity Services SDK handles OAuth 2.0 + OIDC flow
(PKCE, state param, consent screen — all handled by SDK)
        │
        ▼
SDK returns ID token to frontend
Frontend extracts timezone from browser:
Intl.DateTimeFormat().resolvedOptions().timeZone
        │
        ▼
POST /api/user/google-signin { idToken, timezone }
        │
        ▼
Valid body? No → 422
        │
        ▼
Verify ID token with Google
Invalid? → 401
        │
        ▼
Extract from payload: googleId (sub), email, name, email_verified
        │
        ▼
Find user by googleId
        │
      Found? ──────────────────────────────────────────▶ Issue JWT → 200
        │
       Not found
        │
        ▼
Find user by email
        │
      Found? (existing local account — silent merge)
        │  Add googleId to user
        │  Add "google" to authProviders
        │  Set isEmailVerified: true (Google verifies emails)
        │  Save in transaction
        │──────────────────────────────────────────────▶ Issue JWT → 200
        │
       Not found (new user)
        │
        ▼
Create new user:
  name, email, timezone (from request)
  googleId, authProviders: ["google"]
  isEmailVerified: true
  no password
Save in transaction
        │
        ▼
Issue JWT → 200
FE stores token, redirects to /home
```

## Notes
- ID token is verified server-side using `google-auth-library` — never trust it unverified
- `googleId` is Google's `sub` field — stable unique identifier per user per app
- Silent merge: if email already exists as local account, Google is added as additional auth provider. User can now login with both password and Google
- Timezone comes from the browser (`Intl.DateTimeFormat().resolvedOptions().timeZone`) since Google does not provide it
- No email verification step needed — Google already verifies emails
- New Google users do not have a password — local login will return 401 for them (intentional, no information leakage about auth provider)