import apiClient from "../api";
 
export default {
  getTelemetryDetail(serialNumber) {
    return apiClient.get(`telemetry/details/${serialNumber}`)
  },
  getTelemetryHistory(sn,params) {
    return apiClient.get(`telemetry/history/${sn}`, {params})
  },
  getTelemetryCompleteness(sn,params) {
    return apiClient.get(`telemetry/completeness/${sn}`, {params})
  }
}