import { defineStore } from 'pinia'
import telemetryAPI from '@/services/telemetry/telemetry-api'
import { ref } from 'vue'
import moment from 'moment'

function rssiToDbm(rssi) {
  const minDbm = -100;
  const maxDbm = 0;
  const minRssi = 0;
  const maxRssi = 255;

  // Linear mapping from RSSI to dBm
  return minDbm + (rssi - minRssi) * (maxDbm - minDbm) / (maxRssi - minRssi);
}
function formatUptime(uptimeInSeconds) {
  const days = Math.floor(uptimeInSeconds / (3600 * 24));
  const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60);

  let formattedString = '';
  if (days > 0) {
    formattedString += days + ' day' + (days > 1 ? 's ' : ' ');
  }
  if (hours > 0) {
    formattedString += hours + ' hour' + (hours > 1 ? 's ' : ' ');
  }
  if (minutes > 0 || formattedString === '') {
    formattedString += minutes + ' min' + (minutes > 1 ? 's ' : ' ');
  }

  return formattedString.trim();
}

export const useTelemetryStore = defineStore('Telemetry', {
  state: () => ({
    isNoDevices: ref(false),
    lastUpdated: ref(),
    isThereOfflineDevice: ref(false),
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
    getTelemetryStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    getTelemetryDataLoading: ref(false)
  }),
  actions: {
    async getTelemetryData(tenant, type) {
      this.getTelemetryDataLoading = true
      try {
        const res = await telemetryAPI.getTelemetryData(tenant, type)
        let gateways = res.data.statusDevices.gateways
        let onlineGatewaysList = gateways.filter((data) => data.status === 'ONLINE')
        let offlineGatewaysList = gateways.filter((data) => data.status === 'OFFLINE')
        let nodes = res.data.statusDevices.nodes
        let onlineNodesList = nodes.filter((data) => data.status === 'ONLINE')
        let offlineNodesList = nodes.filter((data) => data.status === 'OFFLINE')
        this.totalGateways = gateways.length
        this.totalNodes = nodes.length
        this.totalDevices = this.totalGateways + this.totalNodes
        this.getTelemetryDataLoading = false
        this.onlineGateways = onlineGatewaysList.length
        this.offlineGateways = offlineGatewaysList.length
        this.onlineNodes = onlineNodesList.length
        this.offlineNodes = offlineNodesList.length
        this.totalOnline = this.onlineGateways + this.onlineNodes
        this.totalOffline = this.offlineGateways + this.offlineNodes
        this.isThereOfflineDevice = offlineNodesList.length > 0
        this.offlineDevices = offlineGatewaysList.concat(offlineNodesList)
        this.offlineDevices.map((data) => {
          data._time = new Date(data._time).toLocaleString()
        })
        this.lastUpdated = new Date(res.data.statusDevices.timeNow).toLocaleString()

        this.gatewaysData = gateways
        this.gatewaysData.map((data) => {
          data._time = new Date(data._time).toLocaleString()
          data.humidity = data.humidity.toFixed(1)
          data.temperature = data.temperature.toFixed(1)
          data.uptime = formatUptime(data.uptime)
          data.rssi = Math.floor(rssiToDbm(data.rssi))
        })
        this.nodesData = nodes
        this.nodesData.map((data) => {
          data._time = new Date(data._time).toLocaleString()
          data.humidity = data.humidity.toFixed(1)
          data.temperature = data.temperature.toFixed(1)
          data.uptime = formatUptime(data.uptime)
          data.rssi = Math.floor(rssiToDbm(data.rssi))
        })

        if (this.totalGateways === 0 && this.totalDevices === 0) {
          this.isNoDevices = true
        } else {
          this.isNoDevices = false
        }

      } catch (err) {
        console.error(err)
        this.getTelemetryDataLoading = false
        this.getTelemetryStatus.code = err.response.data.status
        this.getTelemetryStatus.message = JSON.stringify(err.response.data.data)
        this.getTelemetryStatus.isError = true
        return err
      }
    }
  }
})