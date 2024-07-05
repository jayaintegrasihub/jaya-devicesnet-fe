<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useTelemetryStore } from '@/stores/telemetry/telemetry-store'
import { storeToRefs } from 'pinia'
import BaseIndicator from '@/components/indicator/BaseIndicator.vue'
import SearchBar from '@/components/input/SearchBar.vue'
import { useThemeStore } from '@/stores/theme'
import SignalIndicator from '@/components/indicator/SignalIndicator.vue'


import { Chart, BarElement, BarController, CategoryScale, Decimation, Filler, Legend, Title, Tooltip, PointElement, LineElement, LinearScale } from 'chart.js';
Chart.register(BarElement, BarController, CategoryScale, Decimation, Filler, Legend, Title, Tooltip, PointElement, LineElement, LinearScale)
import { shallowRef } from 'vue'


const themeStore = useThemeStore()
const { isDark } = storeToRefs(useThemeStore())

const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

const whileState = ref(true)
const selectedTenant = ref('UBS')
const telemetryStore = useTelemetryStore()
const { nodesData, gatewaysData, lastUpdated, isThereOfflineDevice, offlineDevices, telemetryData, totalDevices, totalGateways, totalNodes, totalOffline, totalOnline, onlineGateways, onlineNodes, offlineGateways, offlineNodes } = storeToRefs(useTelemetryStore())
const searchValue = ref('')


const groupedNodesData = ref({})
const nodesGroupBy = ref('none')

function dataGrouping(data, groupBy) {
  if (!data) {
    return null;
  }

  if (groupBy === 'none') {
    return data;
  }

  return data.reduce((acc, item) => {
    let key = item[groupBy];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}


const filteredTelemetryData = computed(() => {
  if (!searchValue.value.trim()) {
    return telemetryData.value
  }
  const searchTerm = searchValue.value.trim().toLowerCase()
  return telemetryData.value.filter(telemetry => {
    return telemetry.alias.toLowerCase().includes(searchTerm) ||
      telemetry.device.toLowerCase().includes(searchTerm)
  })
})

// Function to filter each object's array
const filterArraysInObjects = (input) => {
  const filteredData = {}
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      filteredData[key] = value.filter(item => {
        // Your filter condition goes here
        // For example, filter objects where data1 is greater than "5"
        return item.alias.toLowerCase().includes(searchValue.value.trim().toLowerCase())
      })
    }
  }
  return filteredData
}

onMounted(async () => {
  renderBarChart()
  await telemetryStore.getTelemetryData(selectedTenant.value)
  //table data
  tmpNodesFirmwareVersionTableData.value = nodesData.value.reduce((acc, item) => {
    const { fwVersion } = item;
    if (!acc[fwVersion]) {
      acc[fwVersion] = [];
    }
    acc[fwVersion].push(item);
    return acc;
  }, {});
  selectedFw.value = tmpNodesFirmwareVersionTableData.value[0]

  while (whileState.value) {
    await telemetryStore.getTelemetryData(selectedTenant.value)

    groupedNodesData.value = dataGrouping(nodesData.value, nodesGroupBy.value);
    console.log('Grouped Nodes Data', groupedNodesData.value);

    //chart data
    const tmpfirmwareVersionBarChartData = nodesData.value.reduce((acc, item) => {
      const { fwVersion } = item;
      const index = acc.fwVersion.indexOf(fwVersion);
      if (index === -1) {
        acc.fwVersion.push(fwVersion);
        acc.count.push(1);
      } else {
        acc.count[index]++;
      }
      return acc;
    }, { fwVersion: [], count: [] });

    availableFwVersion.value = Object.keys(tmpNodesFirmwareVersionTableData.value)
    selectedFw.value = availableFwVersion.value[0]
    nodesFirmwareVersionTableData.value = tmpNodesFirmwareVersionTableData.value[selectedFw.value]

    updateData(firmwareVersionBarChart.value, tmpfirmwareVersionBarChartData.fwVersion, tmpfirmwareVersionBarChartData.count)
    // let data = [{
    //   "_time": "2024-07-03T10:44:07Z",
    //   "Floor": "2",
    //   "Tray": "3",
    //   "_measurement": "nodehealth",
    //   "device": "MMA24DCC3E1A738",
    //   "fwVersion": "2.0.0",
    //   "humidity": 38.54999923706055,
    //   "hwVersion": "2.0.0",
    //   "messageId": 0,
    //   "rdVersion": "2.1.0",
    //   "rssi": 78,
    //   "temperature": 31.940000534057617,
    //   "uptime": 208666,
    //   "status": "ONLINE",
    //   "alias": "R209"
    // },
    // {
    //   "_time": "2024-07-03T10:44:09Z",
    //   "Floor": "2",
    //   "Tray": "3",
    //   "_measurement": "nodehealth",
    //   "device": "MMA24DCC3E2DCCC",
    //   "fwVersion": "2.1.0",
    //   "humidity": 38.2400016784668,
    //   "hwVersion": "2.0.0",
    //   "messageId": 0,
    //   "rdVersion": "2.1.0",
    //   "rssi": 224,
    //   "temperature": 32.099998474121094,
    //   "uptime": 187077,
    //   "status": "ONLINE",
    //   "alias": "R231"
    // }]
    //table data
    tmpNodesFirmwareVersionTableData.value = nodesData.value.reduce((acc, item) => {
      const { fwVersion } = item;
      if (!acc[fwVersion]) {
        acc[fwVersion] = [];
      }
      acc[fwVersion].push(item);
      return acc;
    }, {});

    availableFwVersion.value = Object.keys(tmpNodesFirmwareVersionTableData.value)

    const filteredData = filterArraysInObjects(telemetryData)
    await delay(5000)
  }
})

