import { Student } from '../types/Student';

const rawApiBase = (import.meta.env?.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';
const API_BASE_URL = rawApiBase.replace(/\/+$/, '');
const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const studentApi = {
  // Get all students
  getAll: async (): Promise<Student[]> => {
    const response = await fetch(buildApiUrl('/students'), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
    return response.json();
  },

  // Get student by ID
  getById: async (id: string): Promise<Student> => {
    const response = await fetch(buildApiUrl(`/students/${id}`), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch student');
    }
    return response.json();
  },

  // Create new student
  create: async (student: Omit<Student, 'id' | 'subscriptionStatus' | 'expiryDate'> & { startDate?: string; address: string; aadharCard: string; paymentAmount: string | number }): Promise<Student> => {
    const response = await fetch(buildApiUrl('/students'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(student),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Failed to create student (${response.status})`;
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Update student
  update: async (id: string, student: Partial<Omit<Student, 'id'>>): Promise<Student> => {
    const response = await fetch(buildApiUrl(`/students/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(student),
    });
    if (!response.ok) {
      throw new Error('Failed to update student');
    }
    return response.json();
  },

  // Delete student
  delete: async (id: string): Promise<void> => {
    const response = await fetch(buildApiUrl(`/students/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete student');
    }
  },

  // Reset student password
  resetPassword: async (id: string): Promise<{ username: string; password: string }> => {
    const response = await fetch(buildApiUrl(`/students/${id}/reset-password`), {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to reset password';
      throw new Error(errorMessage);
    }
    return response.json();
  },
};

export const analyticsApi = {
  // Get monthly statistics
  getMonthlyStatistics: async (): Promise<{
    monthlyUsers: Array<{ month: string; count: number }>;
    monthlyEarnings: Array<{ month: string; earnings: number }>;
  }> => {
    const response = await fetch(buildApiUrl('/analytics/monthly'), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to fetch analytics';
      throw new Error(errorMessage);
    }
    return response.json();
  },
};

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'exam' | 'event' | 'library' | 'motivation' | 'form' | 'general';
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const notificationApi = {
  // Get all notifications
  getAll: async (activeOnly?: boolean): Promise<Notification[]> => {
    const url = activeOnly 
      ? buildApiUrl('/notifications?activeOnly=true')
      : buildApiUrl('/notifications');
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return response.json();
  },

  // Get notification by ID
  getById: async (id: string): Promise<Notification> => {
    const response = await fetch(buildApiUrl(`/notifications/${id}`), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch notification');
    }
    return response.json();
  },

  // Create notification
  create: async (notification: Omit<Notification, 'id' | 'createdBy' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<Notification> => {
    const response = await fetch(buildApiUrl('/notifications'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notification),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to create notification';
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Update notification
  update: async (id: string, notification: Partial<Omit<Notification, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>): Promise<Notification> => {
    const response = await fetch(buildApiUrl(`/notifications/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(notification),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to update notification';
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Delete notification
  delete: async (id: string): Promise<void> => {
    const response = await fetch(buildApiUrl(`/notifications/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  },
};

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const noteApi = {
  // Get all notes for the logged-in student
  getAll: async (): Promise<Note[]> => {
    const response = await fetch(buildApiUrl('/notes'), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }
    return response.json();
  },

  // Get note by ID
  getById: async (id: string): Promise<Note> => {
    const response = await fetch(buildApiUrl(`/notes/${id}`), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch note');
    }
    return response.json();
  },

  // Create note
  create: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const response = await fetch(buildApiUrl('/notes'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to create note';
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Update note
  update: async (id: string, note: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Note> => {
    const response = await fetch(buildApiUrl(`/notes/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to update note';
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Delete note
  delete: async (id: string): Promise<void> => {
    const response = await fetch(buildApiUrl(`/notes/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete note');
    }
  },
};

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'monthly' | 'onetime';
  category?: string;
  expenseDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const expenseApi = {
  // Get all expenses
  getAll: async (filters?: { type?: string; startDate?: string; endDate?: string }): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const url = buildApiUrl(`/expenses${params.toString() ? `?${params.toString()}` : ''}`);
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }
    return response.json();
  },

  // Get expense by ID
  getById: async (id: string): Promise<Expense> => {
    const response = await fetch(buildApiUrl(`/expenses/${id}`), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch expense');
    }
    return response.json();
  },

  // Create expense
  create: async (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
    const response = await fetch(buildApiUrl('/expenses'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(expense),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to create expense';
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Update expense
  update: async (id: string, expense: Partial<Omit<Expense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>): Promise<Expense> => {
    const response = await fetch(buildApiUrl(`/expenses/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(expense),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to update expense';
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Delete expense
  delete: async (id: string): Promise<void> => {
    const response = await fetch(buildApiUrl(`/expenses/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
  },

  // Get monthly expenses statistics
  getMonthlyStatistics: async (): Promise<Array<{ month: string; type: string; total: number }>> => {
    const response = await fetch(buildApiUrl('/expenses/monthly'), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch monthly expenses');
    }
    return response.json();
  },
};

