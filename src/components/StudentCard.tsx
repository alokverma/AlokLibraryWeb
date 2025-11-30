import { Student } from '../types/Student';
import { useLanguage } from '../context/LanguageContext';
import { calculateSubscriptionAmount } from '../utils/subscriptionUtils';

interface StudentCardProps {
  student: Student;
  onResetPassword?: (studentId: string, studentName: string) => void;
  canResetPassword?: boolean;
  onClick?: (student: Student) => void;
  onRenew?: (student: Student) => void;
  canRenew?: boolean;
  onDelete?: (studentId: string, studentName: string) => void;
  canDelete?: boolean;
}

export const StudentCard = ({ student, onResetPassword, canResetPassword = false, onClick, onRenew, canRenew = false, onDelete, canDelete = false }: StudentCardProps) => {
  const { t } = useLanguage();
  const isActive = student.subscriptionStatus === 'active';
  const expiryDate = new Date(student.expiryDate);
  const formattedDate = expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate payment status based on remaining amount
  // Use stored requiredAmount (preserves discount history) or recalculate if not available
  const paymentAmount = student.paymentAmount || 0;
  const requiredAmount = student.requiredAmount ?? (() => {
    // Fallback: recalculate if requiredAmount not stored (for backward compatibility)
    const subscriptionMonths = student.subscriptionMonths || 1;
    const subscriptionCalc = calculateSubscriptionAmount(subscriptionMonths);
    return subscriptionCalc.finalAmount;
  })();
  const remainingAmount = Math.max(0, requiredAmount - paymentAmount);
  
  // Determine payment status based on remaining amount
  // If remaining = 0 → Payment Done
  // If remaining = required (no payment) → Payment Pending
  // If remaining > 0 but < required → Payment Partial Done
  const paymentStatus = remainingAmount === 0 
    ? 'done' 
    : remainingAmount === requiredAmount 
      ? 'pending' 
      : 'partial';

  const handleResetPassword = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking reset password
    if (onResetPassword) {
      onResetPassword(student.id, student.name);
    }
  };

  const handleRenew = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking renew
    if (onRenew) {
      onRenew(student);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking delete
    if (onDelete) {
      onDelete(student.id, student.name);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(student);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <img
              src={student.profilePicture}
              alt={student.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/64?text=' + student.name.charAt(0);
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {student.name}
              </h3>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isActive ? t.students.active : t.students.expired}
                </span>
                {paymentStatus === 'done' && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {t.students.paymentDone}
                  </span>
                )}
                {paymentStatus === 'pending' && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {t.students.paymentPending}
                  </span>
                )}
                {paymentStatus === 'partial' && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {t.students.paymentPartialDone || 'Payment Partial Done'}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {student.phoneNumber}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {t.students.expires}: {formattedDate}
              </div>
            </div>
            {(canResetPassword && onResetPassword) || (canRenew && onRenew && !isActive) || (canDelete && onDelete) ? (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {canRenew && onRenew && !isActive && (
                  <button
                    onClick={handleRenew}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    type="button"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {t.students.renewSubscription}
                  </button>
                )}
                {canResetPassword && onResetPassword && (
                  <button
                    onClick={handleResetPassword}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    type="button"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    {t.students.resetPassword}
                  </button>
                )}
                {canDelete && onDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    type="button"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {t.common.delete}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

