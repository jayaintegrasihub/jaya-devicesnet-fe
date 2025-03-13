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
  },
  exportReportCompletenessSummary(tenantId, type, startTime, endTime) {
    let queryString = ''
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const token = localStorage.getItem('auth.accessToken')

    const requestOptions = {
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'GET'
    }

    if (type == 'All') {
      queryString = `tenantId=${tenantId}&startTime=${startTime}&endTime=${endTime}&timezone=${userTimeZone}`
    } else {
      queryString = `tenantId=${tenantId}&type=${type}&startTime=${startTime}&endTime=${endTime}&timezone=${userTimeZone}`
    }

    const res = fetch(
      `${import.meta.env.VITE_APP_API_URL}telemetry/export/report-completeness/?${queryString}`,
      requestOptions
    ).then((res) => {
      return res.blob()
    })

    return res
  },
  exportReportCompletenessSpecific(machine, startTime, endTime) {
    let queryString = `startTime=${startTime}&endTime=${endTime}`
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const token = localStorage.getItem('auth.accessToken')

    const requestOptions = {
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'GET'
    }

    const res = fetch(
      `${
        import.meta.env.VITE_APP_API_URL
      }telemetry/export/report-completeness/${machine}?${queryString}&timezone=${userTimeZone}`,
      requestOptions
    ).then((res) => {
      return res.blob()
    })

    return res
  }
}
