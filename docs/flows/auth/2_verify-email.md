# Verify email flow

## Endpoint
`POST /api/user/verify-email`

## Steps

```
User clicks link → /verify-email?token=xyz (SPA route)
        │
        ▼
FE shows "Verifying..."
FE sends POST /api/user/verify-email { token }
        │
        ▼
Token found? No → 400
        │
        ▼
Token expired? Yes → 410 (delete expired token)
        │
        ▼
Mark user.isEmailVerified = true
Delete token
Save in transaction
        │
        ▼
200 → FE shows "Verified!" briefly → redirects to /login
```

## Notes
- GET is not used — email previewers and bots can trigger GET links unintentionally
- 410 Gone is used for expired tokens (resource existed but is no longer available)
- Token is deleted on both success and expiry
