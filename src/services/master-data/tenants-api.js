import apiClient from "../api";
 
export default {
  getTenants() {
    return apiClient.get('tenants')
  },
  getTenant(id) {
    return apiClient.get(`tenants/${id}`)
  },
  createTenant(data) {
    return apiClient.post('tenants',data)
  },
  editTenant(id, data) {
    return apiClient.patch(`tenants/${id}`, data)
  },
  deleteTenant(id) {
    return apiClient.delete(`tenants/${id}`)
  },
}