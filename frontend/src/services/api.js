import axios from 'axios';

// CRA dev proxy in package.json forwards /api → http://localhost:5000
// In production set: REACT_APP_API_URL=https://your-backend.com/api
const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

/* ── Request interceptor ─────────────────────────────── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskflow_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response interceptor ────────────────────────────── */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        message: 'Cannot reach server. Is the backend running on port 5000?'
      });
    }
    const { status, data } = error.response;
    const message = data?.message || `Server error (${status})`;
    if (status === 401) {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject({ message });
  }
);

/* ── Auth ─────────────────────────────────────────────── */
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

/* ── Tasks ───────────────────────────────────────────── */
export const tasksAPI = {
  getAll:     (params)    => api.get('/tasks', { params }),
  getOne:     (id)        => api.get(`/tasks/${id}`),
  create:     (data)      => api.post('/tasks', data),
  update:     (id, data)  => api.put(`/tasks/${id}`, data),
  delete:     (id)        => api.delete(`/tasks/${id}`),
  addComment: (id, text)  => api.post(`/tasks/${id}/comments`, { text }),
  reorder:    (tasks)     => api.put('/tasks/reorder', { tasks }),
};

/* ── Projects ────────────────────────────────────────── */
export const projectsAPI = {
  getAll:  (params)   => api.get('/projects', { params }),
  getOne:  (id)       => api.get(`/projects/${id}`),
  create:  (data)     => api.post('/projects', data),
  update:  (id, data) => api.put(`/projects/${id}`, data),
  delete:  (id)       => api.delete(`/projects/${id}`),
};

/* ── Notes ───────────────────────────────────────────── */
export const notesAPI = {
  getAll:  (params)   => api.get('/notes', { params }),
  getOne:  (id)       => api.get(`/notes/${id}`),
  create:  (data)     => api.post('/notes', data),
  update:  (id, data) => api.put(`/notes/${id}`, data),
  delete:  (id)       => api.delete(`/notes/${id}`),
};

/* ── Documents ───────────────────────────────────────── */
export const documentsAPI = {
  getAll:  ()         => api.get('/documents'),
  upload:  (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  delete:  (id)       => api.delete(`/documents/${id}`),
};

/* ── Dashboard ───────────────────────────────────────── */
export const dashboardAPI = {
  getStats:    ()       => api.get('/dashboard/stats'),
  getCalendar: (params) => api.get('/dashboard/calendar', { params }),
};

/* ── AI ──────────────────────────────────────────────── */
export const aiAPI = {
  query: (query) => api.post('/ai/query', { query }),
};

export default api;
