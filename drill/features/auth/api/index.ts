import axios from 'axios';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types';

const API_URL = 'https://wersiyon44.pythonanywhere.com/api'

// Axios instance oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



// Response interceptor
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

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login/', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register/', credentials);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  getUser: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/user/');
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  // Axios interceptor'ları için helper fonksiyonlar
  setAuthToken: (token: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  removeAuthToken: () => {
    delete api.defaults.headers.common['Authorization'];
  }
}; 