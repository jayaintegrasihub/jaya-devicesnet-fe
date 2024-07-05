import { defineStore } from 'pinia'
import apikeysAPI from '@/services/master-data/apikeys-api'
import { ref } from 'vue'
import moment from 'moment'

export const useApiKeysStore = defineStore('ApiKeys', {
  state: () => ({
    apiKeys: ref([]),
    apiKey: ref(''),
    createdApiKey: ref({}),
    getapiKeysStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    getapiKeyStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    createApiKeyStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    editApiKeyStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    deleteApiKeyStatus: ref({
      isError: null,
      message: null,
      code: null,
    }),
    deleteApiKeyLoading: ref(false),
    createApiKeyLoading: ref(false),
    editApiKeyLoading: ref(false),
    getApiKeysLoading: ref(false),
    getApiKeyLoading: ref(false)
  }),
  actions: {
    async getApiKeys() {
      this.getApiKeysLoading = true
      try {
        const res = await apikeysAPI.getApiKeys()
        this.getApiKeysLoading = false
        this.apiKeys = res.data.apiKeys
        console.log('apiKeys data', this.apiKeys)
        console.log(res)
        this.getapiKeysStatus.code = res.status
        this.getapiKeysStatus.isError = false
        this.getapiKeysStatus.message = "Data Fetched"
      } catch (err) {
        console.error(err)
        this.getApiKeysLoading = false
        this.getapiKeysStatus.code = err.response.data.status
        this.getapiKeysStatus.message = JSON.stringify(err.response.data.data)
        this.getapiKeysStatus.isError = true
        return err
      }
    },
    async getApiKey() {
      this.getApiKeyLoading = true
      try {
        const res = await apikeysAPI.getApiKey()
        this.getApiKeyLoading = false
        this.apiKey = res.data.apiKey
        console.log('apiKeys data', this.apiKey)
        console.log(res)
        this.getapiKeyStatus.code = res.status
        this.getapiKeyStatus.isError = false
        this.getapiKeyStatus.message = "Data Fetched"
      } catch (err) {
        console.error(err)
        this.getApiKeyLoading = false
        this.getapiKeyStatus.code = err.response.data.status
        this.getapiKeyStatus.message = JSON.stringify(err.response.data.data)
        this.getapiKeyStatus.isError = true
        return err
      }
    },
    async createApiKey(data) {
      this.createApiKeyLoading = true
      try {
        const res = await apikeysAPI.createApiKey(data)
        this.createdApiKey = res.data.apiKey
        this.createApiKeyLoading = false
        this.createApiKeyStatus.isError = false
        this.createApiKeyStatus.message = 'Data Posted'
        this.createApiKeyStatus.code = res.data.status
      } catch (err) {
        console.error(err)
        this.createApiKeyLoading = false
        this.createApiKeyStatus.isError = true
        this.createApiKeyStatus.code = err.response.data.status
        this.createApiKeyStatus.message = err.response.data.data
        return err
      }
    },
    async deleteApiKey(id) {
      this.deleteApiKeyLoading = true
      try {
        const res = await apikeysAPI.deleteApiKey(id)
        console.log(res)
        this.deleteApiKeyLoading = false
        this.deleteApiKeyStatus.message = 'Data Deleted'
        this.deleteApiKeyStatus.code = res.status
      } catch (err) {
        console.error(err)
        this.deleteApiKeyLoading = false
        this.deleteApiKeyStatus.message = err.response.data.error
        this.deleteApiKeyStatus.code = err.response.data.status
        return err
      }
    },
    async editApiKey(id, data) {
      this.editApiKeyLoading = true
      try {
        const res = await apikeysAPI.editApiKey(id, data)
        console.log(res)
        this.editApiKeyLoading = false
        this.editApiKeyStatus.message = 'Data Updated'
        this.editApiKeyStatus.code = res.data.status
      } catch (err) {
        console.error(err)
        this.editApiKeyLoading = false
        this.editApiKeyStatus.message = JSON.stringify(err.response.data.data)
        this.editApiKeyStatus.code = err.response.data.status
        return err
      }
    },
  }
})