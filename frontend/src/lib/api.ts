import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jamit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jamit_token');
      localStorage.removeItem('jamit_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  register: (data: { email: string; password: string; displayName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
};

export const songsApi = {
  list: (mine?: boolean) => api.get('/songs', { params: { mine: mine ? 'true' : undefined } }),
  upload: (formData: FormData) =>
    api.post('/songs/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  separate: (id: string) => api.post(`/songs/${id}/separate`),
  play: (id: string) => api.post(`/songs/${id}/play`),
  trim: (id: string, data: { startTime: number; endTime: number }) =>
    api.post(`/songs/${id}/trim`, data),
  merge: (data: { songIds: string[]; outputName?: string }) => api.post('/songs/merge', data),
  streamUrl: (id: string) => `${API_URL}/songs/${id}/stream`,
  stemStreamUrl: (id: string, part: 'vocals' | 'instrumentals') =>
    `${API_URL}/songs/${id}/stem?part=${part}`,
};

export const remixApi = {
  trending: () => api.get('/remixes/trending'),
  mine: () => api.get('/remixes/mine'),
  create: (data: object) => api.post('/remixes', data),
  like: (id: string) => api.post(`/remixes/${id}/like`),
  streamUrl: (id: string) => `${API_URL}/remixes/${id}/stream`,
  downloadUrl: (id: string) => `${API_URL}/remixes/${id}/download`,
  shareUrl: (shareId: string) => `/share/${shareId}`,
};

export const moodApi = {
  recommend: (text: string) => api.post('/mood/recommend', { text }),
  history: () => api.get('/mood/history'),
};

export const playlistApi = {
  list: () => api.get('/playlists'),
  create: (data: { name: string; description?: string }) => api.post('/playlists', data),
  add: (id: string, data: { songId?: string; remixId?: string }) =>
    api.post(`/playlists/${id}/add`, data),
};

export const communityApi = {
  feed: (page?: number) => api.get('/community/feed', { params: { page } }),
  save: (remixId: string) => api.post(`/community/save/${remixId}`),
  saved: () => api.get('/community/saved'),
};

export const userApi = {
  profile: () => api.get('/users/me'),
  update: (data: object) => api.patch('/users/me', data),
};
