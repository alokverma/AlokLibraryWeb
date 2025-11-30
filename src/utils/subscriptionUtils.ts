/**
 * Utility functions for subscription calculations with discounts
 */

const MONTHLY_FEE = 500;

export interface SubscriptionCalculation {
  baseAmount: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  monthlyFee: number;
}

/**
 * Calculate subscription amount with discounts
 * @param months - Number of subscription months
 * @returns Object containing baseAmount, discountPercent, discountAmount, and finalAmount
 */
export const calculateSubscriptionAmount = (months: number): SubscriptionCalculation => {
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
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100, // Round to 2 decimal places
    monthlyFee: MONTHLY_FEE,
  };
};

/**
 * Get the required amount for a subscription (with discount applied)
 * @param months - Number of subscription months
 * @returns Final amount after discount
 */
export const getRequiredAmount = (months: number): number => {
  const calculation = calculateSubscriptionAmount(months);
  return calculation.finalAmount;
};

