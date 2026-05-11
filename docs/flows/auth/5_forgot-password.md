# Forgot password flow

## Endpoint
`POST /api/user/forgot-password`

## Steps

```
User fills email → submits
        │
        ▼
POST /api/user/forgot-password { email }
        │
        ▼
User exists and verified?
  No → 200 "Password reset link sent on registered mail" (prevents email enumeration)
  │
  ▼
Delete existing forgot password token if any
Generate new token
Create new ForgotPasswordToken { userId, token, expiresAt: now+24h }
Send email with reset link
        │
        ▼
200 "Password reset link sent on registered mail"
FE shows message → redirects to /login
```

## Notes
- Always returns 200 with same message regardless of whether user exists or is verified
- Prevents email enumeration — attacker cannot tell if an email is registered
- Deletes old token before creating new one — only one valid token per user at a time
- Token expires in 24 hours
