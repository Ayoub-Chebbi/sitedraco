# Production Setup Guide

## Overview

This guide walks through deploying LootStore to production safely with all security measures in place.

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Vercel account (for hosting)
- Neon (for database)
- Flouci account (payments)
- Resend account (email)
- GitHub account (for CI/CD)

## Step 1: Secure Credential Setup

### 1.1 Generate New Production Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate MOBILE_JWT_SECRET (must be different)
openssl rand -base64 32

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 1.2 Prepare External Services

**Flouci Payment:**
- Log in to https://developers.flouci.com
- Create new production application
- Generate new API tokens
- Note: FLOUCI_APP_TOKEN and FLOUCI_APP_SECRET

**Resend Email:**
- Create account at https://resend.com
- Verify your domain (noreply@yourdomain.com)
- Generate new API key

**Vercel Blob Storage:**
- Add storage integration to your Vercel project
- Generate new access token
- Note: BLOB_READ_WRITE_TOKEN

**Database:**
- Create new Neon project for production
- Note the connection string with secure password
- Enable SSL/TLS

### 1.3 Set Vercel Environment Variables

```bash
# Via Vercel Dashboard > Project > Settings > Environment Variables

# Production environment only:
NEXTAUTH_SECRET=<generated-value>
MOBILE_JWT_SECRET=<generated-value>
ENCRYPTION_KEY=<generated-value>
NEXTAUTH_URL=https://yourdomain.com
SITE_URL=https://yourdomain.com
DATABASE_URL=<neon-production-url>
FLOUCI_APP_TOKEN=<your-token>
FLOUCI_APP_SECRET=<your-secret>
RESEND_API_KEY=<your-key>
BLOB_READ_WRITE_TOKEN=<your-token>
NODE_ENV=production
```

## Step 2: Code Deployment

### 2.1 Push Code to Production Branch

```bash
git checkout main
git pull origin main
git push origin main:production
```

### 2.2 Configure GitHub → Vercel

Vercel automatically deploys on push to configured branch.

Verify in Vercel Dashboard:
- Production branch set to `production`
- Environment variables set correctly
- Preview deployments enabled for PR review

## Step 3: Database Migration

### 3.1 Run Migrations

```bash
# Via Vercel deployment or local:
npm run db:push
```

### 3.2 Verify Database

```bash
psql $DATABASE_URL

# Verify tables created:
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public';

# Check for any errors in app logs
```

## Step 4: Testing Pre-Deployment

### 4.1 End-to-End Testing

**Authentication:**
```bash
# Test registration
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","name":"Test User"}'

# Test login
curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'
```

**Payment Flow:**
- Create test product
- Add to cart
- Initiate payment with Flouci test amount
- Complete payment flow
- Verify order created
- Check confirmation email received

**File Upload:**
- Upload test image for product
- Verify image accessible from Blob URL
- Check proper CORS headers

### 4.2 Security Verification

```bash
# Check security headers
curl -I https://yourdomain.com/

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=...
# Content-Security-Policy: ...

# Check rate limiting
for i in {1..10}; do
  curl -X POST https://yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
# Should get 429 after threshold

# Check HTTPS redirect
curl -I http://yourdomain.com/
# Should redirect to https
```

## Step 5: Go Live

### 5.1 DNS Configuration

Update your domain DNS to point to Vercel:
```
yourdomain.com  → cname.vercel-dns.com
www.yourdomain.com → cname.vercel-dns.com
```

### 5.2 SSL Certificate

Vercel automatically provisions SSL certificate.
Verify in Vercel Dashboard > Domains

### 5.3 Health Check

```bash
curl -I https://yourdomain.com/
# Should return 200 OK with security headers
```

## Step 6: Monitoring Setup

### 6.1 Error Tracking

Install Sentry for error monitoring:

```bash
npm install @sentry/nextjs

# Add to: next.config.ts
# See docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
```

### 6.2 Logging

Configure centralized logging:
- Vercel Logs (built-in)
- Datadog, LogRocket, or ELK stack
- Review logs daily first week

### 6.3 Monitoring Alerts

Set up alerts for:
- Error rate > 1%
- Response time > 2s
- Database connection errors
- Payment failures
- Email delivery failures

## Step 7: Post-Deployment

### 7.1 Smoke Testing (First 24 Hours)

Monitor:
- [ ] Login/registration working
- [ ] Payments processing correctly
- [ ] Emails being sent
- [ ] Images loading
- [ ] API response times < 2s
- [ ] Error rate < 0.1%
- [ ] Database performing well

### 7.2 Weekly Checks

- [ ] Review error logs
- [ ] Check payment processing
- [ ] Verify backup integrity
- [ ] Monitor performance metrics
- [ ] Check security logs

## Rollback Plan

If critical issues occur:

```bash
# Revert to previous production version:
git revert <commit-hash>
git push origin main:production

# Vercel will automatically redeploy
# Or manually trigger in Vercel Dashboard > Deployments
```

## Security Reminders

✅ **DO:**
- Store credentials in Vercel environment variables
- Enable 2FA on all service accounts
- Monitor for unauthorized access
- Keep backups encrypted
- Update dependencies regularly
- Document all changes

❌ **DON'T:**
- Commit .env to git
- Share credentials via Slack/email
- Use same password across services
- Disable HTTPS
- Log sensitive data
- Use weak encryption keys

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Check application error logs (Sentry/LogRocket)
3. Verify all environment variables are set
4. Check database connectivity
5. Verify external service credentials

See: SECURITY.md, DEPLOYMENT_CHECKLIST.md, CREDENTIAL_ROTATION_URGENT.md
