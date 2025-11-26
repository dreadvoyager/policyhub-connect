import axios from 'axios';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  Policy, 
  CreatePolicyRequest, 
  UpdatePolicyRequest,
  Claim,
  CreateClaimRequest,
  UpdateClaimRequest
} from '@/types';

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
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },
};

// Policy endpoints
export const policyApi = {
  getAll: async (): Promise<Policy[]> => {
    const response = await api.get('/api/policies');
    return response.data;
  },
  getById: async (id: number): Promise<Policy> => {
    const response = await api.get(`/api/policies/${id}`);
    return response.data;
  },
  create: async (data: CreatePolicyRequest): Promise<Policy> => {
    const response = await api.post('/api/policies', data);
    return response.data;
  },
  update: async (id: number, data: UpdatePolicyRequest): Promise<Policy> => {
    const response = await api.put(`/api/policies/${id}`, data);
    return response.data;
  },
};

// Claim endpoints
export const claimApi = {
  getAll: async (): Promise<Claim[]> => {
    const response = await api.get('/api/claims');
    return response.data;
  },
  getById: async (id: number): Promise<Claim> => {
    const response = await api.get(`/api/claims/${id}`);
    return response.data;
  },
  create: async (data: CreateClaimRequest): Promise<Claim> => {
    const response = await api.post('/api/claims', data);
    return response.data;
  },
  update: async (id: number, data: UpdateClaimRequest): Promise<Claim> => {
    const response = await api.put(`/api/claims/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/claims/${id}`);
  },
};

export default api;
