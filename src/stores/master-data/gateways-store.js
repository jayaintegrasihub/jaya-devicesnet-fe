import { defineStore } from 'pinia'
import gatewaysAPI from '@/services/master-data/gateways-api'
import { ref } from 'vue'
import moment from 'moment'
import { createGatewayHealthEventSource } from '@/services/gatewayHealth'

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

export const useGatewaysStore = defineStore('Gateways', {
  state: () => ({
    gateways: ref([]),
    gatewayNodes: ref([]),
    gatewayHealth: ref({}),
    gateway: ref({}),
    getGatewaysStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    getGatewayStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    getGatewayHealthStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    getGatewayNodesStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    createGatewayStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    editGatewayStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    deleteGatewayStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    deleteGatewayLoading: ref(false),
    createGatewayLoading: ref(false),
    editGatewayLoading: ref(false),
    getGatewaysLoading: ref(false),
    getGatewayLoading: ref(false),
    getGatewayHealthLoading: ref(false),
    getGatewayNodesLoading: ref(false),
    gatewayHealthEventSource: null
  }),
  actions: {
    async getGateways() {
      this.getGatewaysLoading = true
      try {
        const res = await gatewaysAPI.getGateways()
        this.getGatewaysLoading = false
        this.gateways = res.data.gateways
        this.gateways.map((item, index) => {
          item.no = index + 1
          item.formattedCreatedAt = moment(item.createdAt).format("YYYY-MM-DD hh:mm")
          item.formattedUpdatedAt = moment(item.updatedAt).format("YYYY-MM-DD hh:mm")
        })
        console.log('gateways data', this.gateways)
        console.log(res)
        this.getGatewaysStatus.code = res.status
        this.getGatewaysStatus.isError = false
        this.getGatewaysStatus.message = "Data Fetched"
      } catch (err) {
        console.error(err)
        this.getGatewaysLoading = false
        this.getGatewaysStatus.code = err.response.data.status
        this.getGatewaysStatus.message = JSON.stringify(err.response.data.data)
        this.getGatewaysStatus.isError = true
        return err
      }
    },
    async getGateway(id) {
      this.getGatewayLoading = true
      try {
        const res = await gatewaysAPI.getGateway(id)
        this.getGatewayLoading = false
        this.gateway = res.data.gateway
        console.log(' data', this.gateway)
        console.log(res)
        this.getGatewayStatus.code = res.status
        this.getGatewayStatus.isError = false
        this.getGatewayStatus.message = "Data Fetched"
      } catch (err) {
        console.error(err)
        this.getGatewayLoading = false
        this.getGatewayStatus.code = err.response.data.status
        this.getGatewayStatus.message = JSON.stringify(err.response.data.data)
        this.getGatewayStatus.isError = true
        return err
      }
    },
    async listenGatewayHealth(id) {
      this.getGatewayHealthLoading = true
      this.gatewayHealthEventSource = createGatewayHealthEventSource(id)
      this.gatewayHealthEventSource.onmessage = (event) => {
        this.gatewayHealth = JSON.parse(event.data).data.gatewayHealth
        this.gatewayHealth._time = new Date(this.gatewayHealth._time).toLocaleString()
        this.gatewayHealth.humidity = this.gatewayHealth.humidity.toFixed(1)
        this.gatewayHealth.temperature = this.gatewayHealth.temperature.toFixed(1)
        this.gatewayHealth.uptime = formatUptime(this.gatewayHealth.uptime)
      }
    },
    stopListenGatewayHealth() {
      if (this.gatewayHealthEventSource) {
        this.gatewayHealthEventSource.close()
        this.gatewayHealthEventSource = null
      }
    },
    async getGatewayNodes(id) {
      this.getGatewayNodesLoading = true
      try {
        const res = await gatewaysAPI.getGatewayNodes(id)
        this.getGatewayNodesLoading = false
        console.log(res)
        this.gatewayNodes = res.data.nodes
        this.gatewayNodes.map((data,index) => {
          data.number = index+1
        })
        // console.log(' data', this.gateway)
        this.getGatewayNodesStatus.code = res.status
        this.getGatewayNodesStatus.isError = false
        this.getGatewayNodesStatus.message = "Data Fetched"
      } catch (err) {
        console.error(err)
        this.getGatewayNodesLoading = false
        this.getGatewayNodesStatus.code = err.response.data.status
        this.getGatewayNodesStatus.message = JSON.stringify(err.response.data.data)
        this.getGatewayNodesStatus.isError = true
        return err
      }
    },
    async createGateway(data) {
      this.createGatewayLoading = true
      try {
        const res = await gatewaysAPI.createGateway(data)
        console.log(res)
        this.createGatewayLoading = false
        this.createGatewayStatus.isError = false
        this.createGatewayStatus.message = 'Data Posted'
        this.createGatewayStatus.code = res.data.status
      } catch (err) {
        console.error(err)
        this.createGatewayLoading = false
        this.createGatewayStatus.isError = true
        this.createGatewayStatus.code = err.response.data.status
        this.createGatewayStatus.message = err.response.data.data
        return err
      }
    },
    async deleteGateway(id) {
      this.deleteGatewayLoading = true
      try {
        const res = await gatewaysAPI.deleteGateway(id)
        console.log(res)
        this.deleteGatewayLoading = false
        this.createGatewayStatus.isError = false
        this.deleteGatewayStatus.message = 'Data Deleted'
        this.deleteGatewayStatus.code = res.status
      } catch (err) {
        console.error(err)
        this.deleteGatewayLoading = false
        this.createGatewayStatus.isError = true
        this.deleteGatewayStatus.message = err.response.data.error
        this.deleteGatewayStatus.code = err.response.data.status
        return err
      }
    },
    async editGateway(id, data) {
      this.editGatewayLoading = true
      try {
        const res = await gatewaysAPI.editGateway(id, data)
        console.log(res)
        this.editGatewayLoading = false
        this.createGatewayStatus.isError = false
        this.editGatewayStatus.message = 'Data Updated'
        this.editGatewayStatus.code = res.data.status
      } catch (err) {
        console.error(err)
        this.editGatewayLoading = false
        this.createGatewayStatus.isError = true
        this.editGatewayStatus.message = JSON.stringify(err.response.data.data)
        this.editGatewayStatus.code = err.response.data.status
        return err
      }
    },
  }
})