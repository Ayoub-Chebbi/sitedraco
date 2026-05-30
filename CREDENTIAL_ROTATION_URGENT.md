# 🚨 URGENT: Credential Rotation Required

## Your credentials have been exposed in the repository

The .env file contains real production credentials that must be rotated immediately.

## Credentials to Rotate (In Order of Priority)

### 1. FLOUCI PAYMENT (CRITICAL) 
Current exposed tokens:
```
FLOUCI_APP_TOKEN="377d3b4e-3fc1-4459-bcbf-b03dd24eceed"
FLOUCI_APP_SECRET="e7f0c7d4-998d-4b49-a9f8-2864171294c0"
```

**Action Required:**
- [ ] Log into https://developers.flouci.com
- [ ] Revoke current tokens immediately
- [ ] Generate new production tokens
- [ ] Update FLOUCI_APP_TOKEN in your secure vault
- [ ] Update FLOUCI_APP_SECRET in your secure vault
- [ ] Test payment flow with new tokens
- [ ] Verify no pending transactions are affected

### 2. BLOB STORAGE (HIGH)
Current exposed token:
```
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_USY4zczauBjlUFI6_o9kgMMHNVaAqEhy0GU6P5FgyWWfIc4"
```

**Action Required:**
- [ ] Log into Vercel console
- [ ] Delete the exposed token
- [ ] Generate new token
- [ ] Update in your secure vault
- [ ] Redeploy application

### 3. RESEND EMAIL API (HIGH)
Current exposed key:
```
RESEND_API_KEY="re_5GScqTmr_GiaHSoAVWofVJQY5mkXTySWb"
```

**Action Required:**
- [ ] Log into https://resend.com
- [ ] Revoke the exposed API key
- [ ] Generate new API key
- [ ] Update in your secure vault
- [ ] Test email sending

### 4. DATABASE CONNECTION (CRITICAL)
Current exposed connection:
```
DATABASE_URL="postgresql://neondb_owner:npg_PTBj5flIcM9s@ep-icy-darkness-alzm6280-pooler..."
```

**Action Required:**
- [ ] Log into Neon console
- [ ] Reset database password
- [ ] Create new connection string with new password
- [ ] Update in your secure vault
- [ ] Redeploy without downtime

### 5. ENCRYPTION KEY (CRITICAL)
Current exposed key:
```
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"
```

**Action Required:**
- [ ] Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- [ ] This requires re-encrypting all encrypted data in database (see below)

### 6. NEXTAUTH & MOBILE JWT SECRETS (HIGH)
Current exposed values:
```
NEXTAUTH_SECRET="dev-secret-change-in-production-32chars"
MOBILE_JWT_SECRET="lootstore-mobile-jwt-secret-change-in-production"
```

**Action Required:**
- [ ] Generate new NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Generate new MOBILE_JWT_SECRET: `openssl rand -base64 32`
- [ ] Update in your secure vault
- [ ] Redeploy (users will be logged out)

## Timeline

**IMMEDIATE (Within 1 hour):**
1. Rotate Flouci tokens
2. Rotate Blob storage token  
3. Rotate Resend API key
4. Reset database password

**Within 24 hours:**
1. Rotate encryption key (requires data migration)
2. Rotate auth secrets
3. Rebuild and redeploy application
4. Monitor for any issues

**Within 1 week:**
1. Audit access logs for unauthorized access
2. Monitor payment transactions for fraud
3. Verify all backups are using new credentials
4. Update disaster recovery documentation

## How to Update Credentials Safely

### Option 1: Vercel Environment Variables (Recommended)
```bash
# For each credential:
vercel env add FLOUCI_APP_TOKEN
# Enter new value
# Select production environment
# Redeploy
```

### Option 2: CI/CD Secrets (GitHub Actions, etc.)
Add secrets to GitHub/GitLab and reference in deployment

### Option 3: Secure Vault
Use AWS Secrets Manager, HashiCorp Vault, or similar

## After Rotation

1. Update .env.local to invalid values (for development)
2. Never commit real credentials to git again
3. Add .env to .gitignore (already done)
4. Use git-secrets to prevent future credential leaks
5. Review git history to ensure no credentials remain

## Testing After Rotation

- [ ] Login works
- [ ] Payment flow works (test with small amount)
- [ ] Email sending works
- [ ] File upload works
- [ ] Image loading works
- [ ] Mobile app login works
- [ ] No errors in production logs

## Checklist Summary

**Do immediately (right now):**
- [ ] Rotate Flouci tokens
- [ ] Rotate Blob storage token
- [ ] Rotate Resend API key
- [ ] Reset database password

**Do today:**
- [ ] Rotate auth secrets
- [ ] Update all in secure vault
- [ ] Redeploy application

**Do this week:**
- [ ] Audit for unauthorized access
- [ ] Monitor transactions
- [ ] Update documentation

---

**NEVER commit real credentials to git again. Use environment variables from your hosting provider.**
