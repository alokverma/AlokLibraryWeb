import { useState } from 'react';
import { studentApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface AddStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credentials?: {username: string; password: string}) => void;
}

export const AddStudentForm = ({ isOpen, onClose, onSuccess }: AddStudentFormProps) => {
  const { t } = useLanguage();
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Calculate expiry date based on subscription months
  const calculateExpiryDate = (startDate: string, months: number) => {
    if (!startDate || !months) return '';
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + months);
    return start.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    seatNumber: '',
    address: '',
    aadharCard: '',
    startDate: getTodayDate(),
    subscriptionMonths: '1',
    paymentAmount: '',
    profilePicture: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const calculatedExpiryDate = calculateExpiryDate(formData.startDate, parseInt(formData.subscriptionMonths) || 1);
  
  // Calculate required amount (₹500 per month)
  const MONTHLY_FEE = 500;
  const requiredAmount = (parseInt(formData.subscriptionMonths) || 1) * MONTHLY_FEE;
  const paymentAmount = parseFloat(formData.paymentAmount) || 0;
  const remainingAmount = Math.max(0, requiredAmount - paymentAmount);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = `${t.students.name} ${t.forms.required}`;
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = `${t.students.phoneNumber} ${t.forms.required}`;
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = t.forms.invalidPhone;
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.forms.invalidEmail;
    }

    if (!formData.address.trim()) {
      newErrors.address = `${t.students.address} ${t.forms.required}`;
    }

    if (!formData.aadharCard.trim()) {
      newErrors.aadharCard = `${t.students.aadharCard} ${t.forms.required}`;
    } else if (!/^\d{12}$/.test(formData.aadharCard.replace(/\s/g, ''))) {
      newErrors.aadharCard = t.forms.invalidAadhar;
    }

    if (!formData.startDate) {
      newErrors.startDate = `${t.students.subscriptionStartDate} ${t.forms.required}`;
    } else {
      const selectedDate = new Date(formData.startDate);
      if (isNaN(selectedDate.getTime())) {
        newErrors.startDate = t.forms.invalidDate;
      } else {
        // Validate that start date is not in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
          newErrors.startDate = t.forms.futureDateNotAllowed;
        }
      }
    }

    if (!formData.paymentAmount.trim()) {
      newErrors.paymentAmount = `${t.students.paymentAmount} ${t.forms.required}`;
    } else {
      const payment = parseFloat(formData.paymentAmount);
      if (isNaN(payment) || payment < 0) {
        newErrors.paymentAmount = t.forms.invalidPayment;
      } else if (payment > requiredAmount) {
        newErrors.paymentAmount = `Payment cannot exceed required amount of ₹${requiredAmount}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate isPaymentDone based on remaining amount
      const payment = parseFloat(formData.paymentAmount);
      const months = parseInt(formData.subscriptionMonths) || 1;
      const requiredAmount = months * MONTHLY_FEE;
      const remainingAmount = Math.max(0, requiredAmount - payment);
      const isPaymentDone = remainingAmount === 0;

      // Convert paymentAmount to number and subscriptionMonths to number before sending
      const submitData = {
        ...formData,
        subscriptionMonths: parseInt(formData.subscriptionMonths),
        paymentAmount: parseFloat(formData.paymentAmount),
        isPaymentDone: isPaymentDone,
        aadharCard: formData.aadharCard.replace(/\s/g, ''), // Remove any spaces
        email: formData.email.trim() || undefined,
        seatNumber: formData.seatNumber ? parseInt(formData.seatNumber) : undefined,
      };
      const newStudent = await studentApi.create(submitData);

      // Reset form
      setFormData({
        name: '',
        phoneNumber: '',
        email: '',
        seatNumber: '',
        address: '',
        aadharCard: '',
        startDate: getTodayDate(),
        subscriptionMonths: '1',
        paymentAmount: '',
        profilePicture: '',
      });
      setErrors({});
      
      // Pass credentials if available
      const credentials = (newStudent as any).username && (newStudent as any).password
        ? { username: (newStudent as any).username, password: (newStudent as any).password }
        : undefined;
      
      onSuccess(credentials);
      onClose();
    } catch (error) {
      console.error('Error creating student:', error);
      setErrors({
        submit: error instanceof Error ? error.message : t.errors.failedToCreate,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {t.students.addStudent}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.name} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t.students.name}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Phone Number field */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.phoneNumber} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Email field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.email}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="student@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Seat Number field */}
              <div>
                <label
                  htmlFor="seatNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.seatNumber}
                </label>
                <select
                  id="seatNumber"
                  name="seatNumber"
                  value={formData.seatNumber}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.seatNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select seat number</option>
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((seat) => (
                    <option key={seat} value={seat.toString()}>
                      {seat}
                    </option>
                  ))}
                </select>
                {errors.seatNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.seatNumber}</p>
                )}
              </div>

              {/* Address field */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.address} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t.forms.enterCompleteAddress}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              {/* Aadhar Card field */}
              <div>
                <label
                  htmlFor="aadharCard"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.aadharCard} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="aadharCard"
                  name="aadharCard"
                  value={formData.aadharCard}
                  onChange={(e) => {
                    // Only allow digits and limit to 12
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setFormData((prev) => ({ ...prev, aadharCard: value }));
                    if (errors.aadharCard) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.aadharCard;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.aadharCard ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123456789012"
                  maxLength={12}
                />
                {errors.aadharCard && (
                  <p className="mt-1 text-sm text-red-600">{errors.aadharCard}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">{t.forms.enter12Digits}</p>
              </div>

              {/* Subscription Months field */}
              <div>
                <label
                  htmlFor="subscriptionMonths"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.subscriptionDuration} <span className="text-red-500">*</span>
                </label>
                <select
                  id="subscriptionMonths"
                  name="subscriptionMonths"
                  value={formData.subscriptionMonths}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.subscriptionMonths ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                    <option key={month} value={month.toString()}>
                      {month} {month === 1 ? t.forms.month : t.forms.months}
                    </option>
                  ))}
                </select>
                {errors.subscriptionMonths && (
                  <p className="mt-1 text-sm text-red-600">{errors.subscriptionMonths}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {t.forms.expiryAutoCalculated}
                </p>
              </div>

              {/* Required Amount Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Required Amount:</span>
                  <span className="text-lg font-semibold text-blue-900">₹{requiredAmount}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  ₹{MONTHLY_FEE} per month × {formData.subscriptionMonths} {parseInt(formData.subscriptionMonths) === 1 ? t.forms.month : t.forms.months}
                </p>
              </div>

              {/* Payment Amount field */}
              <div>
                <label
                  htmlFor="paymentAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.paymentAmount} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="paymentAmount"
                  name="paymentAmount"
                  value={formData.paymentAmount}
                  onChange={handleChange}
                  min="0"
                  max={requiredAmount}
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.paymentAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={`Enter amount (max ₹${requiredAmount})`}
                />
                {errors.paymentAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentAmount}</p>
                )}
                {formData.paymentAmount && !errors.paymentAmount && (
                  <p className="mt-1 text-xs text-gray-500">
                    You can pay partial amount. Remaining amount will be calculated.
                  </p>
                )}
              </div>

              {/* Remaining Amount Display */}
              {formData.paymentAmount && !errors.paymentAmount && remainingAmount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Remaining Amount:</span>
                    <span className="text-lg font-semibold text-yellow-900">₹{remainingAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Payment received: ₹{paymentAmount.toFixed(2)} | Required: ₹{requiredAmount} | Remaining: ₹{remainingAmount.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Full Payment Confirmation */}
              {formData.paymentAmount && !errors.paymentAmount && remainingAmount === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-900">Full payment received (₹{paymentAmount.toFixed(2)})</span>
                  </div>
                </div>
              )}

              {/* Start Date field */}
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.subscriptionStartDate} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  max={getTodayDate()}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">{t.forms.cannotBeFuture}</p>
              </div>

              {/* Calculated Expiry Date (read-only) */}
              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.subscriptionExpiryDate} ({t.forms.autoCalculated})
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={calculatedExpiryDate}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t.forms.expiryAutoCalculated}
                </p>
              </div>

              {/* Profile Picture field (optional) */}
              <div>
                <label
                  htmlFor="profilePicture"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t.students.profilePicture}
                </label>
                <input
                  type="url"
                  id="profilePicture"
                  name="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/photo.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t.forms.leaveEmptyForAvatar}
                </p>
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Form actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t.common.loading : t.students.addStudent}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

