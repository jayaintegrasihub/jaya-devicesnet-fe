<script setup>
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import IconButton from '@/components/input/IconButton.vue'
import BaseIndicator from '@/components/indicator/BaseIndicator.vue'
import { storeToRefs } from 'pinia'
import router from '@/router'
import { useTelemetryStore } from '@/stores/telemetry/telemetry-store'
import { useLocalStorage } from '@vueuse/core'
import BaseButton from '@/components/input/BaseButton.vue'
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  PointElement,
  LineElement,
  LinearScale
} from 'chart.js'
Chart.register(
  BarElement,
  BarController,
  CategoryScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  PointElement,
  LineElement,
  LinearScale
)

const telemetryStore = useTelemetryStore()
const {
  yesterdayDataCompleteness,
  getTelemetryDetailLoading,
  telemetryDataCompleteness,
  getTelemetryCompletenessLoading,
  telemetryData,
  getTelemetryHistoryLoading,
  statusDeviceDetail,
  deviceDataLogs,
  dataTags
} = storeToRefs(useTelemetryStore())
const props = defineProps(['id'])

function goBack() {
  router.go(-1)
}
const telemeryLoading = ref(false)

const Utils = {
  dates({ startDate, endDate }) {
    const dates = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    while (start <= end) {
      dates.push(start.toISOString().split('T')[0]) // Format ke YYYY-MM-DD
      start.setDate(start.getDate() + 1) // Tambahkan 1 hari
    }

    return dates
  }
}

const labelDates = ref([])

onMounted(async () => {
  window.scrollTo(0, 0)
  telemeryLoading.value = true
  await telemetryStore.getYesterdayDataCompleteness(props.id)
  await telemetryStore.listenTelemetryDetail(props.id)
  telemeryLoading.value = false
  loadHistoricalData()
  renderBarChart()
})

onUnmounted(() => {
  telemetryStore.stopListenTelemetryDetail()
})

//table
const header = [
  { text: 'Timestamp', value: 'timestamp', sortable: true },
  { text: 'Tag', value: 'tag', sortable: true },
  { text: 'Value', value: 'value', sortable: true }
]
const historyHeader = [
  { text: 'Timestamp', value: '_time', sortable: true },
  { text: 'Value', value: '_value', sortable: true }
]

const selectedTag = useLocalStorage('selectedTag', '0')

const getDateNdaysAgo = (n) => {
  const date = new Date()
  date.setDate(date.getDate() - n)
  return date.toLocaleDateString('en-CA')
}
const startDate = ref(getDateNdaysAgo(7))
const startTime = ref(
  new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
)
const endDate = ref(new Date().toLocaleDateString('en-CA'))
const endTime = ref(
  new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
)

const dataCompStartDate = ref(getDateNdaysAgo(7))
const dataCompEndDate = ref(new Date().toLocaleDateString('en-CA'))

const getYesterday = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toLocaleDateString('en-CA')
}

let yesterdayDate = getYesterday()

async function loadHistoricalData() {
  const queryParams = {}

  if (selectedTag.value !== '0') {
    queryParams.fields = selectedTag.value
    queryParams.startTime = new Date(startDate.value + 'T' + startTime.value).toISOString()
    queryParams.endTime = new Date(endDate.value + 'T' + endTime.value).toISOString()
    await telemetryStore.getTelemetryHistory(props.id, queryParams)
  }
}

function generateColor(label) {
  // Gunakan hash berdasarkan label untuk menghasilkan warna yang konsisten
  const hash = [...label].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const r = (hash * 137) % 255
  const g = (hash * 193) % 255
  const b = (hash * 251) % 255
  return `rgba(${r}, ${g}, ${b}, 0.8)`
}

const completenessHistory = ref([])
const visibleHeaders = ref([])
const tableData = ref([])
const dynamicColumns = ref([])
const columnVisibility = ref([])

