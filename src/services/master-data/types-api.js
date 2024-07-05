import apiClient from "../api";
 
export default {
  getTypes() {
    return apiClient.get('types')
  },
  getType(id) {
    return apiClient.get(`types/${id}`)
  },
  createType(data) {
    return apiClient.post('types',data)
  },
  editType(id, data) {
    return apiClient.patch(`types/${id}`,data)
  },
  deleteType(id) {
    return apiClient.delete(`types/${id}`)
  },
}