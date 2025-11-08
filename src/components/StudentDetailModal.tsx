import { Student } from '../types/Student';
import { useLanguage } from '../context/LanguageContext';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentDetailModal = ({ isOpen, onClose, student }: StudentDetailModalProps) => {
  const { t } = useLanguage();
  
  if (!isOpen || !student) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatAadhar = (aadhar?: string) => {
    if (!aadhar) return 'N/A';
    // Format as XXXX XXXX XXXX
    return aadhar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  };

  // Calculate remaining amount and payment status
  const MONTHLY_FEE = 500;
  const subscriptionMonths = student.subscriptionMonths || 1;
  const requiredAmount = subscriptionMonths * MONTHLY_FEE;
  const paymentAmount = student.paymentAmount || 0;
  const remainingAmount = Math.max(0, requiredAmount - paymentAmount);
  const hasRemainingAmount = remainingAmount > 0;
  
  // Determine payment status based on remaining amount
  // If remaining = 0 → Payment Done
  // If remaining = required (no payment) → Payment Pending
  // If remaining > 0 but < required → Payment Partial Done
  const paymentStatus = remainingAmount === 0 
    ? 'done' 
    : remainingAmount === requiredAmount 
      ? 'pending' 
      : 'partial';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold leading-6 text-gray-900">
                {t.modals.studentDetail.title}
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

            <div className="space-y-6">
              {/* Profile Picture and Basic Info */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <img
                    src={student.profilePicture}
                    alt={student.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/96?text=' + student.name.charAt(0);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                  <div className="mt-2 flex items-center space-x-3 flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        student.subscriptionStatus === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {student.subscriptionStatus === 'active' ? t.students.active : t.students.expired}
                    </span>
                    {paymentStatus === 'done' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {t.students.paymentDone}
                      </span>
                    )}
                    {paymentStatus === 'pending' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        {t.students.paymentPending}
                      </span>
                    )}
                    {paymentStatus === 'partial' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        {t.students.paymentPartialDone || 'Payment Partial Done'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.modals.studentDetail.phoneNumber}</label>
                  <div className="flex items-center text-gray-900">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-medium">{student.phoneNumber}</span>
                  </div>
                </div>

                {/* Aadhar Card */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.modals.studentDetail.aadharCard}</label>
                  <div className="flex items-center text-gray-900">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <span className="font-medium font-mono">{formatAadhar(student.aadharCard)}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.modals.studentDetail.address}</label>
                  <div className="flex items-start text-gray-900">
                    <svg className="w-5 h-5 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{student.address || 'N/A'}</span>
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.modals.studentDetail.subscriptionStartDate}</label>
                  <div className="flex items-center text-gray-900">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(student.startDate)}</span>
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.modals.studentDetail.subscriptionExpiryDate}</label>
                  <div className="flex items-center text-gray-900">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(student.expiryDate)}</span>
                  </div>
                </div>

                {/* Subscription Duration */}
                {student.subscriptionMonths && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">{t.modals.studentDetail.subscriptionDuration}</label>
                    <div className="flex items-center text-gray-900">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{student.subscriptionMonths} {student.subscriptionMonths === 1 ? t.modals.studentDetail.month : t.modals.studentDetail.months}</span>
                    </div>
                  </div>
                )}

                {/* Payment Amount */}
                {student.paymentAmount !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">{t.modals.studentDetail.paymentAmount}</label>
                    <div className="flex items-center text-gray-900">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{formatCurrency(student.paymentAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Required Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.modals.studentDetail.requiredAmount}</label>
                  <div className="flex items-center text-gray-900">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">{formatCurrency(requiredAmount)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">₹{MONTHLY_FEE} {t.modals.studentDetail.perMonth} × {subscriptionMonths} {subscriptionMonths === 1 ? t.modals.studentDetail.month : t.modals.studentDetail.months}</p>
                </div>
              </div>

              {/* Remaining Amount Alert */}
              {hasRemainingAmount && (
                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-yellow-800">{t.modals.studentDetail.remainingAmount}</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p className="font-semibold text-lg">₹{remainingAmount.toFixed(2)}</p>
                        <p className="mt-1">
                          {t.modals.studentDetail.paymentReceived}: {formatCurrency(paymentAmount)} | {t.modals.studentDetail.required}: {formatCurrency(requiredAmount)} | {t.modals.studentDetail.remaining}: {formatCurrency(remainingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Payment Confirmation */}
              {!hasRemainingAmount && student.paymentAmount !== undefined && paymentAmount > 0 && (
                <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-green-800">{t.modals.studentDetail.fullPaymentReceived}</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>{t.modals.studentDetail.paymentReceivedInFull.replace('{amount}', formatCurrency(paymentAmount))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

