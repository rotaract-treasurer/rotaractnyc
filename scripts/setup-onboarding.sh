#!/bin/bash
# Install required dependencies for member onboarding system

echo "Installing Stripe SDK..."
npm install stripe

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.local.example to .env.local"
echo "2. Add Stripe keys (see docs/ONBOARDING_SETUP.md)"
echo "3. Run: npm run dev"
echo "4. In another terminal: stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
echo "📖 Full documentation: docs/MEMBER_ONBOARDING.md"
