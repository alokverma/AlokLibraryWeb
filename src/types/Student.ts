export interface Student {
  id: string;
  name: string;
  phoneNumber: string;
  address?: string;
  aadharCard?: string;
  startDate?: string;
  expiryDate: string;
  subscriptionMonths?: number;
  paymentAmount?: number;
  isPaymentDone?: boolean;
  profilePicture: string;
  subscriptionStatus: 'active' | 'expired';
}

