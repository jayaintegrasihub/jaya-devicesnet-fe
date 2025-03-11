import apiClient from '../api'

export default {
  getReportCompletenessSummary(tenantId, type, startTime, endTime) {
    let queryString = ''

    if (type == 'All') {
      queryString = `tenantId=${tenantId}&startTime=${startTime}&endTime=${endTime}`
    } else {
      queryString = `tenantId=${tenantId}&type=${type}&startTime=${startTime}&endTime=${endTime}`
    }

    return apiClient.get(`telemetry/report-completeness/?${queryString}`)
  },
  getReportCompletenessSpecific(machine, startTime, endTime) {
    let queryString = `startTime=${startTime}&endTime=${endTime}`

    return apiClient.get(
      `telemetry/report-completeness/${machine}?${queryString}&timezone=Asia/Jakarta`
    )
  }
}
