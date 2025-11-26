import axios from 'axios';
// Remove all types and interfaces
// import { ... } from '@/types';

// Configure base URL - update this to match your ASP.NET backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Better error handling (optionally toast here)
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
};

// Policy API
export const policyApi = {
  getAll: async () => {
    const response = await api.get('/api/policies');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/policies/${id}`);
    return response.data;
  },
  create: async (policyData) => {
    const response = await api.post('/api/policies', policyData);
    return response.data;
  },
  update: async (id, policyData) => {
    const response = await api.put(`/api/policies/${id}`, policyData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/policies/${id}`);
    return response.data;
  },
};

// Claim API
export const claimApi = {
  getAll: async () => {
    const response = await api.get('/api/claims');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/claims/${id}`);
    return response.data;
  },
  create: async (claimData) => {
    const response = await api.post('/api/claims', claimData);
    return response.data;
  },
  update: async (id, claimData) => {
    const response = await api.put(`/api/claims/${id}`, claimData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/claims/${id}`);
    return response.data;
  },
};

export { api };
