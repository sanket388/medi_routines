# Login flow using Email and Password

## Endpoint
`POST /api/user/login`

## Steps

```
POST /api/user/login
        │
        ▼
Valid body? No → 422
        │
        ▼
User exists + correct password? No → 401
        │
        ▼
isEmailVerified? No → 403
        │       FE shows "Verify email or request new link"
        ▼
Generate JWT
        │
        ▼
200 → FE stores token, redirects to /home
```

## Notes
- 403 (not 401) for unverified email — 401 means wrong credentials, 403 means known identity but access denied
- No subcode needed in body — 403 is unique in this flow, FE checks status code directly
