import axios from 'axios';

const baseUrl = "https://concise-fox-needlessly.ngrok-free.app";

//const baseUrl = "http://localhost:3050";

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

export const twilioApi = {
  getToken: (agentId: string) => api.get(`/twilio/token/${agentId}`),

  makeOutboundCall: (agentId: string, customerPhoneNumber: string) =>
    api.post(`/support-agents/${agentId}/call`, { customerPhoneNumber })
};

export default api;
