interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  password: string;
  studentName?: string;
}

export const CredentialsModal = ({ isOpen, onClose, username, password, studentName }: CredentialsModalProps) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyBoth = () => {
    const credentials = `Username: ${username}\nPassword: ${password}`;
    navigator.clipboard.writeText(credentials);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {studentName ? `${studentName}'s Credentials` : 'Student Credentials'}
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Important:</strong> Save these credentials. They will not be shown again.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={username}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(username)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
                    title="Copy username"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={password}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(password)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
                    title="Copy password"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={copyBoth}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Copy Both
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                I've Saved These
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