async function loadDataCompletenessHistory() {
  labelDates.value = []
  completenessHistory.value = []
  historyBarChart.value.data.datasets = []
  dynamicColumns.value = []

  const queryParams = {}
  queryParams.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  queryParams.startTime = dataCompStartDate.value
  queryParams.endTime = dataCompEndDate.value
  await telemetryStore.getTelemetryCompleteness(props.id, queryParams)

  dynamicColumns.value = Object.keys(telemetryDataCompleteness.value.dataCount)
  columnVisibility.value = dynamicColumns.value.reduce((acc, col) => {
    acc[col] = true
    return acc
  }, {})
  formatTableData(telemetryDataCompleteness.value.dataCount)
  const dataHistoryFilter = Object.entries(telemetryDataCompleteness.value.dataCount).map(
    ([key, values]) => ({
      type: 'bar',
      label: key,
      data: values.map((item) => item.count),
      backgroundColor: generateColor(key),
      borderRadius: 4,
      hidden: true
    })
  )

  completenessHistory.value = Object.entries(telemetryDataCompleteness.value.dataCount).map(
    ([key, values]) => ({
      label: key,
      data: values
    })
  )

  if (dataHistoryFilter.length === 0) {
    historyBarChart.value.data.datasets = [
      {
        type: 'bar',
        label: 'Data not found!',
        data: [],
        backgroundColor: '#aaaaaa80',
        borderRadius: 4
      }
    ]
  } else {
    historyBarChart.value.data.datasets = dataHistoryFilter
  }

  labelDates.value = Utils.dates({
    startDate: dataCompStartDate.value,
    endDate: dataCompEndDate.value
  })
  historyBarChart.value.data.labels = labelDates.value
  historyBarChart.value.update()
}

function toggleColumn() {
  formatTableData(telemetryDataCompleteness.value.dataCount)
}

function formatTableData(data) {
  const allDates = [
    ...new Set(
      Object.values(data)
        .flat()
        .map((entry) => entry.time)
    )
  ]

  const formattedData = allDates.map((date) => {
    const row = { date: date.split('T')[0] }
    dynamicColumns.value.forEach((col) => {
      if (columnVisibility.value[col]) {
        row[col] = data[col]?.find((d) => d.time === date)?.count || 0
      }
    })
    return row
  })

  const baseHeaders = [{ text: 'Date', value: 'date' }]
  const dynamicHeaders = dynamicColumns.value
    .filter((col) => columnVisibility.value[col])
    .map((col) => ({ text: col, value: col }))

  visibleHeaders.value = [...baseHeaders, ...dynamicHeaders]
  tableData.value = formattedData
}

const historyBarChartCanvas = ref(null)
let historyBarChart

function renderBarChart() {
  let historyChartData = {
    labels: [],
    datasets: []
  }

  const historyChartCtx = historyBarChartCanvas.value.getContext('2d')
  historyBarChart = shallowRef(
    new Chart(historyChartCtx, {
      type: 'bar',
      data: historyChartData,
      options: {
        responsive: true,
        scales: {
          y: {
            ticks: {
              callback: function (value) {
                if (Number.isInteger(value)) {
                  return value
                }
                return ''
              }
            },
            beginAtZero: true
          }
        }
      }
    })
  )
}
</script>

<script>
export default {
  data() {
    return {
      tabs: ['Table', 'Graph'], // Nama tab
      activeTab: 0 // Tab aktif
    }
  }
}
</script>

