/**
 * Utility functions for subscription calculations with discounts
 */

const MONTHLY_FEE = 500;

/**
 * Calculate subscription amount with discounts
 * @param {number} months - Number of subscription months
 * @returns {Object} Object containing baseAmount, discountPercent, discountAmount, and finalAmount
 */
export const calculateSubscriptionAmount = (months) => {
  const baseAmount = months * MONTHLY_FEE;
  let discountPercent = 0;
  
  // Apply discounts based on subscription duration
  if (months === 3) {
    discountPercent = 20; // 20% discount for 3 months
  } else if (months === 6) {
    discountPercent = 30; // 30% discount for 6 months
  }
  
  const discountAmount = (baseAmount * discountPercent) / 100;
  const finalAmount = baseAmount - discountAmount;
  
  return {
    baseAmount,
    discountPercent,
    discountAmount,
    finalAmount: Math.round(finalAmount * 100) / 100, // Round to 2 decimal places
    monthlyFee: MONTHLY_FEE,
  };
};

/**
 * Get the required amount for a subscription (with discount applied)
 * @param {number} months - Number of subscription months
 * @returns {number} Final amount after discount
 */
export const getRequiredAmount = (months) => {
  const calculation = calculateSubscriptionAmount(months);
  return calculation.finalAmount;
};

