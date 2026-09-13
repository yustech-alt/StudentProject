// Platform fee configuration
export const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% platform fee

/**
 * Calculate the platform fee for a given amount
 */
export const calculatePlatformFee = (amount: number): number => {
  return Math.round(amount * PLATFORM_FEE_PERCENTAGE);
};

/**
 * Calculate the expert's earnings after platform fee deduction
 */
export const calculateExpertEarnings = (amount: number): number => {
  return Math.round(amount * (1 - PLATFORM_FEE_PERCENTAGE));
};

/**
 * Format currency in Nigerian Naira
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
