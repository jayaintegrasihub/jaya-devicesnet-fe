<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import IconButton from '@/components/input/IconButton.vue'
import Tab from '@/components/tab/Tab.vue'
import BaseIndicator from '@/components/indicator/BaseIndicator.vue'
import { storeToRefs } from 'pinia'
import router from '@/router'
import { useTelemetryStore } from '@/stores/telemetry/telemetry-store'
import { useGatewaysStore } from '@/stores/master-data/gateways-store'
import BaseButton from '@/components/input/BaseButton.vue'
import SearchBar from '@/components/input/SearchBar.vue'
import { useLocalStorage } from '@vueuse/core'

const telemetryStore = useTelemetryStore()
const {
  getTelemetryDetailLoading,
  statusDeviceDetail,
  deviceDataLogs,
  getTelemetryResetReasonLoading,
  telemetryResetReasonData
} = storeToRefs(useTelemetryStore())
const gatewayStore = useGatewaysStore()
const { gatewayNodes, getGatewayNodesLoading, gatewayHealth } = storeToRefs(useGatewaysStore())

const props = defineProps(['id'])

function goBack() {
  router.go(-1)
}

onMounted(async () => {
  // telemetryStore.listenTelemetryDetail(props.id)
  gatewayStore.listenGatewayHealth(props.id)
  gatewayStore.getGatewayNodes(props.id)

  var element = document.getElementById(selectedComponent.value)
  element.classList.add('active')
})

onUnmounted(() => {
  gatewayStore.stopListenGatewayHealth()
  telemetryStore.stopListenTelemetryDetail()
  loadResetReasonData()
})

//table
const header = [
  { text: 'Timestamp', value: 'timestamp', sortable: true },
  { text: 'Tag', value: 'tag', sortable: true },
  { text: 'Value', value: 'value', sortable: true }
]
const historyResetReasonHeader = [
  { text: 'Timestamp', value: '_time', sortable: true },
  { text: 'Reset Reaason', value: 'resetReason', sortable: true },
  { text: 'Description', value: 'description', sortable: true }
]
//table
const nodeListHeader = [
  { text: 'No', value: 'number', sortable: true },
  { text: 'Node Alias', value: 'alias', sortable: true },
  { text: 'Node SN', value: 'device', sortable: true },
  { text: 'Group', value: 'group', sortable: true }
]

const searchValue = ref('')

const items = []

function getResetReasonDescription(reason) {
  switch (reason) {
    case 1:
      return 'Reset reason can not be determined'
    case 2:
      return 'Software reset via esp_restart'
    case 3:
      return 'Software reset due to exception/panic'
    case 4:
      return 'Reset (software or hardware) due to interrupt watchdog'
    case 5:
      return 'Reset due to task watchdog'
    case 6:
      return 'Reset due to task watchdog'
    case 7:
      return 'Reset due to power-on event'
    case 8:
      return 'Brownout reset (software or hardware)'
    case 9:
      return 'Default reset reason'
    default:
      return 'Unknown reset reason'
  }
}

const now = new Date()
const tomorrow = new Date(now)
tomorrow.setDate(now.getDate() + 1)

const dataResetReasonStartDate = ref(now.toLocaleDateString('en-CA'))
const startResetReasonTime = ref(
  new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
)
const dataResetReasonEndDate = ref(tomorrow.toLocaleDateString('en-CA'))
const endResetReasonTime = ref(
  new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
)

async function loadResetReasonData() {
  const queryParams = {}

  queryParams.startTime = new Date(
    dataResetReasonStartDate.value + 'T' + startResetReasonTime.value
  ).toISOString()
  queryParams.endTime = new Date(
    dataResetReasonEndDate.value + 'T' + endResetReasonTime.value
  ).toISOString()

  await telemetryStore.getTelemetryResetReason(props.id, queryParams)
}

