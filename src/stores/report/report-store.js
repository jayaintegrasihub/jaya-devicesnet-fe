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
    statusExport: ref({
      isError: null,
      message: null,
      code: null
    }),
    isLoading: ref(false),
    isLoadingExport: ref(false)
  }),
  actions: {
    async getReportSummary(tenantId, type, startTime, endTime) {
      this.isLoading = true
      try {
        const res = await reportApi.getReportCompletenessSummary(tenantId, type, startTime, endTime)
        this.isLoading = false
        this.reportCompletenessSummary = res.data.report.nodes

        this.reportCompletenessSummary.map((item) => {
          item.machine = item.alias
          if (item.report.length !== 0) {
            item.report.map((item, index) => {
              item.no = index + 1
              item.formattedCreatedAt = moment(item['_start']).format('YYYY-MM-DD')
              item.actualDataCount = item.count
              item.uptime = item.duration
              item.expectedDataCount = Math.round(item.duration / 10)
              item.percentage = ((item.count / (item.duration / 10)) * 100).toFixed(1) + '%'
            })
          } else {
            this.reportCompletenessSummary = this.reportCompletenessSummary.filter(
              (filter) => filter.id !== item.id
            )
          }
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
    async getReportSpecific(machine, startTime, endTime) {
      this.isLoading = true
      try {
        const res = await reportApi.getReportCompletenessSpecific(machine, startTime, endTime)
        this.isLoading = false
        this.reportCompletenessSpecific = res.data.completenessDevice.report
        console.log(res.data.completenessDevice.report)
        this.reportCompletenessSpecific.map((item, index) => {
          item.no = index + 1
          item.formattedCreatedAt = moment(item['_start']).format('YYYY-MM-DD')
          item.machine = res.data.completenessDevice.alias
          item.actualDataCount = item.count
          item.uptime = item.duration
          item.expectedDataCount = Math.round(item.duration / 10)
          item.percentage = ((item.count / (item.duration / 10)) * 100).toFixed(1) + '%'
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
    async exportReportSummary(tenantId, type, startTime, endTime) {
      this.isLoadingExport = true
      try {
        const res = await reportApi.exportReportCompletenessSummary(
          tenantId,
          type,
          startTime,
          endTime
        )
        this.isLoadingExport = false

        const href = window.URL.createObjectURL(res)
        const link = document.createElement('a')
        link.href = href
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        this.statusExport.message = 'Export data report successfully'
        this.statusExport.code = 200
        this.statusExport.isError = false
      } catch (err) {
        console.error(err)
        this.isLoadingExport = false
        this.statusExport.isError = true
        this.statusExport.message = err.response.data.message
        this.statusExport.code = err.response.data.statusExport
        return err
      }
    },
    async exportReportSpecific(machine, startTime, endTime) {
      this.isLoadingExport = true
      try {
        const res = await reportApi.exportReportCompletenessSpecific(machine, startTime, endTime)
        this.isLoadingExport = false

        const href = window.URL.createObjectURL(res)
        const link = document.createElement('a')
        link.href = href
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        this.statusExport.message = 'Export data report successfully'
        this.statusExport.code = 200
        this.statusExport.isError = false
      } catch (err) {
        console.error(err)
        this.isLoadingExport = false
        this.statusExport.isError = true
        this.statusExport.message = err.response.data.message
        this.statusExport.code = err.response.data.statusExport
        return err
      }
    }
  }
})
