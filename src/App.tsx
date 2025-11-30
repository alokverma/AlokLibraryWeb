import { useState, useMemo, useEffect } from 'react';
import { StudentCard } from './components/StudentCard';
import { AddStudentForm } from './components/AddStudentForm';
import { CredentialsModal } from './components/CredentialsModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { RenewSubscriptionModal } from './components/RenewSubscriptionModal';
import { Analytics } from './components/Analytics';
import { Notifications } from './components/Notifications';
import { StudentNotes } from './components/StudentNotes';
import { Expenses } from './components/Expenses';
import { Login } from './components/Login';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { Student } from './types/Student';
import { studentApi } from './services/api';
import { LanguageSwitcher } from './components/LanguageSwitcher';

function App() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newStudentCredentials, setNewStudentCredentials] = useState<{username: string; password: string; studentName?: string; phoneNumber?: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'analytics' | 'notifications' | 'expenses'>('students');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [studentToRenew, setStudentToRenew] = useState<Student | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentApi.getAll();
      setStudents(data);
    } catch (err) {
      setError(t.errors.failedToLoad);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated]);

  const handleAddSuccess = (credentials?: {username: string; password: string; phoneNumber?: string; studentName?: string}) => {
    if (credentials) {
      setNewStudentCredentials(credentials);
    }
    fetchStudents();
  };

  const handleResetPassword = async (studentId: string, studentName: string) => {
    try {
      // Fetch student details to get phone number
      const student = await studentApi.getById(studentId);
      const credentials = await studentApi.resetPassword(studentId);
      setNewStudentCredentials({
        ...credentials,
        studentName,
        phoneNumber: student.phoneNumber,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate password. Please try again.');
    }
  };

  const handleStudentCardClick = async (student: Student) => {
    try {
      // Fetch full student details to ensure we have all fields
      const fullStudent = await studentApi.getById(student.id);
      setSelectedStudent(fullStudent);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching student details:', error);
      // If fetch fails, use the student data we already have
      setSelectedStudent(student);
      setIsDetailModalOpen(true);
    }
  };

  const handleRenewSubscription = (student: Student) => {
    setStudentToRenew(student);
    setIsRenewModalOpen(true);
  };

  const handleRenewSuccess = () => {
    fetchStudents(); // Refresh the student list
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(t.students.deleteConfirmation?.replace('{name}', studentName) || `Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await studentApi.delete(studentId);
      fetchStudents(); // Refresh the student list
    } catch (error) {
      console.error('Error deleting student:', error);
      alert(error instanceof Error ? error.message : t.errors.failedToDelete);
    }
  };

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return students;
    }
    const query = searchQuery.toLowerCase().trim();
    return students.filter((student) => {
      const name = student.name?.toLowerCase() || '';
      const phoneNumber = student.phoneNumber?.toLowerCase() || '';
      const address = student.address?.toLowerCase() || '';
      const aadharCard = student.aadharCard?.toLowerCase() || '';
      return (
        name.includes(query) ||
        phoneNumber.includes(query) ||
        address.includes(query) ||
        aadharCard.includes(query)
      );
    });
  }, [students, searchQuery]);

  const activeStudents = useMemo(
    () => filteredStudents.filter((s) => s.subscriptionStatus === 'active'),
    [filteredStudents]
  );

  const expiredStudents = useMemo(
    () => filteredStudents.filter((s) => s.subscriptionStatus === 'expired'),
    [filteredStudents]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo.svg" 
                alt="Alok Library Logo" 
                className="h-20 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <button
                  onClick={() => setIsAddFormOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {t.students.addStudent}
                </button>
              )}
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t.auth.logout}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation for Admin and Teacher */}
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('students')}
                className={`${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <svg
                  className="w-5 h-5 inline-block mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                {t.nav.students}
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  <svg
                    className="w-5 h-5 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {t.nav.analytics}
                </button>
              )}
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`${
                    activeTab === 'expenses'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  <svg
                    className="w-5 h-5 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {t.nav.expenses}
                </button>
              )}
              <button
                onClick={() => setActiveTab('notifications')}
                className={`${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <svg
                  className="w-5 h-5 inline-block mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {t.nav.notifications}
              </button>
            </nav>
          </div>
        )}

        {/* Analytics View */}
        {user?.role === 'admin' && activeTab === 'analytics' && <Analytics />}

        {/* Expenses View */}
        {user?.role === 'admin' && activeTab === 'expenses' && <Expenses />}

        {/* Notifications View */}
        {(user?.role === 'admin' || user?.role === 'teacher') && activeTab === 'notifications' && (
          <Notifications userRole={user.role} />
        )}

        {/* Students View */}
        {((user?.role !== 'admin' && user?.role !== 'teacher') || activeTab === 'students') && (
          <>
            {/* Notifications Section for Students */}
            {user?.role === 'student' && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Announcements</h2>
                <Notifications userRole={user.role} />
              </div>
            )}

            {/* Student Notes Section */}
            {user?.role === 'student' && (
              <div className="mb-8">
                <StudentNotes />
              </div>
            )}

            {/* Search Bar for Admin and Teacher */}
            {(user?.role === 'admin' || user?.role === 'teacher') && (
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t.students.searchPlaceholder || 'Search students by name, phone, address, or Aadhar...'}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      type="button"
                    >
                      <svg
                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
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
                  )}
                </div>
                {searchQuery && (
                  <p className="mt-2 text-sm text-gray-600">
                    {t.students.searchResults || 'Search results'}: {filteredStudents.length} {filteredStudents.length === 1 ? (t.students.student || 'student') : (t.students.students || 'students')}
                  </p>
                )}
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading students...</p>
              </div>
            )}

            {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading students</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Active Subscriptions Section */}
            <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {user?.role === 'student' ? t.students.mySubscription : t.students.activeStudents}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {user?.role === 'student' 
                  ? t.students.subscriptionDetails
                  : `${activeStudents.length} ${t.students.studentsWithActive}`}
              </p>
            </div>
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {activeStudents.length} {t.students.active}
            </div>
          </div>
          {activeStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onResetPassword={handleResetPassword}
                  canResetPassword={user?.role === 'admin' || user?.role === 'teacher'}
                  onClick={handleStudentCardClick}
                  onRenew={handleRenewSubscription}
                  canRenew={user?.role === 'admin' || user?.role === 'teacher'}
                  onDelete={handleDeleteStudent}
                  canDelete={user?.role === 'admin' || user?.role === 'teacher'}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {t.students.noActiveStudents}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {t.students.noActiveStudents}
              </p>
            </div>
          )}
        </section>

        {/* Expired Subscriptions Section */}
        {user?.role !== 'student' && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t.students.expiredStudents}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {expiredStudents.length} {t.students.studentsWithExpired}
              </p>
            </div>
            <div className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {expiredStudents.length} {t.students.expired}
            </div>
          </div>
          {expiredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onResetPassword={handleResetPassword}
                  canResetPassword={user?.role === 'admin' || user?.role === 'teacher'}
                  onClick={handleStudentCardClick}
                  onRenew={handleRenewSubscription}
                  canRenew={user?.role === 'admin' || user?.role === 'teacher'}
                  onDelete={handleDeleteStudent}
                  canDelete={user?.role === 'admin' || user?.role === 'teacher'}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {t.students.noExpiredStudents}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {t.students.allExpired}
              </p>
            </div>
          )}
        </section>
        )}
          </>
        )}
          </>
        )}
      </main>

      {/* Add Student Form Modal */}
      <AddStudentForm
        isOpen={isAddFormOpen}
        onClose={() => {
          setIsAddFormOpen(false);
          setNewStudentCredentials(null);
        }}
        onSuccess={handleAddSuccess}
      />

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={!!newStudentCredentials}
        onClose={() => setNewStudentCredentials(null)}
        username={newStudentCredentials?.username || ''}
        password={newStudentCredentials?.password || ''}
        studentName={newStudentCredentials?.studentName}
        phoneNumber={newStudentCredentials?.phoneNumber}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />

      {/* Renew Subscription Modal */}
      <RenewSubscriptionModal
        isOpen={isRenewModalOpen}
        onClose={() => {
          setIsRenewModalOpen(false);
          setStudentToRenew(null);
        }}
        student={studentToRenew}
        onSuccess={handleRenewSuccess}
      />
    </div>
  );
}

export default App;

