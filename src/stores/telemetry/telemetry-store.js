import { defineStore } from 'pinia'
import telemetryAPI from '@/services/telemetry/telemetry-api'
import { ref } from 'vue'
import moment from 'moment'
import { createStatusDeviceEventSource, createDeviceDetailsEventSource } from '@/services/sse'

const getDateNdaysAgo = (n) => {
  const date = new Date()
  date.setDate(date.getDate() - n)
  return date.toLocaleDateString('en-CA')
}

function rssiToDbm(rssi) {
  return -256 + rssi
}
function formatUptime(uptimeInSeconds) {
  const days = Math.floor(uptimeInSeconds / (3600 * 24))
  const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60)

  let formattedString = ''
  if (days > 0) {
    formattedString += days + ' day' + (days > 1 ? 's ' : ' ')
  }
  if (hours > 0) {
    formattedString += hours + ' hour' + (hours > 1 ? 's ' : ' ')
  }
  if (minutes > 0 || formattedString === '') {
    formattedString += minutes + ' min' + (minutes > 1 ? 's ' : ' ')
  }

  return formattedString.trim()
}

function convertToArray(data) {
  let result = []

  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      result.push({
        timestamp: data[key]._time,
        tag: key,
        value: data[key]._value
      })
    }
  }
  return result
}

