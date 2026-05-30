# Production Deployment Checklist

## Pre-Deployment Security (MUST DO FIRST)

### 1. Credential Generation & Rotation ✓
- [ ] Generate new NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Generate new MOBILE_JWT_SECRET: `openssl rand -base64 32` (MUST be different)
- [ ] Generate new ENCRYPTION_KEY: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- [ ] Rotate Flouci credentials (create new tokens in Flouci dashboard)
- [ ] Rotate Firebase API keys / restrict to Android app only
- [ ] Rotate Vercel Blob tokens if previously exposed
- [ ] Generate new email API key for production
- [ ] Store all credentials in secure vault (Vercel, AWS Secrets Manager, etc.)

### 2. Environment Variables
- [ ] Set NEXTAUTH_URL to production domain: `https://yourdomain.com`
- [ ] Set SITE_URL to production domain: `https://yourdomain.com`
- [ ] Set NODE_ENV to "production"
- [ ] Never set DEBUG=true in production
- [ ] Verify all 13 required env vars are set (see .env.example)
- [ ] Test that app starts with production env vars

### 3. Database Security
- [ ] PostgreSQL running with SSL/TLS enabled
- [ ] Strong password set (not default)
- [ ] Database user has minimal required permissions
- [ ] Connection pooling configured (PgBouncer or similar)
- [ ] Automated daily backups enabled
- [ ] Backup encryption enabled
- [ ] Backup tested and verified restorable
- [ ] Database firewall rules restrict to app servers only

### 4. Payment Processing (Flouci)
- [ ] Flouci account in production mode (not sandbox)
- [ ] New production API tokens generated
- [ ] Test payment flow end-to-end with real transaction (small amount)
- [ ] Verify payment verification endpoint works
- [ ] Set up payment webhooks if needed
- [ ] Test failed payment handling
- [ ] Review Flouci transaction logs for accuracy

### 5. File Storage (Vercel Blob)
- [ ] Vercel Blob storage configured for production
- [ ] New BLOB_READ_WRITE_TOKEN generated
- [ ] File upload tested (create test product with image)
- [ ] Verify image loads correctly from production URL
- [ ] Configure CORS if needed
- [ ] Enable access logging in Blob storage

### 6. Email Service (Resend)
- [ ] Resend account created and verified
- [ ] Production API key generated
- [ ] From email domain verified (e.g., noreply@yourdomain.com)
- [ ] Test welcome emails send correctly
- [ ] Test password reset emails send correctly
- [ ] Test order confirmation emails send correctly
- [ ] Verify email templates render correctly
- [ ] Check email deliverability (spam folder test)

### 7. HTTPS/TLS
- [ ] SSL certificate installed and valid
- [ ] Certificate auto-renewal configured
- [ ] Redirect HTTP → HTTPS enabled
- [ ] HSTS header enabled (Strict-Transport-Security)
- [ ] Test with https://www.ssllabs.com/ssltest

### 8. Firewall & Network Security
- [ ] Firewall rules configured
- [ ] Only necessary ports open (80, 443)
- [ ] Database accessible only from app servers
- [ ] Admin panel IP-restricted if possible
- [ ] DDoS protection enabled (Cloudflare, Akamai, etc.)
- [ ] WAF configured for common attacks

### 9. Application Configuration
- [ ] Review SECURITY.md checklist completely
- [ ] CSP policy updated for production domain
- [ ] Security headers verified in production
- [ ] X-Frame-Options: DENY (verified)
- [ ] X-Content-Type-Options: nosniff (verified)
- [ ] Rate limiting thresholds appropriate for traffic
- [ ] Error pages don't expose stack traces
- [ ] Console.log debug statements removed

### 10. Mobile App
- [ ] Hardcoded domain still points to production (https://loot.tn)
- [ ] Firebase API key restricted to Android package only
- [ ] App built with production certificate
- [ ] Test login flow on device
- [ ] Test payment flow on device
- [ ] Test image loading on device
- [ ] Test deep links work correctly
- [ ] APK signed with production key

### 11. Monitoring & Logging
- [ ] Error tracking enabled (Sentry, LogRocket, etc.)
- [ ] Application performance monitoring (APM) enabled
- [ ] Log aggregation configured (ELK, Datadog, etc.)
- [ ] Logs don't contain sensitive data (passwords, tokens, etc.)
- [ ] Alert thresholds configured (CPU, memory, errors)
- [ ] On-call rotation established
- [ ] Incident response plan documented

### 12. DNS & CDN
- [ ] Domain DNS configured correctly
- [ ] CDN configured for static assets
- [ ] CloudFlare / similar DDoS protection active
- [ ] DNS records don't leak internal IPs
- [ ] SPF/DKIM/DMARC records configured for email
- [ ] DNS TTL appropriate (3600 recommended)

### 13. Testing
- [ ] Load test: 100+ concurrent users
- [ ] Payment flow tested end-to-end
- [ ] Product upload tested
- [ ] Image upload tested
- [ ] Mobile app payment flow tested
- [ ] Authentication flows tested (login, register, reset)
- [ ] Coupon validation tested
- [ ] Rate limiting tested (verify 429 responses)
- [ ] Error handling verified (no stack traces exposed)

### 14. Backup & Disaster Recovery
- [ ] Database backup schedule configured
- [ ] Backup retention policy set (30 days minimum)
- [ ] Backup encryption enabled
- [ ] Restore procedure documented and tested
- [ ] File storage backup strategy defined
- [ ] RTO/RPO targets defined and communicated

### 15. Final Verification
- [ ] All environment variables set correctly
- [ ] No hardcoded credentials in code
- [ ] .env.local not committed to git
- [ ] All secrets in secure vault (not in repo)
- [ ] SSL certificate valid and installed
- [ ] Database responding correctly
- [ ] Email service working
- [ ] Payment gateway connected and tested
- [ ] Application starts without errors
- [ ] Health check endpoint responds
- [ ] Database migrations complete
- [ ] Admin user can log in
- [ ] Test product can be created
- [ ] Payment workflow end-to-end tested

## Post-Deployment (First Week)

- [ ] Monitor error logs daily
- [ ] Check payment processing for issues
- [ ] Verify email deliverability
- [ ] Review performance metrics
- [ ] Check database query performance
- [ ] Monitor disk space
- [ ] Verify backups are running
- [ ] Test incident response plan
- [ ] Review security headers in production
- [ ] Check rate limiting is working

## Ongoing Maintenance

- [ ] Weekly: Review error logs and performance
- [ ] Monthly: Rotate API keys / credentials
- [ ] Monthly: Review access logs for suspicious activity
- [ ] Quarterly: Security audit of new features
- [ ] Quarterly: Dependency updates and security patches
- [ ] Quarterly: Database maintenance and optimization
- [ ] Annually: Full security assessment
- [ ] Annually: Disaster recovery drill

## Rollback Plan

If issues occur after deployment:

1. **Critical bug**: Deploy hotfix to production
2. **Database issue**: Restore from latest backup
3. **Payment issues**: Check Flouci logs, may need to manually process orders
4. **Email issues**: Check Resend API status, queue may retry automatically
5. **Complete rollback**: Restore entire environment from pre-deployment snapshot

## Security Incident Response

If credentials are exposed:

1. **IMMEDIATELY**: Rotate all credentials
2. **Within 1 hour**: Notify affected users if data breach
3. **Within 24 hours**: Security audit to determine scope
4. **Deploy fixes**: Update code if needed
5. **Document**: Create incident report

---

**DO NOT PROCEED TO PRODUCTION WITHOUT COMPLETING ALL ITEMS ABOVE**

Deployment sign-off by: _________________ Date: _________
