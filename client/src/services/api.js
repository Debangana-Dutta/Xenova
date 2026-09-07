import axios from 'axios';

// Base URL of the Express backend. Configure via .env in create-react-app
// with REACT_APP_API_URL if the backend runs somewhere other than localhost:5001.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the httpOnly auth cookie with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Auth ------------------------------------------------------------------
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  // New: requires the current password, so a stolen cookie alone can't
  // take over the account by rotating the password.
  changePassword: (data) => api.put('/auth/me/password', data),
};

// --- Finance -----------------------------------------------------------------
export const financeApi = {
  getTransactions: (params) => api.get('/finance/transactions', { params }),
  createTransaction: (data) => api.post('/finance/transactions', data),
  updateTransaction: (id, data) => api.put(`/finance/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/finance/transactions/${id}`),
  getSummary: () => api.get('/finance/summary'),
};

// --- Productivity ------------------------------------------------------------
export const productivityApi = {
  getFocusSessions: () => api.get('/productivity/focus-sessions'),
  createFocusSession: (data) => api.post('/productivity/focus-sessions', data),
  getActivities: (params) => api.get('/productivity/activities', { params }),
  createActivity: (formData) =>
    api.post('/productivity/activities', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateActivity: (id, formData) =>
    api.put(`/productivity/activities/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteActivity: (id) => api.delete(`/productivity/activities/${id}`),
  getSummary: () => api.get('/productivity/summary'),
};

export const getFileUrl = (relativePath) => {
  if (!relativePath) return null;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${origin}${relativePath}`;
};

export default api;
