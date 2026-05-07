# Signup flow

## Endpoint
`POST /api/user/signup`

## Steps

```
POST /api/user/signup
        │
        ▼
Valid body? No → 422
        │
        ▼
Email exists? Yes → 409
        │
        ▼
Hash password
Generate secure random token (crypto.randomBytes)
Create User (isEmailVerified: false)
Create EmailVerificationToken { userId, token, expiresAt: now+24h }
Save both in transaction
        │
        ▼
Send verification email
        │
        ▼
201 → FE shows "Verification link sent, verify and login"
      FE redirects to /login
```

## Notes
- Token is stored unhashed — cryptographically random, short-lived (24h)
- User is created with `isEmailVerified: false` — cannot login until verified