onUnmounted(() => {
  whileState.value = false
})

//chart
const firmwareVersionBarChartCanvas = ref(null)
let firmwareVersionBarChart

function renderBarChart() {
  let firmwareVersionChartData = {
    labels: [],
    datasets: [
      {
        type: 'bar',
        label: 'Quantity',
        data: [],
        backgroundColor: 'rgba(54, 174, 124, 0.8)',
        borderRadius: 4,
      },
    ],
  }

  const firmwareVersionChartCtx = firmwareVersionBarChartCanvas.value.getContext('2d')
  firmwareVersionBarChart = shallowRef(new Chart(firmwareVersionChartCtx, {
    type: 'bar',
    data: firmwareVersionChartData,
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: {
            callback: function (value) {
              if (Number.isInteger(value)) {
                return value;
              }
              return '';
            }
          },
          beginAtZero: true
        }
      }
    }
  }))
}

function updateData(chart, label, newData) {
  chart.data.labels = []
  chart.data.labels = label;
  chart.data.datasets.forEach((dataset) => {
    dataset.data = []
  });
  chart.data.datasets.forEach((dataset) => {
    newData.forEach((data) => {
      dataset.data.push(data)
    })
  });
  chart.update();
}


//table
const header = [
  { text: "Name", value: "alias", sortable: true },
  { text: "Serial Number", value: "device", sortable: true },
  { text: "Firmware Ver.", value: "fwVersion", sortable: true },
]

const tmpNodesFirmwareVersionTableData = ref('')
const nodesFirmwareVersionTableData = ref('')
const availableFwVersion = ref([])
const selectedFw = ref()

function selectedFwChanged() {
  nodesFirmwareVersionTableData.value = tmpNodesFirmwareVersionTableData.value[selectedFw.value]
  console.log(nodesFirmwareVersionTableData.value)
}

</script>

