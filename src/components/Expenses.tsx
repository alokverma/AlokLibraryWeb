import { useState, useEffect } from 'react';
import { expenseApi, Expense } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const Expenses = () => {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'monthly' | 'onetime'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    type: 'monthly' as 'monthly' | 'onetime',
    category: '',
    expenseDate: getTodayDate(),
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [filterType]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: { type?: string } = {};
      if (filterType !== 'all') {
        filters.type = filterType;
      }
      const data = await expenseApi.getAll(filters);
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      type: 'monthly',
      category: '',
      expenseDate: getTodayDate(),
    });
    setFormErrors({});
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      type: expense.type,
      category: expense.category || '',
      expenseDate: expense.expenseDate,
    });
    setFormErrors({});
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
    setFormData({
      title: '',
      description: '',
      amount: '',
      type: 'monthly',
      category: '',
      expenseDate: getTodayDate(),
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount < 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
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
      if (editingExpense) {
        await expenseApi.update(editingExpense.id, {
          title: formData.title,
          description: formData.description || undefined,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category || undefined,
          expenseDate: formData.expenseDate,
        });
      } else {
        await expenseApi.create({
          title: formData.title,
          description: formData.description || undefined,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category || undefined,
          expenseDate: formData.expenseDate,
        });
      }

      await fetchExpenses();
      handleCloseModal();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Failed to save expense. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseApi.delete(id);
      await fetchExpenses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const monthlyExpenses = expenses.filter((e) => e.type === 'monthly');
  const oneTimeExpenses = expenses.filter((e) => e.type === 'onetime');
  const totalMonthly = monthlyExpenses.reduce((sum, e) => {
    const amount = typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0;
    return sum + amount;
  }, 0);
  const totalOneTime = oneTimeExpenses.reduce((sum, e) => {
    const amount = typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0;
    return sum + amount;
  }, 0);
  const totalAll = expenses.reduce((sum, e) => {
    const amount = typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0;
    return sum + amount;
  }, 0);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{t.expenses.title || 'Expenses'}</h2>
          <p className="mt-1 text-sm text-gray-600">{t.expenses.subtitle || 'Manage monthly and one-time expenses'}</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.expenses.addExpense || 'Add Expense'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.expenses.totalExpenses || 'Total Expenses'}</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalAll)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.expenses.monthlyExpenses || 'Monthly Expenses'}</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalMonthly)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.expenses.oneTimeExpenses || 'One-Time Expenses'}</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalOneTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilterType('all')}
            className={`${
              filterType === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            {t.expenses.allExpenses || 'All Expenses'}
          </button>
          <button
            onClick={() => setFilterType('monthly')}
            className={`${
              filterType === 'monthly'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            {t.expenses.monthly || 'Monthly'}
          </button>
          <button
            onClick={() => setFilterType('onetime')}
            className={`${
              filterType === 'onetime'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            {t.expenses.oneTime || 'One-Time'}
          </button>
        </nav>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t.expenses.noExpenses || 'No expenses yet'}</h3>
          <p className="mt-2 text-sm text-gray-500">{t.expenses.addFirstExpense || 'Add your first expense to get started'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{expense.title}</h3>
                  {expense.category && (
                    <p className="text-sm text-gray-500 mt-1">{expense.category}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    expense.type === 'monthly'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {expense.type === 'monthly' ? (t.expenses.monthly || 'Monthly') : (t.expenses.oneTime || 'One-Time')}
                </span>
              </div>
              {expense.description && (
                <p className="text-sm text-gray-600 mb-3">{expense.description}</p>
              )}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">{t.expenses.date || 'Date'}</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(expense.expenseDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{t.expenses.amount || 'Amount'}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount) || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEditModal(expense)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  type="button"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t.common.edit || 'Edit'}
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  type="button"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t.common.delete || 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {isFormOpen && (
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
                    {editingExpense ? (t.expenses.editExpense || 'Edit Expense') : (t.expenses.addExpense || 'Add Expense')}
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
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.expenses.titleLabel || 'Title'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t.expenses.titlePlaceholder || 'e.g., Internet Bill, AC Setup'}
                      required
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                    )}
                  </div>

                  {/* Type field */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.expenses.typeLabel || 'Type'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="monthly">{t.expenses.monthly || 'Monthly'}</option>
                      <option value="onetime">{t.expenses.oneTime || 'One-Time'}</option>
                    </select>
                  </div>

                  {/* Category field */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.expenses.categoryLabel || 'Category'} <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t.expenses.categoryPlaceholder || 'e.g., Utilities, Equipment'}
                    />
                  </div>

                  {/* Amount field */}
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.expenses.amountLabel || 'Amount (₹)'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.amount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      required
                    />
                    {formErrors.amount && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
                    )}
                  </div>

                  {/* Date field */}
                  <div>
                    <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.expenses.dateLabel || 'Expense Date'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="expenseDate"
                      name="expenseDate"
                      value={formData.expenseDate}
                      onChange={handleChange}
                      max={getTodayDate()}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.expenseDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.expenseDate && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.expenseDate}</p>
                    )}
                  </div>

                  {/* Description field */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.expenses.descriptionLabel || 'Description'} <span className="text-gray-400">(Optional)</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t.expenses.descriptionPlaceholder || 'Additional details about this expense...'}
                    />
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
                      {t.common.cancel || 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? (t.common.loading || 'Saving...')
                        : editingExpense
                        ? (t.common.update || 'Update')
                        : (t.expenses.addExpense || 'Add Expense')}
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

