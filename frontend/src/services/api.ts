import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateConfig: (data: unknown) => api.put('/auth/config', data)
};

export const materialsApi = {
  getAll: (params?: unknown) => api.get('/materials', { params }),
  getOne: (id: string) => api.get(`/materials/${id}`),
  create: (data: unknown) => api.post('/materials', data),
  update: (id: string, data: unknown) => api.put(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
  getLowStock: () => api.get('/materials/low-stock'),
  getMovements: (id: string) => api.get(`/materials/${id}/movements`),
  addMovement: (id: string, data: unknown) => api.post(`/materials/${id}/movements`, data)
};

export const modelsApi = {
  getAll: (params?: unknown) => api.get('/models', { params }),
  getOne: (id: string) => api.get(`/models/${id}`),
  create: (data: unknown) => api.post('/models', data),
  update: (id: string, data: unknown) => api.put(`/models/${id}`, data),
  delete: (id: string) => api.delete(`/models/${id}`),
  getCost: (id: string) => api.get(`/models/${id}/cost`),
  addComponent: (id: string, data: unknown) => api.post(`/models/${id}/components`, data),
  updateComponent: (id: string, componentId: string, data: unknown) => api.put(`/models/${id}/components/${componentId}`, data),
  deleteComponent: (id: string, componentId: string) => api.delete(`/models/${id}/components/${componentId}`),
  addOperation: (id: string, data: unknown) => api.post(`/models/${id}/operations`, data),
  updateOperation: (id: string, opId: string, data: unknown) => api.put(`/models/${id}/operations/${opId}`, data),
  deleteOperation: (id: string, opId: string) => api.delete(`/models/${id}/operations/${opId}`)
};

export const productionApi = {
  getOrders: (params?: unknown) => api.get('/production/orders', { params }),
  getOrder: (id: string) => api.get(`/production/orders/${id}`),
  createOrder: (data: unknown) => api.post('/production/orders', data),
  updateOrder: (id: string, data: unknown) => api.put(`/production/orders/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/production/orders/${id}/status`, { status }),
  getSemiFinished: (params?: unknown) => api.get('/production/semi-finished', { params }),
  addSemiFinished: (data: unknown) => api.post('/production/semi-finished', data)
};

export const stockApi = {
  getFinished: (params?: unknown) => api.get('/stock/finished', { params }),
  getFinishedSummary: () => api.get('/stock/finished/summary'),
  addMovement: (data: unknown) => api.post('/stock/finished', data)
};

export const employeesApi = {
  getAll: (params?: unknown) => api.get('/employees', { params }),
  getOne: (id: string) => api.get(`/employees/${id}`),
  create: (data: unknown) => api.post('/employees', data),
  update: (id: string, data: unknown) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getPieceRates: (id: string) => api.get(`/employees/${id}/piece-rates`),
  addPieceRate: (id: string, data: unknown) => api.post(`/employees/${id}/piece-rates`, data),
  getProductions: (id: string, params?: unknown) => api.get(`/employees/${id}/productions`, { params }),
  addProduction: (id: string, data: unknown) => api.post(`/employees/${id}/productions`, data)
};

export const payrollApi = {
  getAll: (params?: unknown) => api.get('/payroll', { params }),
  getSummary: (params?: unknown) => api.get('/payroll/summary', { params }),
  calculate: (data: unknown) => api.post('/payroll/calculate', data),
  create: (data: unknown) => api.post('/payroll', data),
  update: (id: string, data: unknown) => api.put(`/payroll/${id}`, data),
  validate: (id: string) => api.post(`/payroll/${id}/validate`),
  markPaid: (id: string) => api.post(`/payroll/${id}/pay`)
};

export const costsApi = {
  getCoutMinute: () => api.get('/costs/cout-minute'),
  getAllModelsCosts: () => api.get('/costs/models'),
  getModelCost: (id: string) => api.get(`/costs/models/${id}`)
};

export const suppliersApi = {
  getAll: () => api.get('/suppliers'),
  create: (data: unknown) => api.post('/suppliers', data),
  update: (id: string, data: unknown) => api.put(`/suppliers/${id}`, data)
};

export const dashboardApi = {
  get: () => api.get('/dashboard')
};

export const machinesApi = {
  getAll: (params?: unknown) => api.get('/machines', { params }),
  getOne: (id: string) => api.get(`/machines/${id}`),
  getStats: () => api.get('/machines/stats'),
  create: (data: unknown) => api.post('/machines', data),
  update: (id: string, data: unknown) => api.put(`/machines/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/machines/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/machines/${id}`)
};

export const lineBalanceApi = {
  calculate: (data: unknown) => api.post('/line-balance/calculate', data),
  getAssignments: (orderId: string) => api.get(`/line-balance/assignments/${orderId}`),
  createAssignment: (data: unknown) => api.post('/line-balance/assignments', data),
  updateAssignment: (id: string, data: unknown) => api.put(`/line-balance/assignments/${id}`, data),
  deleteAssignment: (id: string) => api.delete(`/line-balance/assignments/${id}`)
};

export const aiApi = {
  analyze: (question: string) => api.post('/ai/analyze', { question }),
  getChatToken: () => localStorage.getItem('token') || ''
};

export default api;