function getResetTitle(reason) {
  switch (reason) {
    case 1:
      return 'Unknown'
    case 2:
      return 'Reset Software'
    case 3:
      return 'Reset Due to Panic'
    case 4:
      return 'Interrupt Watchdog Reset'
    case 5:
      return 'Task Watchdog Reset'
    case 6:
      return 'Task Watchdog Reset'
    case 7:
      return 'Power-On Reset'
    case 8:
      return 'Brownout Reset'
    case 9:
      return 'Default Reset'
    default:
      return 'Unknown Title'
  }
}

const selectedComponent = useLocalStorage('SelectedGatewayInformationTab', 'StatusInfo')
const tabs = [
  {
    title: 'Status',
    value: 'StatusInfo'
  },
  {
    title: 'Data Analytics',
    value: 'DataAnalyticsInfo'
  }
]

function changeNavigation(navigation) {
  var subNavs = document.getElementsByClassName('nav')
  console.log(subNavs)
  for (var i of subNavs) {
    i.classList.remove('active')
  }
  console.log(navigation)
  // event.target.classList.add("active")
  event.target.className += ' active'
  selectedComponent.value = navigation
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
              <BaseIndicator :status="gatewayHealth.status" />
              <h1 class="text-label-primary">{{ gatewayHealth.alias }}</h1>
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
                <p class="text-text-label-primary">{{ gatewayHealth.model }}</p>
              </div>
            </div>
            <div class="flex col-span-1">
              <div class="flex flex-col col-span-1 justify-between">
                <div class="flex gap-[10px]">
                  <p class="text-label-secondary">Firmware Version:</p>
                  <p class="text-text-label-primary">{{ gatewayHealth.fwVersion }}</p>
                </div>
                <div class="flex gap-[10px]">
                  <p class="text-label-secondary">Hardware Version:</p>
                  <p class="text-text-label-primary">{{ gatewayHealth.hwVersion }}</p>
                </div>
              </div>
            </div>
            <div class="flex col-span-1">
              <div class="flex flex-col col-span-1 justify-between">
                <div class="flex gap-[10px]">
                  <p class="text-label-secondary">Radio Protocol Version:</p>
                  <p class="text-text-label-primary">{{ gatewayHealth.rdVersion }}</p>
                </div>
                <div class="flex gap-[10px]">
                  <p class="text-label-secondary">Reset Reason</p>
                  <p class="text-text-label-primary">
                    {{ getResetTitle(gatewayHealth.resetReason) }}
                  </p>
                  <div class="dropdown">
                    <img
                      src="../assets/info-icon.svg"
                      alt=""
                      height="14px"
                      width="14px"
                      class="cursor-pointer"
                    />
                    <div class="dropdown-content w-full">
                      {{ getResetReasonDescription(gatewayHealth.resetReason) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="m-[20px] flex-1 rounded-[10px] flex-col gap-5 flex">
        <div class="mx-8 grid grid-row gap-6 md:gap-10">
          <div class="md:w-fit">
            <Tab :tabs="tabs" @clicked="changeNavigation" />
          </div>
        </div>
        <div
          class="flex-1 m-[20px] flex h-[3000px] p-8 bg-bkg-primary rounded-[10px] mt-1 shadow border border-bkg-secondary flex-col gap-5"
          :style="{ display: selectedComponent === 'DataAnalyticsInfo' ? 'block' : 'none' }"
        >
          <div class="flex flex-col gap-6">
            <h1 class="text-accent-1 font-medium text-lg">Data Analytics</h1>
            <div class="flex flex-col gap-4">
              <div class="flex justify-between mb-6">
                <p class="font-semibold">Telemetry Data Reset Reason History</p>
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
                          name="startDateResetReason"
                          id="startDateResetReason"
                          v-model="dataResetReasonStartDate"
                        />
                        <input
                          class="cursor-pointer outline-none bg-transparent text-xs"
                          type="time"
                          name="startTimeResetReason"
                          id="startTimeResetReason"
                          v-model="startResetReasonTime"
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
                          name="endDateResetReason"
                          id="endDateResetReason"
                          v-model="dataResetReasonEndDate"
                        />
                        <input
                          class="cursor-pointer outline-none bg-transparent text-xs"
                          type="time"
                          name="endTimeResetReason"
                          id="endTimeResetReason"
                          v-model="endResetReasonTime"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="w-fit">
                    <BaseButton
                      type="submit"
                      class="primary"
                      label="Filter"
                      :loading="getTelemetryResetReasonLoading"
                      @click="loadResetReasonData()"
                    />
                  </div>
                </div>
              </div>
              <EasyDataTable
                :rows-per-page="10"
                table-class-name="customize-table"
                :headers="historyResetReasonHeader"
                :items="telemetryResetReasonData"
                theme-color="#1363dF"
                :loading="getTelemetryHistoryLoading"
              >
                <template #item-resetReason="item">
                  {{ getResetTitle(item.resetReason) }}
                </template>
                <template #item-description="item">
                  {{ getResetReasonDescription(item.resetReason) }}
                </template>
              </EasyDataTable>
            </div>
          </div>
        </div>
        <div
          class="flex-1 m-[20px] flex h-[3000px] p-8 bg-bkg-primary rounded-[10px] mt-1 shadow border border-bkg-secondary flex-col gap-5"
          :style="{ display: selectedComponent === 'StatusInfo' ? 'block' : 'none' }"
        >
          <div class="grid grid-cols-2">
            <div class="flex flex-col gap-6 border-r mr-10">
              <h1 class="text-accent-1 font-medium text-lg">Status</h1>
              <div class="grid grid-cols-2">
                <div class="flex flex-col gap-8">
                  <div class="flex flex-col gap-3 text-sm">
                    <p class="text-label-primary">Last Heard</p>
                    <p class="text-label-primary font-medium">{{ gatewayHealth._time }}</p>
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
                        {{ gatewayHealth.temperature }} °C
                      </p>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col gap-8">
                  <div class="flex flex-col gap-3 text-sm">
                    <p class="text-label-primary">Uptime</p>
                    <p class="text-label-primary font-medium">{{ gatewayHealth.uptime }}</p>
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
                      <p class="text-label-primary font-medium">{{ gatewayHealth.humidity }} %</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-6 hidden">
              <h1 class="text-accent-1 font-medium text-lg">History Reset Reason</h1>
              <EasyDataTable
                :rows-per-page="10"
                table-class-name="customize-table table-scroll"
                :headers="historyResetReasonHeader"
                :items="items"
                theme-color="#1363df"
              ></EasyDataTable>
            </div>
          </div>

          <div class="flex flex-col gap-4 mt-4">
            <h1 class="text-accent-1 font-medium text-lg">Nodes List</h1>
            <div class="flex justify-between items-end">
              <div class="w-fit">
                <SearchBar
                  class="outlined"
                  v-model="searchValue"
                  placeholder="Search by SN, alias ..."
                />
              </div>
              <div class="flex items-center gap-2">
                <p class="text-label-primary text-sm">Total Connected Nodes:</p>
                <p v-if="!getGatewayNodesLoading" class="font-semibold text-lg">
                  {{ gatewayNodes.length }}
                </p>
              </div>
            </div>
            <EasyDataTable
              :search-value="searchValue"
              :rows-per-page="10"
              table-class-name="customize-table"
              :headers="nodeListHeader"
              :items="gatewayNodes"
              theme-color="#1363df"
              :loading="getGatewayNodesLoading"
            >
              <template #item-group="item">
                <div class="flex gap-4 py-2">
                  <div
                    class="rounded-full px-4 py-2 bg-accent-1"
                    v-for="(value, key) in item.group"
                  >
                    <div class="text-white">{{ key }} : {{ value }}</div>
                  </div>
                </div>
              </template>
            </EasyDataTable>
          </div>
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

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  @apply opacity-0 flex flex-col gap-1 invisible absolute left-0 bg-bkg-secondary rounded-lg z-10 border min-w-[180px] shadow-lg transition-opacity ease-in-out delay-100 duration-300 p-4;
}

.dropdown:hover > .dropdown-content {
  @apply opacity-100 visible;
}
</style>
