import apiClient from "../api";
 
const config = { 
  headers: {
    Accept: 'application/json'
  }
}

export default {
  signIn(data) {
    return apiClient.post('auth/signin',data,config)
  },
  signUp(data) {
    return apiClient.post('register',data,config)
  },
  signOut() {
    return apiClient.get('logout',config)
  },
  forgotPassword(data) {
    return apiClient.post('forgot-password',data)
  },
  newPassword(data,email,signature) {
    return apiClient.post(`reset-password/${email}?signature=${signature}`, data)
  },

}