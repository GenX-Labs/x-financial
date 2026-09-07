import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getDatasets = async () => {
  const response = await api.get('/api/datasets');
  return response.data;
};

export const deleteDataset = async (id: string) => {
  const response = await api.delete(`/api/datasets/${id}`);
  return response.data;
};

export const getAnalysis = async (datasetId: string, timeRange?: string) => {
  const response = await api.get(`/api/analysis/${datasetId}`, {
    params: { timeRange },
  });
  return response.data;
};

export const chatWithCopilot = async (message: string, datasetId: string, history: any[]) => {
  const response = await api.post('/api/chat', { message, datasetId, history });
  return response.data;
};

export const calculateMetrics = async (datasetId: string, metric: string) => {
  const response = await api.post('/api/calculate', { datasetId, metric });
  return response.data;
};