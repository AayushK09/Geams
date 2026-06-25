import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const roomApi = {
  createRoom: (data: { createdBy: string }) => apiClient.post('/api/rooms/create', data),

  getRoomInfo: (roomId: string) => apiClient.get(`/api/rooms/${roomId}`),

  joinRoom: (roomId: string, data: { username: string; userId: string }) =>
    apiClient.post(`/api/rooms/${roomId}/join`, data),

  leaveRoom: (roomId: string, userId: string) =>
    apiClient.post(`/api/rooms/${roomId}/leave`, { userId }),
};
