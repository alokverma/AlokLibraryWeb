import { useState, useEffect } from 'react';
import { Student } from '../types/Student';
import { studentApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface RenewSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess: () => void;
}

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

export const RenewSubscriptionModal = ({ isOpen, onClose, student, onSuccess }: RenewSubscriptionModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    startDate: getTodayDate(),
    subscriptionMonths: '1',
    paymentAmount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatedExpiryDate = calculateExpiryDate(formData.startDate, parseInt(formData.subscriptionMonths) || 1);
  
  // Calculate required amount and remaining amount
  const MONTHLY_FEE = 500;

  useEffect(() => {
    if (student && isOpen) {
      // Pre-fill with current values or defaults
      setFormData({
        startDate: student.startDate || getTodayDate(),
        subscriptionMonths: student.subscriptionMonths?.toString() || '1',
        paymentAmount: student.paymentAmount?.toString() || '500',
      });
      setErrors({});
    }
  }, [student, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

    if (!formData.subscriptionMonths || parseInt(formData.subscriptionMonths) < 1 || parseInt(formData.subscriptionMonths) > 12) {
      newErrors.subscriptionMonths = t.forms.invalidDuration;
    }

    if (!formData.paymentAmount.trim()) {
      newErrors.paymentAmount = `${t.students.paymentAmount} ${t.forms.required}`;
    } else {
      const payment = parseFloat(formData.paymentAmount);
      if (isNaN(payment) || payment < 0) {
        newErrors.paymentAmount = t.forms.invalidPayment;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !student) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate expiry date
      const expiryDate = calculateExpiryDate(formData.startDate, parseInt(formData.subscriptionMonths));

      // Calculate isPaymentDone based on remaining amount
      const payment = parseFloat(formData.paymentAmount);
      const months = parseInt(formData.subscriptionMonths) || 1;
      const required = months * MONTHLY_FEE;
      const remaining = Math.max(0, required - payment);
      const isPaymentDone = remaining === 0;

      // Update student subscription
      const updateData = {
        startDate: formData.startDate,
        expiryDate: expiryDate,
        subscriptionMonths: parseInt(formData.subscriptionMonths),
        paymentAmount: parseFloat(formData.paymentAmount),
        isPaymentDone: isPaymentDone,
      };

      await studentApi.update(student.id, updateData);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error renewing subscription:', error);
      setErrors({
        submit: error instanceof Error ? error.message : t.errors.failedToRenew,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold leading-6 text-gray-900">
                Renew Subscription
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{t.modals.renew.student}:</p>
              <p className="text-lg font-semibold text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-600">{t.students.phone}: {student.phoneNumber}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subscription Duration */}
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

              {/* Payment Amount */}
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
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.paymentAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="500.00"
                />
                {errors.paymentAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentAmount}</p>
                )}
              </div>


              {/* Start Date */}
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

              {/* Submit error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t.common.loading : t.students.renewSubscription}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

