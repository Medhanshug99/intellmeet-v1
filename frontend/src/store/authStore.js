import { create } from 'zustand';
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1',
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken } = res.data.data;
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSignupOtpSent: false,
  isLoginOtpSent: false,
  emailInFlow: '',

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/refresh');
      const { accessToken, user } = res.data.data;
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  signup: async (email, password, name) => {
    try {
      set({ isLoading: true });
      await api.post('/auth/register', { name, email, password });
      await api.post('/auth/send-otp', { email, type: 'signup' });
      set({ isLoading: false, isSignupOtpSent: true, emailInFlow: email });
      return { success: true, otpRequired: true };
    } catch (err) {
      set({ isLoading: false });
      const data = err.response?.data;
      const errorMsg = data?.errors?.[0]?.message || data?.message || err.message || 'Failed to sign up';
      return { success: false, error: errorMsg };
    }
  },

  verifySignupOtp: async (email, token) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/verify-otp', { email, token, type: 'signup' });
      const { accessToken, user } = res.data.data;
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isAuthenticated: true, isLoading: false, isSignupOtpSent: false, emailInFlow: '' });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.message || err.message || 'Failed to verify code' };
    }
  },

  sendLoginCode: async (email) => {
    try {
      set({ isLoading: true });
      await api.post('/auth/send-otp', { email, type: 'login' });
      set({ isLoading: false, isLoginOtpSent: true, emailInFlow: email });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.message || err.message || 'Failed to send login code' };
    }
  },

  verifyLoginCode: async (email, token) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/verify-otp', { email, token, type: 'login' });
      const { accessToken, user } = res.data.data;

      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isAuthenticated: true, isLoading: false, isLoginOtpSent: false, emailInFlow: '' });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.message || err.message || 'Failed to verify code' };
    }
  },

  resetFlow: () => {
    set({ isSignupOtpSent: false, isLoginOtpSent: false, emailInFlow: '' });
  },

  checkEmailExists: async (email) => {
    try {
      const res = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      return res.data?.data?.exists ?? false;
    } catch {
      return false;
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data.data;

      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isAuthenticated: true, isLoading: false, emailInFlow: '' });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      const data = err.response?.data;
      const errorMsg = data?.message || err.message || 'Failed to sign in';
      return { success: false, error: errorMsg };
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await api.post('/auth/logout');
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (err) {
      console.error('Logout failed', err);
      set({ isLoading: false });
    }
  },

  deleteAccount: async () => {
    try {
      set({ isLoading: true });
      await api.delete('/users/me');
      await api.post('/auth/logout');
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, isAuthenticated: false, isLoading: false });
      return { success: true };
    } catch (err) {
      console.error('Delete account failed', err);
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.message || err.message || 'Failed to delete account' };
    }
  }
}));
