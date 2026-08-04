#!/bin/bash
# Post-boot seeding for the payment E2E stack in CI.
#
# ocf-core's development-mode startup already seeds plans and test users on a
# fresh database; this script only waits for the pieces that are asynchronous
# and fixes the one thing the seed does not provide (verified emails).
#
# Usage: seed-e2e.sh <api-base-url> <docker compose args...>
#   e.g.: seed-e2e.sh http://docker:8080/api/v1 -p ocf-e2e-123 -f a.yml -f b.yml
set -euo pipefail

API=${1:?usage: seed-e2e.sh <api-base-url> <docker compose args...>}
shift

echo "⏳ Waiting for ocf-core at $API..."
for _ in $(seq 1 60); do
  curl -sf -m 3 "$API/version" >/dev/null && break
  sleep 3
done
curl -sf -m 3 "$API/version"
echo

# The startup seed inserts the default plans with raw GORM, which bypasses the
# entity hooks — so nothing enqueues them for Stripe. Trigger the sync
# explicitly through the admin endpoint (creates the products/prices for every
# plan lacking a StripePriceID).
echo "🔁 Triggering plan → Stripe sync as admin..."
ADMIN_TOKEN=$(curl -sf -m 10 -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"1.supervisor@test.com","password":"test"}' | node -e "
    let d = '';
    process.stdin.on('data', (c) => (d += c)).on('end', () => {
      const b = JSON.parse(d);
      console.log(b.access_token || b.token || '');
    });
  ")
if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Admin login failed — seeded users missing?"
  exit 1
fi
curl -sf -m 120 -X POST "$API/subscription-plans/sync-stripe" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | head -c 400
echo

# The checkout endpoint refuses plans without a Stripe price. Wait until at
# least one active paid catalog plan carries one.
echo "⏳ Waiting for a paid plan to receive its Stripe price..."
READY=no
for _ in $(seq 1 60); do
  READY=$(curl -sf -m 5 "$API/subscription-plans" | node -e "
    let d = '';
    process.stdin.on('data', (c) => (d += c)).on('end', () => {
      const b = JSON.parse(d);
      const plans = Array.isArray(b) ? b : b.data || [];
      const ok = plans.some((p) => p.price_amount > 0 && p.is_active && p.stripe_price_id);
      console.log(ok ? 'yes' : 'no');
    });
  ") || READY=no
  [ "$READY" = "yes" ] && break
  sleep 3
done
if [ "$READY" != "yes" ]; then
  echo "❌ No paid plan received a Stripe price in time — is STRIPE_TEST_SECRET_KEY valid?"
  exit 1
fi

# The checkout routes sit behind RequireVerifiedEmail, which reads Casdoor's
# native email_verified field; the startup-seeded users are unverified.
echo "✉️  Marking seeded users' emails as verified..."
docker compose "$@" exec -T casdoor-db-test \
  mysql -uroot -p123456 casdoor -e "UPDATE user SET email_verified = 1;"

echo "✅ Seed complete."
