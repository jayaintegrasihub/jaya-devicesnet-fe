import apiClient from '../api'

export default {
  getReportCompleteness(tenantId, type, startTime, endTime) {
    if (type == 'All') {
      const queryString = `tenantId=${tenantId}&startTime=${startTime}&endTime=${endTime}`

      return apiClient.get(`telemetry/report-completeness/?${queryString}`)
    } else {
      const queryString = `tenantId=${tenantId}&type=${type}&startTime=${startTime}&endTime=${endTime}`

      return apiClient.get(`telemetry/report-completeness/?${queryString}`)
    }
  }
}
