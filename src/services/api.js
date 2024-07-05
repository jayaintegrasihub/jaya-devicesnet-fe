import axios from "axios"
import router from "@/router"

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  }
})

const authInterceptor = (config) => {
  config.headers["Authorization"] = `Bearer ${localStorage.getItem('auth.accessToken')}`;
  return config
}

// Set up an interceptor to include bearer token
apiClient.interceptors.request.use(authInterceptor)

// Set up an interceptor to refresh the auth token on 401 errors
apiClient.interceptors.response.use(
  response => {
    const { data: { data }, headers, request, status, statusText } = response 
    return { data, headers, request, status, statusText}
  },
  async error => {
    const originalRequest = error.config;
    const status = error.response ? error.response.status : null;

    // If the error status is 401 and the request hasn't already been retried
    if (status === 401 && !originalRequest._retry) {

      originalRequest._retry = true;

      try {
        // Make a request to refresh the auth token
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}auth/refresh`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth.refreshToken')}`,
            },
          }
        );
        console.log(response)

        // If the refresh was successful, update the auth token and retry the original request
        localStorage.setItem('auth.accessToken', response.data.data.accessToken)
        localStorage.setItem('auth.refreshToken', response.data.data.refreshToken)
        apiClient.defaults.headers.common.Authorization = `Bearer ${response.data.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

        return apiClient(originalRequest);
      } catch (error) {
        // If the refresh failed, log the user out
        // You could also redirect the user to the login page here
        console.log('Error refreshing auth token', error);
        localStorage.clear('auth.accessToken')
        router.push({ name: 'login' })
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);


export default apiClient

