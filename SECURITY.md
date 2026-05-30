# Security Guidelines

## Critical Setup Steps

### 1. Environment Variables
- **NEVER commit .env file** - Only commit `.env.example`
- Generate all secrets with cryptographically secure methods:
  ```bash
  # NextAuth secret
  openssl rand -base64 32
  
  # Mobile JWT secret (must be different)
  openssl rand -base64 32
  
  # Encryption key
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### 2. Database Security
- Use strong PostgreSQL passwords
- Enable SSL/TLS for database connections
- Restrict database access to application servers only
- Regular backups with encryption

### 3. Payment Security (Flouci)
- Keep Flouci credentials in environment variables only
- Verify all payment amounts server-side (DO NOT trust client)
- Implement idempotency checks for payment endpoints
- Log payment events for audit trails (without sensitive data)

### 4. API Security
- All payment/auth endpoints have rate limiting (5 attempts/15min per IP)
- Maximum order amount: 100,000 TND
- Request body size limit: 1 MB
- All inputs validated with Zod schemas

### 5. File Uploads
- Only JPEG, PNG, WebP images allowed (no GIF)
- Maximum file size: 5 MB
- Files stored with UUID filenames
- All uploads require admin authentication

### 6. Secrets Management
- Rotate credentials regularly (monthly for production)
- Use separate secrets for staging/production
- Never log sensitive data (tokens, passwords, payment info)
- Monitor for exposed secrets using tools like `git-secrets`

### 7. CORS & Headers
- Security headers configured in middleware.ts
- CSP policy restricts script sources
- X-Frame-Options set to DENY
- Strict-Transport-Security enabled in production

### 8. Mobile App Security
- Deep links validated (app scheme: `lootstore`)
- Implement certificate pinning for production
- Secure storage for JWT tokens using SecureStore
- Never hardcode secrets in app

### 9. Authentication
- JWT tokens expire after 30 days (mobile)
- Password reset tokens expire after 72 hours
- Passwords hashed with bcryptjs (salt rounds: 12)
- Rate limiting on login/register endpoints

### 10. User Data Protection
- Never send passwords via email
- Use reset links instead of auto-generated passwords
- Encrypt sensitive data at rest
- GDPR compliance for user data

## Deployment Checklist

- [ ] All environment variables set securely
- [ ] Database backups configured
- [ ] HTTPS/TLS enabled for all endpoints
- [ ] NEXTAUTH_SECRET is strong (not placeholder)
- [ ] MOBILE_JWT_SECRET set and different from NEXTAUTH_SECRET
- [ ] ENCRYPTION_KEY is base64-encoded 32 bytes
- [ ] Flouci credentials are correct for production
- [ ] Firebase API key is restricted to Android app
- [ ] Monitoring/logging configured
- [ ] SSL certificate installed and valid
- [ ] Rate limiting verified working
- [ ] CSP headers configured for your domain
- [ ] Error pages don't expose stack traces
- [ ] Debug logging disabled in production

## Vulnerability Reporting

If you discover a security vulnerability, please email security@yourdomain.com instead of posting publicly.

## Security Fixes Applied

Recent security improvements:
- Fixed weak random token generation (now uses crypto.randomBytes)
- Fixed encryption key derivation (now requires base64-encoded keys)
- Added rate limiting to payment endpoints
- Added maximum order amount validation
- Added security headers middleware
- Restricted file uploads to safe image formats
- Added input validation and sanitization
- Added request size limits
- Fixed hardcoded URLs to use environment variables
- Separated mobile JWT from NextAuth secrets
