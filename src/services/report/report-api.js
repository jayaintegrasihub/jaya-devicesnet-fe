import apiClient from '../api'

export default {
  getReportCompleteness(tenantId, type, startTime, endTime) {
    return apiClient.get(
      `telemetry/report-completeness/?tenantId=${tenantId}&type=${type}&startTime=${startTime}&endTime=${endTime}`
    )
  }
}
