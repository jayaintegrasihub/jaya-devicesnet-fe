import apiClient from "../api";
 
export default {
  getApiKeys() {
    return apiClient.get('api-keys')
  },
  getApiKey(id) {
    return apiClient.get(`api-keys/${id}`)
  },
  createApiKey(data) {
    return apiClient.post('api-keys',data)
  },
  editApiKey(id, data) {
    return apiClient.patch(`api-keys/${id}`, data)
  },
  deleteApiKey(id) {
    return apiClient.delete(`api-keys/${id}`)
  },
}