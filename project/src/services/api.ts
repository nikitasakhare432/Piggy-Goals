import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://piggy-goals-2.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (name: string, phone: string, password: string) => {
    const response = await api.post('/auth/register', { name, phone, password });
    return response.data;
  },

  login: async (phone: string, password: string) => {
    const response = await api.post('/auth/login', { phone, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: { name?: string; profileImage?: string }) => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },
};

export const bankAPI = {
  linkBank: async (bankData: {
    bankName: string;
    upiId: string;
    cardLast4: string;
    cvv: string;
    expiry: string;
    currentBalance: number;
  }) => {
    const response = await api.post('/bank', bankData);
    return response.data;
  },

  getBankAccount: async () => {
    const response = await api.get('/bank');
    return response.data;
  },

  syncIncome: async (amount?: number) => {
    const response = await api.post('/bank/sync-income', { amount });
    return response.data;
  },

  removeBank: async () => {
    const response = await api.delete('/bank');
    return response.data;
  },
};

export const jarAPI = {
  createJar: async (jarData: {
    name: string;
    goalAmount: number;
    icon?: string;
    allocationPercentage?: number;
  }) => {
    const response = await api.post('/jars', jarData);
    return response.data;
  },

  getJars: async () => {
    const response = await api.get('/jars');
    return response.data;
  },

  getJar: async (jarId: string) => {
    const response = await api.get(`/jars/${jarId}`);
    return response.data;
  },

  updateJar: async (jarId: string, updates: {
    name?: string;
    goalAmount?: number;
    icon?: string;
  }) => {
    const response = await api.patch(`/jars/${jarId}`, updates);
    return response.data;
  },

  depositToJar: async (jarId: string, amount: number) => {
    const response = await api.post(`/jars/${jarId}/deposit`, { amount });
    return response.data;
  },

  lockJar: async (jarId: string, locked: boolean, pin?: string) => {
    const response = await api.patch(`/jars/${jarId}/lock`, { locked, pin });
    return response.data;
  },

  deleteJar: async (jarId: string) => {
    const response = await api.delete(`/jars/${jarId}`);
    return response.data;
  },
};

export const transactionAPI = {
  getTransactions: async (filters: {
    type?: string;
    limit?: number;
    page?: number;
    jarId?: string;
  } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/transactions?${params}`);
    return response.data;
  },

  getTransaction: async (transactionId: string) => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  },

  getInsights: async (period = 30) => {
    const response = await api.get(`/transactions/insights/summary?period=${period}`);
    return response.data;
  },
};

export const paymentAPI = {
  createPaymentIntent: async (data: {
    jarId: string;
    amount: number;
    recipientUPI: string;
    description?: string;
  }) => {
    const response = await api.post('/payments/create-intent', data);
    return response.data;
  },

  confirmPayment: async (data: {
    paymentIntentId: string;
    jarId: string;
    amount: number;
    recipientUPI: string;
    description?: string;
  }) => {
    const response = await api.post('/payments/confirm', data);
    return response.data;
  },

  simulateUPIPayment: async (data: {
    jarId: string;
    amount: number;
    recipientUPI: string;
    description?: string;
  }) => {
    const response = await api.post('/payments/simulate-upi', data);
    return response.data;
  },
};

export default api;