import apiClient from '../api'

export default {
  getReportCompletenessSummary(tenantId, type, startTime, endTime) {
    let queryString = ''
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (type == 'All') {
      queryString = `tenantId=${tenantId}&startTime=${startTime}&endTime=${endTime}&timezone=${userTimeZone}`
    } else {
      queryString = `tenantId=${tenantId}&type=${type}&startTime=${startTime}&endTime=${endTime}&timezone=${userTimeZone}`
    }

    return apiClient.get(`telemetry/report-completeness/?${queryString}`)
  },
  getReportCompletenessSpecific(machine, startTime, endTime) {
    let queryString = `startTime=${startTime}&endTime=${endTime}`
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    return apiClient.get(
      `telemetry/report-completeness/${machine}?${queryString}&timezone=${userTimeZone}`
    )
  }
}
