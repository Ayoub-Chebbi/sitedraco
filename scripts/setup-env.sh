#!/bin/bash
# Security setup script for LootStore
# This script generates secure credentials and guides through environment setup

set -e

echo "🔒 LootStore Security Setup"
echo "=========================="
echo ""
echo "⚠️  IMPORTANT: Keep generated secrets secure. Never commit .env to git."
echo ""

# Create .env.local for development (git-ignored)
ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
    read -p ".env.local already exists. Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping .env.local generation"
        exit 0
    fi
fi

echo "Generating secure credentials..."
echo ""

# NextAuth Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "✓ NEXTAUTH_SECRET generated"

# Mobile JWT Secret (must be different)
MOBILE_JWT_SECRET=$(openssl rand -base64 32)
echo "✓ MOBILE_JWT_SECRET generated (different from NEXTAUTH_SECRET)"

# Encryption Key (base64-encoded 32 bytes)
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
echo "✓ ENCRYPTION_KEY generated"

# Create .env.local with generated values
cat > "$ENV_FILE" << EOF
# Generated security credentials - $(date)
# ⚠️  NEVER commit this file to git

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lootstore"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# Mobile JWT (separate from NEXTAUTH_SECRET)
MOBILE_JWT_SECRET="$MOBILE_JWT_SECRET"

# Encryption
ENCRYPTION_KEY="$ENCRYPTION_KEY"

# Site Configuration
SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="LootStore"

# Flouci Payment (add your credentials)
FLOUCI_APP_TOKEN="your-flouci-app-token"
FLOUCI_APP_SECRET="your-flouci-app-secret"

# Blob Storage (add your credentials)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Email Service (add your credentials)
RESEND_API_KEY="your-resend-api-key"

# Development
NODE_ENV="development"
EOF

echo ""
echo "✅ .env.local created with secure defaults"
echo ""
echo "📝 Next steps:"
echo "1. Update these values in .env.local:"
echo "   - DATABASE_URL (PostgreSQL connection)"
echo "   - FLOUCI_APP_TOKEN & FLOUCI_APP_SECRET"
echo "   - BLOB_READ_WRITE_TOKEN (Vercel Blob)"
echo "   - RESEND_API_KEY (Email service)"
echo ""
echo "2. For production, set these in your hosting provider:"
echo "   - NEXTAUTH_URL (production domain)"
echo "   - SITE_URL (production domain)"
echo "   - All credentials above"
echo ""
echo "3. Run: npm run dev"
echo ""
