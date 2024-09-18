import apiClient from "../api";
 
export default {
  getGateways() {
    return apiClient.get('gateways')
  },
  getGateway(id) {
    return apiClient.get(`gateways/${id}`)
  },
  getGatewayNodes(id) {
    return apiClient.get(`gateways/find-node/${id}`)
  },
  createGateway(data) {
    return apiClient.post('gateways',data)
  },
  editGateway(id, data) {
    return apiClient.patch(`gateways/${id}`, data)
  },
  deleteGateway(id) {
    return apiClient.delete(`gateways/${id}`)
  },
}