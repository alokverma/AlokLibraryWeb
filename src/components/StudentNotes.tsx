import { useState, useEffect } from 'react';
import { noteApi, Note } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { studentApi } from '../services/api';

export const StudentNotes = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<{ subscriptionStatus?: 'active' | 'expired' } | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_CONTENT_LENGTH = 1000;

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    // Only fetch notes if student is not expired
    if (studentData?.subscriptionStatus !== 'expired') {
      fetchNotes();
    } else {
      setLoading(false);
      setNotes([]);
    }
  }, [studentData]);

  const fetchStudentData = async () => {
    if (user?.role === 'student' && user?.id) {
      try {
        const student = await studentApi.getById(user.id);
        setStudentData({ subscriptionStatus: student.subscriptionStatus });
      } catch (err) {
        console.error('Error fetching student data:', err);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await noteApi.getAll();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    // Check if student is expired
    if (studentData?.subscriptionStatus === 'expired') {
      return; // Don't open modal if expired
    }
    setFormData({ title: '', content: '' });
    setFormErrors({});
    setEditingNote(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (note: Note) => {
    setFormData({ title: note.title, content: note.content });
    setFormErrors({});
    setEditingNote(note);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingNote(null);
    setFormData({ title: '', content: '' });
    setFormErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length > MAX_CONTENT_LENGTH) {
      newErrors.content = `Content must not exceed ${MAX_CONTENT_LENGTH} characters`;
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingNote) {
        await noteApi.update(editingNote.id, formData);
      } else {
        await noteApi.create(formData);
      }
      
      await fetchNotes();
      handleCloseModal();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Failed to save note. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await noteApi.delete(id);
      await fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = studentData?.subscriptionStatus === 'expired';

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading notes...</p>
      </div>
    );
  }

  // If expired, show only the renewal message
  if (isExpired) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {t.students.subscriptionExpired || 'Subscription Expired'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{t.students.renewAtCoachingCenter || 'Please renew your subscription at the coaching center to continue using this feature.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">My Notes</h2>
          <p className="mt-1 text-sm text-gray-600">Quick todo and notes (max 1000 characters)</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          Add Note
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notes yet</h3>
          <p className="mt-2 text-sm text-gray-500">Create your first note to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                  {note.title}
                </h3>
                <div className="flex items-center space-x-2 ml-2">
                  <button
                    onClick={() => handleOpenEditModal(note)}
                    className="text-blue-600 hover:text-blue-800 focus:outline-none"
                    title="Edit note"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-red-600 hover:text-red-800 focus:outline-none"
                    title="Delete note"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap break-words">
                {note.content}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span>{formatDate(note.updatedAt)}</span>
                <span className="text-gray-400">{note.content.length} / {MAX_CONTENT_LENGTH}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCloseModal}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {editingNote ? 'Edit Note' : 'Add New Note'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title field */}
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter note title"
                      maxLength={255}
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                    )}
                  </div>

                  {/* Content field */}
                  <div>
                    <label
                      htmlFor="content"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.content ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter note content (max 1000 characters)"
                      maxLength={MAX_CONTENT_LENGTH}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {formErrors.content && (
                        <p className="text-sm text-red-600">{formErrors.content}</p>
                      )}
                      <p className={`text-xs ml-auto ${
                        formData.content.length > MAX_CONTENT_LENGTH * 0.9
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {formData.content.length} / {MAX_CONTENT_LENGTH} characters
                      </p>
                    </div>
                  </div>

                  {/* Submit error */}
                  {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-600">{formErrors.submit}</p>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : editingNote ? 'Update Note' : 'Add Note'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

