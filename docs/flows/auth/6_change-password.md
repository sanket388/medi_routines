# Change password flow

## Endpoint
`POST /api/user/change-password`

## Steps

```
User clicks reset link → /change-password?token=xyz (SPA route)
        │
        ▼
FE shows change password form
User fills new password + confirm password → submits
        │
        ▼
POST /api/user/change-password { token, newPassword }
        │
        ▼
Token found? No → 400 invalid token
        │
        ▼
Token expired? Yes → 410 (delete token)
        │
        ▼
Hash new password
Update user password + delete token (transaction)
        │
        ▼
200 → FE shows "Password changed successfully"
      redirects to /login
```

## Notes
- 400 for invalid/not found token
- 410 Gone for expired token — resource existed but is no longer available
- Password update and token deletion happen in a single transaction
- User is not automatically logged in after password change — must login manually