<template>
  <div class="flex">
    <SideNav :isDashboardActive="true" />
    <div class="flex flex-col w-screen">
      <TopBar>
        <p class="text-label-primary">Dashboard</p>
      </TopBar>
      <div class="px-[20px] pt-[20px] pb-[40px] flex flex-col gap-[20px] bg-bkg-primary">
        <div class=" flex justify-between items-center">
          <div class="custom-select">
            <select name="tenants" id="tenants" v-model="selectedTenant">
              <option value="UBS">UBS</option>
            </select>
          </div>
          <p class="text-sm text-label-secondary">Last Updated: {{ lastUpdated }}</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-bkg-secondary rounded-[24px] p-[2px] grid grid-rows-2">
            <div class="gap-[12px] flex-1 py-[12px] px-[20px] flex flex-col justify-center">
              <div class="flex justify-between">
                <h1 class="text-label-primary text-lg font-semibold">
                  Total Devices
                </h1>
                <img v-if="!isDark" src="../../assets/device-icon.svg" height="32px" width="32px" alt="">
                <img v-if="isDark" src="../../assets/device-icon-white.svg" height="32px" width="32px" alt="">
              </div>
              <h1 class="text-accent-1 self-center text-center text-[30px] sm:text-[50px] font-medium">
                {{ totalDevices }}
              </h1>
            </div>
            <div class="flex gap-6 px-[20px] pb-[20px]">
              <div
                class="flex-1 p-[20px] bg-bkg-primary shadow border border-bkg-secondary flex flex-col justify-start rounded-[6px] sm:rounded-[16px]">
                <div class="flex justify-between items-center">
                  <p class="text-label-primary text-xs sm:text-[16px] font-semibold">
                    Gateways
                  </p>
                  <img v-if="!isDark" src="../../assets/gateway-icon.svg" height="30px" width="30px" alt="">
                  <img v-if="isDark" src="../../assets/gateway-icon-white.svg" height="30px" width="30px" alt="">
                </div>
                <div class="h-full flex items-center justify-center">
                  <p class="text-accent-1 text-center text-lg sm:text-[32px] font-medium">
                    {{ totalGateways }}
                  </p>
                </div>
              </div>
              <div
                class="flex-1 p-[20px] bg-bkg-primary shadow border border-bkg-secondary flex flex-col justify-start rounded-[6px] sm:rounded-[16px]">
                <div class="flex justify-between items-center">
                  <p class="text-label-primary text-xs sm:text-[16px] font-semibold">
                    Nodes
                  </p>
                  <img v-if="!isDark" src="../../assets/node-icon.svg" height="30px" width="30px" alt="">
                  <img v-if="isDark" src="../../assets/node-icon-white.svg" height="30px" width="30px" alt="">
                </div>
                <div class="h-full flex items-center justify-center">
                  <p class="text-accent-1 text-center text-lg sm:text-[32px] font-medium">
                    {{ totalNodes }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-rows-2 gap-3">
            <div class="flex flex-col gap-1 bg-bkg-secondary rounded-[24px] p-[2px]">
              <div
                class="gap-[12px] flex-1 py-[12px] px-[20px]  bg-bkg-primary shadow border border-bkg-secondary flex flex-col justify-center rounded-[6px] sm:rounded-[22px]">
                <h1 class="text-label-primary text-center text-lg font-semibold">
                  Online
                </h1>
                <h1 class="text-var-green text-center text-[50px] sm:text-[32px] font-medium">
                  {{ totalOnline }}
                </h1>
              </div>
              <div class="flex justify-between  py-[12px] px-[20px]">
                <div class="flex items-center gap-2">
                  <p class="text-[18px] text-var-green font-semibold">{{ onlineGateways }}</p>
                  <p class="text-label-primary text-[16px] font-medium">Gateways</p>
                </div>
                <div class="flex items-center gap-2">
                  <p class="text-[18px] text-var-green font-semibold">{{ onlineNodes }}</p>
                  <p class="text-label-primary text-[16px] font-medium">Nodes</p>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-1 bg-bkg-secondary rounded-[24px] p-[2px]">
              <div
                class="gap-[12px] flex-1 py-[12px] px-[20px] bg-bkg-primary shadow border border-bkg-secondary flex flex-col justify-center rounded-[6px] sm:rounded-[22px]">
                <h1 class="text-label-primary text-center text-lg font-semibold">
                  Offline
                </h1>
                <h1 class="text-var-red text-center text-[50px] sm:text-[32px] font-medium">
                  {{ totalOffline }}
                </h1>
              </div>
              <div class="flex justify-between  py-[12px] px-[20px]">
                <div class="flex items-center gap-2">
                  <p class="text-[18px] text-var-red font-semibold">{{ offlineGateways }}</p>
                  <p class="text-label-primary text-[16px] font-medium">Gateways</p>
                </div>
                <div class="flex items-center gap-2">
                  <p class="text-[18px] text-var-red font-semibold">{{ offlineNodes }}</p>
                  <p class="text-label-primary text-[16px] font-medium">Nodes</p>
                </div>
              </div>
            </div>
          </div>
          <div v-if="isThereOfflineDevice"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-start">
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <p class="text-lg text-label-primary font-semibold">Offline devices</p>
                <p class="text-sm text-var-blue">show all offline devices ></p>
              </div>
              <div v-for="data in offlineDevices"
                class="bg-var-red rounded-[4px] px-[20px] py-[20px] text-white  flex flex-col gap-2 justify-start">
                <div class="flex justify-between">
                  <!-- <p class="text-sm">{{ data.device }}</p> -->
                  <p class="text-xs">Last Heard: {{ data._time }}</p>
                </div>
                <label class="text-sm font-semibold">{{ data.alias }} - {{ data.device }}</label>
              </div>
            </div>
          </div>
          <div v-if="!isThereOfflineDevice"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-center">
            <div class="flex flex-col gap-2 h-full">
              <div class="flex justify-between items-center">
                <p class="text-lg text-label-primary font-semibold">Offline devices</p>
              </div>
              <div
                class="border-2 rounded-xl border-dashed border-[#36AE7C] flex justify-center items-center w-full h-full flex-col gap-2">
                <img src="../../assets/smile-icon.svg" alt="" height="120px" width="120px">
                <p class="text-lg text-label-primary font-semibold ">Relax, all your devices are online!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-[20px] flex flex-col gap-[20px]">
        <!-- <div class="flex flex-col md:flex-row gap-4 md:justify-between">
          <SearchBar v-model="searchValue" />
        </div> -->
        <div
          class="flex-1 py-8 bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex-col gap-5 flex">
          <div class="mx-8 grid grid-row gap-4 md:gap-8">
            <div class="flex flex-col gap-10">
              <div class="flex flex-col gap-4">
                <div
                  class="flex justify-between items-center border border-bkg-tertiary border-opacity-60 rounded-[8px] px-6 py-2 shadow-md gap-2 font-semibold bg-bkg-secondary text-label-primary">
                  Gateways
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div
                    class="border border-bkg-tertiary border-opacity-60 rounded-[16px] px-6 py-6 shadow-md flex flex-col gap-2"
                    v-for="data in gatewaysData">
                    <div class="flex justify-between items-center">
                      <div class="flex gap-5 items-center">
                        <BaseIndicator :status="data.status" />
                        <h1 class="font-medium text-base sm:text-lg text-label-primary">
                          {{ data.alias }}
                        </h1>
                      </div>
                      <div>
                        <SignalIndicator :status=data.rssi />
                      </div>
                    </div>
                    <div class="grid grid-cols-1 xl:grid-cols-2 justify-between">
                      <div class="flex flex-col gap-1">
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="font-medium text-label-primary opacity-80">SN:</p>
                          <h2 class="font-semibold text-label-primary opacity-90">{{ data.device }}</h2>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80 ">Last Heard:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data._time }}</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Humidity:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.humidity }}%</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Temperature:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.temperature }}°C</p>
                        </div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Fw Version:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.fwVersion }}</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Hw Version:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.hwVersion }}</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Lora dBm:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.rssi }}</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Uptime:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.uptime }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-4">
                <div
                  class="flex justify-between items-center border border-bkg-tertiary border-opacity-60 rounded-[8px] px-6 py-2 shadow-md gap-2 font-semibold bg-bkg-secondary text-label-primary">
                  <p>
                    Nodes
                  </p>
                  <div class="flex items-center gap-4">
                    <h1 class="text-label-primary font-semibold">Group By</h1>
                    <div class="custom-select">
                      <select name="nodesGroupBy" id="nodesGroupBy" v-model="nodesGroupBy">
                        <option value="none">none</option>
                        <option value="none">none</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div
                    class="border border-bkg-tertiary border-opacity-60 rounded-[16px] px-6 py-6 shadow-md flex flex-col gap-2"
                    v-for="data in nodesData">
                    <div class="flex justify-between items-center">
                      <div class="flex gap-5 items-center">
                        <BaseIndicator :status="data.status" />
                        <h1 class="font-medium text-base sm:text-lg text-label-primary">
                          {{ data.alias }}
                        </h1>
                      </div>
                      <div>
                        <SignalIndicator :status=data.rssi />
                      </div>
                    </div>
                    <div class="grid grid-cols-1 xl:grid-cols-2 justify-between">
                      <div class="flex flex-col gap-1">
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="font-medium text-label-primary opacity-80">SN:</p>
                          <h2 class="font-semibold text-label-primary opacity-90">{{ data.device }}</h2>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80 ">Last Heard:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data._time }}</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Humidity:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.humidity }}%</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Temperature:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.temperature }}°C</p>
                        </div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Fw Version:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.fwVersion }}</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Hw Version:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.hwVersion }}</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Lora dBm:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.rssi }}</p>
                        </div>
                        <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                          <p class="text-label-primary font-medium opacity-80">Uptime:</p>
                          <p class="text-label-primary font-semibold opacity-90">{{ data.uptime }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="p-8 bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex-col gap-5 flex">

          <h1 class="text-label-primary text-lg font-semibold">
            Firmware Versions
          </h1>
          <div class="grid grid-cols-3 gap-6">
            <div class="col-span-2">
              <canvas ref="firmwareVersionBarChartCanvas"></canvas>
            </div>
            <div class="flex flex-col gap-2">
              <div class="custom-select">
                <select name="availableFw" id="availableFw" v-model="selectedFw" @change="selectedFwChanged()">
                  <option v-for="fw in availableFwVersion" :value="fw">{{ fw }}</option>
                </select>
              </div>
              <EasyDataTable class="col-span-1" :rows-per-page="10" table-class-name="customize-table" :headers="header"
                :items="nodesFirmwareVersionTableData" theme-color="#1363df">
              </EasyDataTable>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
p {
  @apply select-none
}

.custom-select {
  @apply relative inline-block w-[200px]
}

.custom-select select {
  font-size: 16px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="%23999" d="M10 12l-5-5h10l-5 5z"/></svg>') no-repeat right 10px center;
  @apply w-full px-4 py-2 bg-bkg-primary border border-label-secondary rounded-full cursor-pointer focus:outline-none text-label-primary
}
</style>
