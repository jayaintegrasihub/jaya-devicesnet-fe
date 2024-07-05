import { defineStore } from 'pinia'
import typesAPI from '@/services/master-data/types-api'
import { ref } from 'vue'

export const useTypesStore = defineStore('types', {
  state: () => ({
    types: ref([]),
    type: ref([]),
    status: ref({
      isError: null,
      message: null,
      code: null,
    }),
    deleteTypeLoading: ref(false),
    createTypeLoading: ref(false),
    editTypeLoading: ref(false),
    isLoading: ref(false)
  }),
  actions: {
    async getTypes() {
      this.isLoading = true
      try {
        const res = await typesAPI.getTypes()
        this.isLoading = false
        this.types = res.data.types

        this.types.map((item, index) => {
          item.no = index + 1
        })
        console.log('types data', this.types)
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.isLoading = false
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
    async getType(id) {
      this.isLoading = true
      try {
        const res = await typesAPI.getType(id)
        console.log(res)
        this.isLoading = false
        this.type = res.data.type
        console.log('type data', this.type)
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.isLoading = false
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
    async createType(data) {
      this.createTypeLoading = true
      try {
        const res = await typesAPI.createType(data)
        console.log(res)
        this.createTypeLoading = false
        this.status.isError = false
        this.status.message = 'Data Posted'
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.createTypeLoading = false
        this.status.isError = true
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
    async deleteType(id) {
      this.deleteTypeLoading = true
      try {
        const res = await typesAPI.deleteType(id)
        console.log(res)
        this.deleteTypeLoading = false
        this.status.message = 'Data Deleted'
        this.status.code = res.status
      } catch (err) {
        console.error(err)
        this.deleteTypeLoading = false
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
    async editType(id, data) {
      this.editTypeLoading = true
      try {
        const res = await typesAPI.editType(id, data)
        console.log(res)
        this.editTypeLoading = false
        this.status.message = 'Data Updated'
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.editTypeLoading = false
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
  }
})