export const useTelemetryStore = defineStore('Telemetry', {
  state: () => ({
    yesterdayDataCompleteness: ref(),
    dataTags: ref([]),
    isNoDevices: ref(false),
    isNoGateways: ref(false),
    isNoNodes: ref(false),
    lastUpdated: ref(),
    isThereOfflineDevice: ref(false),
    isThereOfflineGateway: ref(false),
    isThereOfflineNode: ref(false),
    offlineDevices: ref(),
    totalDevices: ref(),
    totalGateways: ref(),
    totalNodes: ref(),
    totalOnline: ref(),
    onlineGateways: ref(),
    onlineNodes: ref(),
    totalOffline: ref(),
    offlineGateways: ref(),
    offlineNodes: ref(),
    gatewaysData: ref([]),
    nodesData: ref([]),
    telemetryData: ref([]),
    telemetryResetReasonData: ref([]),
    telemetryDataCompleteness: ref(),
    offlineNodesList: ref([]),
    offlineGatewaysList: ref([]),
    getTelemetryDetailStatus: ref({
      isError: null,
      message: null,
      code: null
    }),
    getTelemetryHistoryStatus: ref({
      isError: null,
      message: null,
      code: null
    }),
    getTelemetryCompletenessStatus: ref({
      isError: null,
      message: null,
      code: null
    }),
    getTelemetryResetReasonStatus: ref({
      isError: null,
      message: null,
      code: null
    }),
    getTelemetryDetailLoading: ref(false),
    getTelemetryHistoryLoading: ref(false),
    getTelemetryCompletenessLoading: ref(false),
    getTelemetryResetReasonLoading: ref(false),
    eventSource: null,
    telemetryDetailEventSource: null,
    eventData: ref(),
    detailEventData: ref(),
    statusDeviceDetail: ref({}),
    deviceDataLogs: ref('')
  }),
  actions: {
    async getTelemetryDetail(serialNumber) {
      this.getTelemetryDetailLoading = true
      this.deviceDataLogs = ''
      try {
        const res = await telemetryAPI.getTelemetryDetail(serialNumber)
        this.statusDeviceDetail = res.data.statusDevice
        this.statusDeviceDetail._time = new Date(this.statusDeviceDetail._time).toLocaleString()
        this.statusDeviceDetail.humidity = this.statusDeviceDetail.humidity.toFixed(1)
        this.statusDeviceDetail.temperature = this.statusDeviceDetail.temperature.toFixed(1)
        this.statusDeviceDetail.uptime = formatUptime(this.statusDeviceDetail.uptime)
        this.statusDeviceDetail.rssi = Math.floor(rssiToDbm(this.statusDeviceDetail.rssi))

        this.deviceDataLogs = convertToArray(res.data.telemetry)
        this.deviceDataLogs.map((data) => {
          data.timestamp = new Date(data.timestamp).toLocaleString()
        })
        this.getTelemetryDetailLoading = false
        this.getTelemetryDetailStatus.code = res.status
        this.getTelemetryDetailStatus.message = 'Data Fetched'
        this.getTelemetryDetailStatus.isError = false
      } catch (err) {
        console.error(err)
        this.getTelemetryDetailLoading = false
        this.getTelemetryDetailStatus.code = err.response.data.status
        this.getTelemetryDetailStatus.message = JSON.stringify(err.response.data.data)
        this.getTelemetryDetailStatus.isError = true
        return err
      }
    },

    async getTelemetryHistory(sn, params) {
      this.getTelemetryHistoryLoading = true
      try {
        const res = await telemetryAPI.getTelemetryHistory(sn, params)
        this.telemetryData = Object.values(res.data.telemetries)[0]
        this.telemetryData.map((data) => {
          data._time = moment(data._time).format('MM/DD/YYYY , HH:mm:ss')
        })

        this.getTelemetryHistoryLoading = false
        this.getTelemetryHistoryStatus.code = res.status
        this.getTelemetryHistoryStatus.message = 'Data Fetched'
        this.getTelemetryHistoryStatus.isError = false
      } catch (err) {
        console.error(err)
        this.getTelemetryHistoryLoading = false
        this.getTelemetryHistoryStatus.code = err.response.data.status
        this.getTelemetryHistoryStatus.message = JSON.stringify(err.response.data.data)
        this.getTelemetryHistoryStatus.isError = true
        return err
      }
    },
    async getTelemetryResetReason(sn, params) {
      this.getTelemetryResetReasonLoading = true
      try {
        const res = await telemetryAPI.getTelemetryResetReason(sn, params)
        this.telemetryResetReasonData = res.data.healthHistory
        this.telemetryResetReasonData.map((data) => {
          data._time = moment(data._time).format('MM/DD/YYYY , HH:mm:ss')
        })

        console.log(this.telemetryResetReasonData.values)
        this.getTelemetryResetReasonLoading = false
        this.getTelemetryResetReasonStatus.code = res.status
        this.getTelemetryResetReasonStatus.message = 'Data Fetched'
        this.getTelemetryResetReasonStatus.isError = false
      } catch (err) {
        console.error(err)
        this.getTelemetryHistoryLoading = false
        this.getTelemetryResetReasonStatus.code = err.response.data.status
        this.getTelemetryResetReasonStatus.message = JSON.stringify(err.response.data.data)
        this.getTelemetryResetReasonStatus.isError = true
        // return err
      }
    },
    async getTelemetryCompleteness(sn, params) {
      this.getTelemetryCompletenessLoading = true
      try {
        const res = await telemetryAPI.getTelemetryCompleteness(sn, params)
        console.log(res.data.completeness)
        this.telemetryDataCompleteness = res.data.completeness

        this.getTelemetryCompletenessLoading = false
        this.getTelemetryCompletenessStatus.code = res.status
        this.getTelemetryCompletenessStatus.message = 'Data Fetched'
        this.getTelemetryCompletenessStatus.isError = false
      } catch (err) {
        console.error(err)
        this.getTelemetryCompletenessLoading = false
        this.getTelemetryCompletenessStatus.code = err.response.data.status
        this.getTelemetryCompletenessStatus.message = JSON.stringify(err.response.data.data)
        this.getTelemetryCompletenessStatus.isError = true
        return err
      }
    },
    async getYesterdayDataCompleteness(sn) {
      this.getYesterdayDataCompletenessLoading = true
      const queryParams = {}
      this.yesterdayDataCompleteness = null
      queryParams.startTime = getDateNdaysAgo(2)
      queryParams.endTime = new Date().toLocaleDateString('en-CA')
      queryParams.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      try {
        const res = await telemetryAPI.getTelemetryCompleteness(sn, queryParams)
        this.yesterdayDataCompleteness = res.data.completeness.dataCount
        console.log(this.yesterdayDataCompleteness)
        this.getYesterdayDataCompletenessLoading = false
        // this.getTelemetryCompletenessStatus.code = res.status
        // this.getTelemetryCompletenessStatus.message = 'Data Fetched'
        // this.getTelemetryCompletenessStatus.isError = false
      } catch (err) {
        console.error(err)
        this.getYesterdayDataCompletenessLoading = false
        // this.getTelemetryCompletenessStatus.code = err.response.data.status
        // this.getTelemetryCompletenessStatus.message = JSON.stringify(err.response.data.data)
        // this.getTelemetryCompletenessStatus.isError = true
        return err
      }
    },
    async listenTelemetryDetail(serialNumber) {
      this.getTelemetryDetailLoading = true
      this.telemetryDetailEventSource = createDeviceDetailsEventSource(serialNumber)
      this.telemetryDetailEventSource.onmessage = (event) => {
        this.detailEventData = JSON.parse(event.data).data.telemetry
        this.statusDeviceDetail = this.detailEventData.statusDevice
        this.statusDeviceDetail._time = new Date(this.statusDeviceDetail._time).toLocaleString()
        this.statusDeviceDetail.humidity = this.statusDeviceDetail.humidity.toFixed(1)
        this.statusDeviceDetail.temperature = this.statusDeviceDetail.temperature.toFixed(1)
        this.statusDeviceDetail.uptime = formatUptime(this.statusDeviceDetail.uptime)
        this.statusDeviceDetail.rssi = Math.floor(rssiToDbm(this.statusDeviceDetail.rssi))
        this.deviceDataLogs = convertToArray(this.detailEventData.telemetry)
        this.deviceDataLogs.map((data) => {
          data.timestamp = moment(data.timestamp).format('MM/DD/YYYY , HH:mm:ss')
        })
        this.dataTags = Object.keys(this.detailEventData.telemetry)
      }
    },
    stopListenTelemetryDetail() {
      if (this.telemetryDetailEventSource) {
        this.telemetryDetailEventSource.close()
        this.telemetryDetailEventSource = null
      }
    },
    startListening(tenant, type, callback) {
      this.eventSource = createStatusDeviceEventSource(tenant, type)
      this.eventSource.onmessage = (event) => {
        this.eventData = JSON.parse(event.data).data
        let gateways = this.eventData.statusDevices.gateways
        let onlineGatewaysList = gateways.filter((data) => data.status === 'ONLINE')
        this.offlineGatewaysList = gateways.filter((data) => data.status === 'OFFLINE')
        let nodes = this.eventData.statusDevices.nodes
        let onlineNodesList = nodes.filter((data) => data.status === 'ONLINE')
        this.offlineNodesList = nodes
          .filter((data) => data.status === 'OFFLINE')
          .sort((a, b) => new Date(b._time) - new Date(a._time))
        this.totalGateways = gateways.length
        this.totalNodes = nodes.length
        this.totalDevices = this.totalGateways + this.totalNodes
        this.onlineGateways = onlineGatewaysList.length
        this.offlineGateways = this.offlineGatewaysList.length
        this.onlineNodes = onlineNodesList.length
        this.offlineNodes = this.offlineNodesList.length
        this.totalOnline = this.onlineGateways + this.onlineNodes
        this.totalOffline = this.offlineGateways + this.offlineNodes
        this.isThereOfflineGateway = this.offlineGatewaysList.length > 0
        this.isThereOfflineNode = this.offlineNodesList.length > 0
        // this.offlineDevices = this.offlineGatewaysList.concat(this.offlineNodesList)
        // this.offlineDevices.map((data) => {
        //   data._time = new Date(data._time).toLocaleString()
        // })
        this.lastUpdated = new Date(this.eventData.statusDevices.timeNow).toLocaleString()
        this.gatewaysData = gateways
        this.gatewaysData.map((data) => {
          data.lastHeard = formatUptime(Math.floor((new Date() - new Date(data._time)) / 1000))
          data._time = moment(data._time).format('MM/DD/YYYY , HH:mm')
          data.humidity = data.humidity.toFixed(1)
          data.temperature = data.temperature.toFixed(1)
          data.uptime = formatUptime(data.uptime)
          data.rssi = Math.floor(rssiToDbm(data.rssi))
        })

        this.nodesData = nodes
        this.nodesData.map((data) => {
          console.log('b', data._time)

          let parsedTime

          if (moment(data._time, 'MM/DD/YYYY, h:mm:ss A', true).isValid()) {
            parsedTime = moment(data._time, 'MM/DD/YYYY, h:mm:ss A').toISOString()
          } else if (moment(data._time, moment.ISO_8601, true).isValid()) {
            parsedTime = data._time // It's already in ISO format
          } else {
            console.error(`Invalid date format: ${data._time}`)
            return // Skip this entry
          }
          data._time = moment(parsedTime).format('MM/DD/YYYY , HH:mm')
          data.lastHeard = formatUptime(Math.floor((new Date() - new Date(data._time)) / 1000))
          data.humidity = data.humidity.toFixed(1)
          data.temperature = data.temperature.toFixed(1)
          data.uptime = formatUptime(data.uptime)
          data.rssi = Math.floor(rssiToDbm(data.rssi))

          console.log('a', data._time)
        })

        if (this.totalGateways === 0) {
          this.isNoGateways = true
        } else {
          this.isNoGateways = false
        }
        if (this.totalNodes === 0) {
          this.isNoNodes = true
        } else {
          this.isNoNodes = false
        }
        if (this.eventData) {
          callback()
        }
      }
      this.eventSource.onerror = (err) => {
        console.error('EventSource failed:', err)
        this.stopListening() // Stop listening on error
      }
    },
    stopListening() {
      if (this.eventSource) {
        this.eventSource.close()
        this.eventSource = null
      }
    }
  }
})