<template>
  <div class="flex relative">
    <SideNav :isDevicesManagementActive="true" />
    <div class="flex flex-col w-screen">
      <TopBar>
        <div class="flex gap-3">
          <p
            @click="goBack()"
            class="text-label-secondary cursor-pointer hover:text-label-primary transition-colors ease-in-out duration-150"
          >
            &lt Back
          </p>
          <p class="text-label-secondary select-none">|</p>
          <p class="text-label-primary select-none">Device Detail</p>
        </div>
      </TopBar>
      <div class="general-info">
        <img src="../assets/device-img.png" class="device-img" />
        <div class="flex flex-col w-full gap-4">
          <div class="flex justify-between items-start w-full">
            <div class="flex gap-5 items-center">
              <BaseIndicator :status="statusDeviceDetail.status" />
              <h1 class="text-label-primary">{{ statusDeviceDetail.alias }}</h1>
            </div>
            <!-- <IconButton type="submit" class="outlined" label="Edit" @click="">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3.5 3.5H3C2.73478 3.5 2.48043 3.60536 2.29289 3.79289C2.10536 3.98043 2 4.23478 2 4.5V9C2 9.26522 2.10536 9.51957 2.29289 9.70711C2.48043 9.89464 2.73478 10 3 10H7.5C7.76522 10 8.01957 9.89464 8.20711 9.70711C8.39464 9.51957 8.5 9.26522 8.5 9V8.5"
                  stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                <path
                  d="M8 2.50005L9.5 4.00005M10.1925 3.29255C10.3894 3.09563 10.5001 2.82854 10.5001 2.55005C10.5001 2.27156 10.3894 2.00448 10.1925 1.80755C9.99558 1.61063 9.72849 1.5 9.45 1.5C9.17151 1.5 8.90442 1.61063 8.7075 1.80755L4.5 6.00005V7.50005H6L10.1925 3.29255Z"
                  stroke="black" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </IconButton> -->
          </div>
          <div class="grid grid-cols-4 flex-1">
            <div class="flex flex-col col-span-1 justify-between">
              <div class="flex gap-[10px]">
                <p class="text-label-secondary">ID:</p>
                <p class="text-text-label-primary">{{ props.id }}</p>
              </div>
              <div class="flex gap-[10px]">
                <p class="text-label-secondary">Type:</p>
                <p class="text-text-label-primary">MMA-LE-2</p>
              </div>
            </div>
            <div class="flex col-span-1">
              <div class="flex flex-col col-span-1 justify-between">
                <div class="flex gap-[10px]">
                  <p class="text-label-secondary">Firmware Version:</p>
                  <p class="text-text-label-primary">{{ statusDeviceDetail.fwVersion }}</p>
                </div>
                <div class="flex gap-[10px]">
                  <p class="text-label-secondary">Hardware Version:</p>
                  <p class="text-text-label-primary">{{ statusDeviceDetail.hwVersion }}</p>
                </div>
              </div>
            </div>
            <div class="flex col-span-1">
              <div class="flex flex-col col-span-1 justify-between">
                <div class="flex gap-[10px]">
                  <p class="text-label-secondary">Radio Protocol Version:</p>
                  <p class="text-text-label-primary">{{ statusDeviceDetail.rdVersion }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex-1 mx-[20px] mt-[20px] flex h-[3000px] p-8 bg-bkg-primary rounded-[10px] shadow border border-bkg-secondary flex-col gap-5"
      >
        <div class="flex flex-col gap-6">
          <h1 class="text-accent-1 font-medium text-lg">Data Analytics</h1>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col">
              <p class="font-semibold">Telemetry Data Completeness Daily</p>
              <p class="text-xs text-label-secondary">{{ yesterdayDate }} to {{ endDate }}</p>
            </div>
            <div class="flex flex-wrap gap-4">
              <div
                v-for="(key, value) in yesterdayDataCompleteness"
                class="px-4 py-3 bg-bkg-secondary w-fit flex flex-col gap-1"
              >
                <p class="text-sm font-medium text-accent-1 mb-3">
                  {{ value }}
                </p>
                <p class="font-medium">
                  {{ key[0].count }} /
                  <span class="">
                    {{ 8640 }}
                  </span>
                </p>
                <hr />
                <p class="text-end text-accent-1 text-sm w-full font-medium">
                  {{ Math.round((key[0].count / 8640) * 100) }}%
                </p>
              </div>
            </div>
          </div>
          <hr />
          <div class="flex flex-col gap-4">
            <div class="flex justify-between">
              <p class="font-semibold">Telemetry Data Completeness History</p>
              <div class="flex items-center">
                <div class="grid grid-cols-2 gap-4">
                  <div
                    class="text-left flex items-center gap-2 border rounded-md border-[#D9D9D9] p-2 w-fit"
                  >
                    <h2 class="font-semibold text-xs">From</h2>
                    <div class="flex gap-6">
                      <input
                        class="cursor-pointer outline-none bg-transparent text-xs"
                        type="date"
                        name="startDate"
                        id="startDate"
                        v-model="dataCompStartDate"
                      />
                    </div>
                  </div>
                  <div
                    class="text-left flex items-center gap-2 border rounded-md border-[#D9D9D9] p-2 w-fit"
                  >
                    <h2 class="font-semibold text-xs">To</h2>
                    <div class="flex gap-6">
                      <input
                        class="cursor-pointer outline-none bg-transparent text-xs"
                        type="date"
                        name="endDate"
                        id="endDate"
                        v-model="dataCompEndDate"
                      />
                    </div>
                  </div>
                </div>
                <div class="w-fit">
                  <BaseButton
                    type="submit"
                    class="primary"
                    label="Filter"
                    :loading="getTelemetryHistoryLoading"
                    @click="loadDataCompletenessHistory()"
                  />
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-4">
              <div
                v-for="(key, value) in yesterdayDataCompleteness"
                class="px-4 py-3 bg-bkg-secondary w-fit flex flex-col gap-1"
              >
                <p class="text-sm font-medium text-accent-1 mb-3">
                  {{ value }}
                </p>
                <p class="font-medium">
                  {{ key[0].count }} /
                  <span class="">
                    {{ 8640 }}
                  </span>
                </p>
                <hr />
                <p class="text-end text-accent-1 text-sm w-full font-medium">
                  {{ Math.round((key[0].count / 8640) * 100) }}%
                </p>
              </div>
            </div>
          </div>
          <!-- <div class="flex justify-between">
            <div class="custom-select">
              <select class="custom-select-option" name="type" id="type" v-model="selectedTag">
                <option value="0" class="text-label-tertiary" disabled selected>Data Tag</option>
                <option v-for="data in dataTags" :value="data">{{ data }}</option>
              </select>
            </div>
            
          </div> -->

          <div class="bg-[#f7f8fa] w-fit p-1 rounded-lg">
            <button
              v-for="(tab, index) in tabs"
              :key="index"
              @click="activeTab = index"
              :class="{
                'border-white text-[#0989c0] bg-white': activeTab === index,
                'border-transparent text-gray-300': activeTab !== index
              }"
              class="px-4 py-2 font-semibold border-b-2 transition duration-300 ease-in-out text-md"
            >
              {{ tab }}
            </button>
          </div>

          <div :style="{ display: activeTab === 0 ? 'block' : 'none' }">
            <div>
              <ul
                class="items-center w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex"
              >
                <li
                  v-for="(col, index) in dynamicColumns"
                  :key="index"
                  class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r"
                >
                  <div class="flex items-center ps-3">
                    <input
                      v-model="columnVisibility[col]"
                      id="checkbox-{{ col }}"
                      type="checkbox"
                      @change="toggleColumn()"
                      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      :for="'checkbox-' + col"
                      class="w-full py-3 ms-2 text-sm font-medium text-gray-900"
                      >{{ col }}</label
                    >
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <EasyDataTable
                :rows-per-page="10"
                table-class-name="customize-table"
                :headers="visibleHeaders"
                :items="tableData"
                theme-color="#1363dF"
                :loading="getTelemetryHistoryLoading"
              >
              </EasyDataTable>
            </div>
          </div>

          <div :style="{ display: activeTab === 1 ? 'block' : 'none' }">
            <canvas ref="historyBarChartCanvas" class="w-full"></canvas>
          </div>

          <!-- <EasyDataTable :rows-per-page="10" table-class-name="customize-table" :headers="header" :items="telemetryData"
            theme-color="#1363df" :loading="getTelemetryHistoryLoading"></EasyDataTable> -->
        </div>
      </div>
      <div
        class="flex-1 m-[20px] flex h-[3000px] p-8 bg-bkg-primary rounded-[10px] shadow border border-bkg-secondary flex-col gap-14"
      >
        <div class="grid grid-cols-2">
          <div class="flex flex-col gap-6 border-r mr-10">
            <h1 class="text-accent-1 font-medium text-lg">Status</h1>
            <div class="grid grid-cols-2">
              <div class="flex flex-col gap-8">
                <div class="flex flex-col gap-3 text-sm">
                  <p class="text-label-primary">Last Heard</p>
                  <p class="text-label-primary font-medium">{{ statusDeviceDetail._time }}</p>
                </div>
                <div class="flex flex-col gap-3 text-sm">
                  <p class="text-label-primary">Temperature</p>
                  <div class="flex gap-1 items-center">
                    <img
                      alt="telemetric logo"
                      src="../assets/temp-icon.svg"
                      width="32"
                      height="32"
                    />
                    <p class="text-label-primary font-medium">
                      {{ statusDeviceDetail.temperature }} °C
                    </p>
                  </div>
                </div>
                <div class="flex flex-col gap-3 text-sm">
                  <p class="text-label-primary">Module 1</p>
                  <div class="flex gap-3 items-center">
                    <img
                      alt="telemetric logo"
                      src="../assets/module-icon.svg"
                      width="20"
                      height="20"
                    />
                    <p class="text-label-primary font-medium">{{ statusDeviceDetail.module1 }}</p>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-8">
                <div class="flex flex-col gap-3 text-sm">
                  <p class="text-label-primary">Uptime</p>
                  <p class="text-label-primary font-medium">{{ statusDeviceDetail.uptime }}</p>
                </div>
                <div class="flex flex-col gap-3 text-sm">
                  <p class="text-label-primary">Humidity</p>
                  <div class="flex gap-1 items-center">
                    <img
                      alt="telemetric logo"
                      src="../assets/hum-icon.svg"
                      width="32"
                      height="32"
                    />
                    <p class="text-label-primary font-medium">
                      {{ statusDeviceDetail.humidity }} %
                    </p>
                  </div>
                </div>
                <div class="flex flex-col gap-3 text-sm">
                  <p class="text-label-primary">Module 2</p>
                  <div class="flex gap-3 items-center">
                    <img
                      alt="telemetric logo"
                      src="../assets/module-icon.svg"
                      width="20"
                      height="20"
                    />
                    <p class="text-label-primary font-medium">{{ statusDeviceDetail.module2 }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-6">
            <h1 class="text-accent-1 font-medium text-lg">Data Logs</h1>
            <EasyDataTable
              fixed-header
              table-class-name="customize-table table-scroll"
              :headers="header"
              :items="deviceDataLogs"
              hide-footer
              theme-color="#1363df"
              :loading="telemeryLoading"
              sort-by="timestamp"
              sort-type="desc"
            >
            </EasyDataTable>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <h1 class="text-accent-1 font-medium text-lg">Historical Data</h1>
          <div class="flex justify-between">
            <div class="custom-select">
              <select class="custom-select-option" name="type" id="type" v-model="selectedTag">
                <option value="0" class="text-label-tertiary" disabled selected>Data Tag</option>
                <option v-for="data in dataTags" :value="data">{{ data }}</option>
              </select>
            </div>
            <div class="flex items-center">
              <div class="grid grid-cols-2 gap-4">
                <div
                  class="text-left flex items-center gap-2 border rounded-md border-[#D9D9D9] p-2 w-fit"
                >
                  <h2 class="font-semibold text-xs">From</h2>
                  <div class="flex gap-6">
                    <input
                      class="cursor-pointer outline-none bg-transparent text-xs"
                      type="date"
                      name="startDate"
                      id="startDate"
                      v-model="startDate"
                    />
                    <input
                      class="cursor-pointer outline-none bg-transparent text-xs"
                      type="time"
                      name="startTime"
                      id="startTime"
                      v-model="startTime"
                    />
                  </div>
                </div>
                <div
                  class="text-left flex items-center gap-2 border rounded-md border-[#D9D9D9] p-2 w-fit"
                >
                  <h2 class="font-semibold text-xs">To</h2>
                  <div class="flex gap-6">
                    <input
                      class="cursor-pointer outline-none bg-transparent text-xs"
                      type="date"
                      name="endDate"
                      id="endDate"
                      v-model="endDate"
                    />
                    <input
                      class="cursor-pointer outline-none bg-transparent text-xs"
                      type="time"
                      name="endTime"
                      id="endTime"
                      v-model="endTime"
                    />
                  </div>
                </div>
              </div>
              <div class="w-fit">
                <BaseButton
                  type="submit"
                  class="primary"
                  label="Filter"
                  :loading="getTelemetryHistoryLoading"
                  @click="loadHistoricalData()"
                />
              </div>
            </div>
          </div>

          <EasyDataTable
            :rows-per-page="10"
            table-class-name="customize-table"
            :headers="historyHeader"
            :items="telemetryData"
            theme-color="#1363df"
            :loading="getTelemetryHistoryLoading"
          ></EasyDataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.general-info {
  @apply h-44 shadow-md flex sticky top-[60px] px-5 py-8 gap-10 border-b border-bkg-secondary bg-bkg-primary z-40;
}

.general-info h1 {
  @apply font-medium text-2xl;
}

.device-img {
  @apply h-full w-fit;
}

.table-scroll {
  max-height: 200px;
  overflow-y: auto;
}

::-webkit-scrollbar {
  width: 0.2em;
}

::-webkit-scrollbar-thumb {
  background-color: #c8c8c8;
  border-radius: 10px;
}

.custom-select-option {
  @apply outline-none text-[8px] md:text-[10px] text-label-secondary pb-[6px] px-2 rounded-lg cursor-pointer md:min-w-[200px];
}

.custom-select-option option {
  @apply p-2 cursor-pointer;
}

.custom-select {
  @apply w-fit hover:bg-bkg-secondary border border-label-tertiary rounded-lg pt-[6px] px-2;
}

.custom-select select {
  font-size: 14px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="%23999" d="M10 12l-5-5h10l-5 5z"/></svg>')
    no-repeat right 1px center;
  @apply w-full cursor-pointer focus:outline-none text-label-primary;
}
</style>
