/**
 * Diagnostic script to check subscription plans for bulk license compatibility
 *
 * This script helps identify which plans have tiered pricing but are missing
 * the bulk_purchase feature flag.
 *
 * Usage:
 * 1. Open your app in the browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Check the output for missing feature flags
 */

(async function checkBulkLicensePlans() {
  console.log('🔍 Checking bulk license plan configuration...\n');

  try {
    // Fetch subscription plans from API
    const response = await fetch('/api/v1/subscription-plans', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const plans = await response.json();
    console.log(`📋 Found ${plans.length} subscription plans\n`);

    // Check each plan
    const tieredPlans = plans.filter(p => p.use_tiered_pricing);
    const bulkReadyPlans = [];
    const needsFixPlans = [];

    console.log('='.repeat(80));
    plans.forEach((plan, index) => {
      console.log(`\n📦 Plan ${index + 1}: ${plan.name}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Active: ${plan.is_active ? '✅' : '❌'}`);
      console.log(`   Tiered Pricing: ${plan.use_tiered_pricing ? '✅' : '❌'}`);

      // Check features
      let hasBulkPurchase = false;
      if (plan.features) {
        if (Array.isArray(plan.features)) {
          hasBulkPurchase = plan.features.includes('bulk_purchase');
          console.log(`   Features (array): [${plan.features.join(', ')}]`);
        } else if (typeof plan.features === 'object') {
          hasBulkPurchase = plan.features.bulk_purchase === true;
          console.log(`   Features (object):`, plan.features);
        } else {
          console.log(`   Features: ${plan.features} (unexpected type)`);
        }
      } else {
        console.log(`   Features: null/undefined`);
      }

      console.log(`   Bulk Purchase Feature: ${hasBulkPurchase ? '✅' : '❌'}`);

      // Check if plan should support bulk but is missing the flag
      if (plan.use_tiered_pricing && plan.is_active) {
        if (hasBulkPurchase) {
          console.log(`   ✅ READY FOR BULK PURCHASE`);
          bulkReadyPlans.push(plan);
        } else {
          console.log(`   ⚠️  MISSING BULK_PURCHASE FEATURE FLAG`);
          needsFixPlans.push(plan);
        }
      }
    });

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY\n');
    console.log(`Total plans: ${plans.length}`);
    console.log(`Plans with tiered pricing: ${tieredPlans.length}`);
    console.log(`✅ Bulk-ready plans: ${bulkReadyPlans.length}`);
    console.log(`⚠️  Plans needing fixes: ${needsFixPlans.length}`);

    if (needsFixPlans.length > 0) {
      console.log('\n🔧 RECOMMENDED FIXES\n');
      console.log('The following plans have tiered pricing but are missing the bulk_purchase feature:');

      needsFixPlans.forEach(plan => {
        console.log(`\n📝 Fix for plan "${plan.name}" (${plan.id}):`);
        console.log('   Run this SQL in your database:\n');

        // Generate SQL to add bulk_purchase feature
        if (Array.isArray(plan.features)) {
          const updatedFeatures = [...plan.features, 'bulk_purchase'];
          console.log(`   UPDATE subscription_plans`);
          console.log(`   SET features = '${JSON.stringify(updatedFeatures)}'::jsonb`);
          console.log(`   WHERE id = '${plan.id}';`);
        } else if (plan.features && typeof plan.features === 'object') {
          const updatedFeatures = { ...plan.features, bulk_purchase: true };
          console.log(`   UPDATE subscription_plans`);
          console.log(`   SET features = '${JSON.stringify(updatedFeatures)}'::jsonb`);
          console.log(`   WHERE id = '${plan.id}';`);
        } else {
          // No existing features, create array
          console.log(`   UPDATE subscription_plans`);
          console.log(`   SET features = '["bulk_purchase"]'::jsonb`);
          console.log(`   WHERE id = '${plan.id}';`);
        }
      });

      console.log('\n💡 After running the SQL, refresh the subscription plans page.');
    } else if (bulkReadyPlans.length > 0) {
      console.log('\n✅ All tiered plans are properly configured for bulk purchase!');
      console.log('\nBulk-ready plans:');
      bulkReadyPlans.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.id})`);
      });
    } else {
      console.log('\n⚠️  No plans with tiered pricing found.');
      console.log('To enable bulk licensing, you need plans with:');
      console.log('   1. use_tiered_pricing = true');
      console.log('   2. pricing_tiers = [{...}]');
      console.log('   3. features containing "bulk_purchase"');
    }

  } catch (error) {
    console.error('❌ Error checking plans:', error);
    console.log('\n💡 Make sure you are:');
    console.log('   1. Logged in to the application');
    console.log('   2. Have access to subscription plans');
    console.log('   3. Backend API is running');
  }
})();
