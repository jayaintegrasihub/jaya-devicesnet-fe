import apiClient from "../api";
 
export default {
  getTelemetryData(tenant, params) {
    return apiClient.get(`telemetry/access-token/status-device/${tenant}`, {params})
  }
}