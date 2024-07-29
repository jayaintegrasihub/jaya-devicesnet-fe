import apiClient from "../api";
 
export default {
  getTelemetryDetail(serialNumber) {
    return apiClient.get(`telemetry/details/${serialNumber}`)
  }
}