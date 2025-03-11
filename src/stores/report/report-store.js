import { defineStore } from 'pinia'
import { ref } from 'vue'
import moment from 'moment'
import reportApi from '@/services/report/report-api'

export const useReportStore = defineStore('reports', {
  state: () => ({
    reportCompletenessSummary: ref([]),
    reportCompletenessSpecific: ref([]),
    status: ref({
      isError: null,
      message: null,
      code: null
    }),
    isLoading: ref(false)
  }),
  actions: {
    async getReportSummary(tenantId, type, startTime, endTime) {
      this.isLoading = true
      try {
        const res = await reportApi.getReportCompletenessSummary(tenantId, type, startTime, endTime)
        this.isLoading = false
        this.reportCompletenessSummary = res.data.report.nodes

        this.reportCompletenessSummary.map((item, index) => {
          item.no = index + 1
          item.formattedCreatedAt = moment(item.createdAt).format('YYYY-MM-DD hh:mm')
          item.machine = item.alias
          item.actualDataCount = item.count
          item.expectedDataCount = item.duration / 10
          item.uptime = Math.round(item.duration / 60)
          item.percentage = Math.round(item.count / (item.duration / 10)) + '%'
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
    async getReportSpecific(tenantId, type, startTime, endTime) {
      this.isLoading = true
      try {
        const res = await reportApi.getReportCompletenessSpecific(
          tenantId,
          type,
          startTime,
          endTime
        )
        this.isLoading = false
        this.reportCompletenessSpecific = res.data.completenessDevice.report

        this.reportCompletenessSpecific.map((item, index) => {
          item.no = index + 1
          item.formattedCreatedAt = moment(item['_start']).format('YYYY-MM-DD hh:mm')
          item.machine = res.data.completenessDevice.alias
          item.actualDataCount = item.count
          item.expectedDataCount = item.duration / 10
          item.uptime = Math.round(item.duration / 60)
          item.percentage = Math.round(item.count / (item.duration / 10)) + '%'
        })
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.isLoading = false
        this.status.message = err.response.data.message
        this.status.code = err.response.data.status
        return err
      }
    }
  }
})
