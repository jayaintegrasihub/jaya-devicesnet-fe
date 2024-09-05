import { defineStore } from 'pinia'
import nodesAPI from '@/services/master-data/nodes-api'
import { ref } from 'vue'
import moment from 'moment'

export const useNodesStore = defineStore('Nodes', {
  state: () => ({
    nodes: ref([]),
    status: ref({
      isError: null,
      message: null,
      code: null,
    }),
    deleteNodeLoading: ref(false),
    createNodeLoading: ref(false),
    editNodeLoading: ref(false),
    getNodesLoading: ref(false)
  }),
  actions: {
    async getNodes() {
      this.getNodesLoading = true
      try {
        const res = await nodesAPI.getNodes()
        console.log(res.data)
        this.getNodesLoading = false
        this.nodes = res.data.nodes
        this.nodes.map((item, index) => {
          item.no = index + 1
          item.formattedCreatedAt = moment(item.createdAt).format("YYYY-MM-DD hh:mm")
          item.formattedUpdatedAt = moment(item.updatedAt).format("YYYY-MM-DD hh:mm")
        })
        console.log('nodes data', this.nodes)
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.getNodesLoading = false
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
    async createNode(data) {
      this.createNodeLoading = true
      try {
        const res = await nodesAPI.createNode(data)
        console.log(res)
        this.createNodeLoading = false
        this.status.isError = false
        this.status.message = 'Data Posted'
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.createNodeLoading = false
        this.status.isError = true
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
    async deleteNode(id) {
      this.deleteNodeLoading = true
      try {
        const res = await nodesAPI.deleteNode(id)
        console.log(res)
        this.deleteNodeLoading = false
        this.status.isError = false
        this.status.message = 'Data Deleted'
        this.status.code = res.status
      } catch (err) {
        console.error(err)
        this.deleteNodeLoading = false
        this.status.isError = true
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
    async editNode(id, data) {
      this.editNodeLoading = true
      try {
        const res = await nodesAPI.editNode(id, data)
        console.log(res)
        this.editNodeLoading = false
        this.status.isError = false
        this.status.message = 'Data Updated'
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.editNodeLoading = false
        this.status.isError = true
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
  }
})