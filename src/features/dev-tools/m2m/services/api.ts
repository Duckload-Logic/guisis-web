import { apiClient } from "@/lib/api";

export const m2mService = {
  getClients: async () => {
    const resp = await apiClient.get('/m2m-clients/me');
    return { ...resp, data: resp.data ? [resp.data] : [] };
  },
  createClient: (data: {
    clientName: string;
    clientDescription: string;
    hasPersonalInfoAccess?: boolean;
  }) => apiClient.post('/m2m-clients', data),
  deleteClient: (id: string) => apiClient.delete(`/m2m-clients/${id}`),
  generateSecret: (id: string) => apiClient.post(`/m2m-clients/${id}/secret`),
};

export default m2mService;
