/**
 * subscriptionHelper - Stub for the main backend.
 * 
 * In the original feature servers this integrates with a Subscription model
 * and enforces quotas (FREE / PRO / PRO_PLUS). Here we provide a passthrough
 * so all features work without a subscription system.
 *
 * To add real quota enforcement, replace the functions below with your logic.
 */

const checkQuota = async (userId, feature) => {
  // Always allow — replace with real logic if you have a subscription model
  return { allowed: true };
};

const incrementUsage = async (userId, feature) => {
  // No-op — replace with real usage tracking if needed
  return true;
};

module.exports = { checkQuota, incrementUsage };
