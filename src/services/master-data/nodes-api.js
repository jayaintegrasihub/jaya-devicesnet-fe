import apiClient from "../api";
 
export default {
  getNodes() {
    return apiClient.get('nodes')
  },
  getNode(id) {
    return apiClient.get(`nodes/${id}`)
  },
  createNode(data) {
    return apiClient.post('nodes',data)
  },
  editNode(id, data) {
    return apiClient.patch(`nodes/${id}`, data)
  },
  deleteNode(id) {
    return apiClient.delete(`nodes/${id}`)
  },
}