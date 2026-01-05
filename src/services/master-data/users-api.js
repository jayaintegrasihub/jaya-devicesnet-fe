import apiClient from '../api'

export default {
  getUsers() {
    return apiClient.get('users')
  },
  getUser(id) {
    return apiClient.get(`users/${id}`)
  },
  createUser(data) {
    return apiClient.post('users', data)
  },
  editUser(id, data) {
    return apiClient.patch(`users/${id}`, data)
  },
  deleteUser(id) {
    return apiClient.delete(`users/${id}`)
  }
}
