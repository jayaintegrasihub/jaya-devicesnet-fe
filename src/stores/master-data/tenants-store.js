import { defineStore } from 'pinia'
import tenantsAPI from '@/services/master-data/tenants-api'
import { ref } from 'vue'
import moment from 'moment'

export const useTenantsStore = defineStore('tenants', {
  state: () => ({
    tenants: ref([]),
    status: ref({
      isError: null,
      message: null,
      code: null
    }),
    deleteTenantLoading: ref(false),
    createTenantLoading: ref(false),
    editTenantLoading: ref(false),
    isLoading: ref(false)
  }),
  actions: {
    async getTenants() {
      this.isLoading = true
      try {
        const res = await tenantsAPI.getTenants()
        this.isLoading = false
        this.tenants = res.data.tenants

        this.tenants.map((item, index) => {
          item.no = index + 1
          item.formattedCreatedAt = moment(item.createdAt).format('YYYY-MM-DD hh:mm')
          item.formattedUpdatedAt = moment(item.updatedAt).format('YYYY-MM-DD hh:mm')
        })
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.isLoading = false
        this.status.message = err.response.data.message
        this.status.code = err.response.data.status
        return err
      }
    },
    async createTenant(data) {
      this.createTenantLoading = true
      try {
        const res = await tenantsAPI.createTenant(data)
        console.log(res)
        this.createTenantLoading = false
        this.status.isError = false
        this.status.message = 'Data Posted'
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.createTenantLoading = false
        this.status.isError = true
        this.status.message = err.response.data.message
        this.status.code = err.response.data.status
        return err
      }
    },
    async deleteTenant(id) {
      this.deleteTenantLoading = true
      try {
        const res = await tenantsAPI.deleteTenant(id)
        console.log(res)
        this.deleteTenantLoading = false
        this.status.message = 'Data Deleted'
        this.status.code = res.status
      } catch (err) {
        console.error(err)
        this.deleteTenantLoading = false
        this.status.message = err.response.data.message
        this.status.code = err.response.data.status
        return err
      }
    },
    async editTenant(id, data) {
      this.editTenantLoading = true
      try {
        const res = await tenantsAPI.editTenant(id, data)
        console.log(res)
        this.editTenantLoading = false
        this.status.message = 'Data Updated'
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.editTenantLoading = false
        this.status.message = err.response.data.message
        this.status.code = err.response.data.status
        return err
      }
    }
  }
})
