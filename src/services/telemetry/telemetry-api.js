import apiClient from "../api";
 
export default {
  getTelemetryData(tenant) {
    return apiClient.get(`telemetry/access-token/status-device/${tenant}`)
  }
}