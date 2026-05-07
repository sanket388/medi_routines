# Request new verification link flow

## Endpoint
`POST /api/user/request-verification-link`

## Steps

```
POST /api/user/request-verification-link { email }
        │
        ▼
User exists and unverified?
  No → 200 "Verification link sent" (vague — prevents email enumeration)
  │
  ▼
Delete existing token if any
Generate new token
Create new EmailVerificationToken
Send email
        │
        ▼
200 → FE shows "Verification link sent" → redirects to /login
```

## Notes
- Always returns 200 with same message regardless of whether user exists or is already verified
- This prevents email enumeration — attacker cannot tell if an email is registered
- Deletes old token before creating new one — only one valid token per user at a time
