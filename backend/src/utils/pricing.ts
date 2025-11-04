/**
 * Pricing utility functions for service orders and projects
 * Implements the 15% total fee structure: 2.5% buyer fee + 12.5% seller commission
 */

export interface ServiceOrderPricing {
  packagePrice: number;        // Original package price
  buyerFee: number;            // 2.5% fee paid by buyer
  sellerCommission: number;    // 12.5% commission taken from seller
  totalCharged: number;        // Total charged to buyer (packagePrice + buyerFee)
  freelancerReceives: number;  // Amount freelancer receives (packagePrice - sellerCommission)
  platformTotal: number;       // Total platform revenue (buyerFee + sellerCommission)
}

export interface ProjectPricing {
  agreedAmount: number;        // Agreed project amount (base)
  buyerFee: number;            // 2.5% fee paid by buyer
  sellerCommission: number;    // 12.5% commission taken from seller
  totalCharged: number;        // Total charged to buyer (agreedAmount + buyerFee)
  freelancerReceives: number;  // Amount freelancer receives (agreedAmount - sellerCommission)
  platformTotal: number;       // Total platform revenue (buyerFee + sellerCommission)
}

/**
 * Calculate all fees and amounts for a service order
 * @param packagePrice - The base package price
 * @returns Complete pricing breakdown
 */
export function calculateServiceOrderPricing(packagePrice: number): ServiceOrderPricing {
  const buyerFee = packagePrice * 0.025;           // 2.5% buyer service fee
  const sellerCommission = packagePrice * 0.125;   // 12.5% seller commission
  const totalCharged = packagePrice + buyerFee;
  const freelancerReceives = packagePrice - sellerCommission;
  const platformTotal = buyerFee + sellerCommission;

  return {
    packagePrice,
    buyerFee,
    sellerCommission,
    totalCharged,
    freelancerReceives,
    platformTotal
  };
}

/**
 * Calculate all fees and amounts for a project
 * @param agreedAmount - The agreed project amount (base)
 * @returns Complete pricing breakdown
 */
export function calculateProjectPricing(agreedAmount: number): ProjectPricing {
  const buyerFee = agreedAmount * 0.025;           // 2.5% buyer service fee
  const sellerCommission = agreedAmount * 0.125;   // 12.5% seller commission
  const totalCharged = agreedAmount + buyerFee;
  const freelancerReceives = agreedAmount - sellerCommission;
  const platformTotal = buyerFee + sellerCommission;

  return {
    agreedAmount,
    buyerFee,
    sellerCommission,
    totalCharged,
    freelancerReceives,
    platformTotal
  };
}

/**
 * Round amount to 2 decimal places (for currency)
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
