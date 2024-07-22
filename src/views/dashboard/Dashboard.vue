<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useTelemetryStore } from '@/stores/telemetry/telemetry-store'
import { storeToRefs } from 'pinia'
import BaseIndicator from '@/components/indicator/BaseIndicator.vue'
import SearchBar from '@/components/input/SearchBar.vue'
import { useThemeStore } from '@/stores/theme'
import SignalIndicator from '@/components/indicator/SignalIndicator.vue'
import { useTenantsStore } from '@/stores/master-data/tenants-store'
import { useLocalStorage } from '@vueuse/core'
import { useTypesStore } from '@/stores/master-data/types-store'

import { Chart, BarElement, BarController, CategoryScale, Decimation, Filler, Legend, Title, Tooltip, PointElement, LineElement, LinearScale } from 'chart.js';
Chart.register(BarElement, BarController, CategoryScale, Decimation, Filler, Legend, Title, Tooltip, PointElement, LineElement, LinearScale)
import { shallowRef } from 'vue'


/// tenants
const tenantStore = useTenantsStore()
const { tenants } = storeToRefs(useTenantsStore())
const selectedTenant = useLocalStorage('SelectedTenant', '')

async function initTenantsList() {
  await tenantStore.getTenants()

  if (tenants.value.length === 0) {
    selectedTenant.value = 'none'
  } else if (selectedTenant.value === '') {
    selectedTenant.value = tenants.value[0].name
  }

}

/// device types
const typeStore = useTypesStore()
const { type, types } = storeToRefs(useTypesStore())
const selectedDeviceType = useLocalStorage('SelectedDeviceType', 'All')

async function initTypesList() {
  await initTelemetryData()
  await typeStore.getTypes()
  if (selectedDeviceType.value !== 'All') {
    let selectedType = findByName(types.value, selectedDeviceType.value)
    await typeStore.getType(selectedType.id)
  }
}

const findByName = (array, name) => {
  return array.find(item => item.name === name);
}

///telemetry
const telemetryStore = useTelemetryStore()
const { isNoDevices, nodesData, gatewaysData, lastUpdated, isThereOfflineDevice, offlineDevices, telemetryData, totalDevices, totalGateways, totalNodes, totalOffline, totalOnline, onlineGateways, onlineNodes, offlineGateways, offlineNodes } = storeToRefs(useTelemetryStore())
const groupedNodesData = ref({})
const nodesGroupBy = useLocalStorage('NodesGroupBy', [])

// Watch for changes in nodesGroupBy
watch(nodesGroupBy, async (value) => {
  groupingNodesData()
}, { deep: true })

function groupingNodesData() {
  if (nodesGroupBy.value.length === 0) {
    groupedNodesData.value = nodesData.value
  } else {
    groupedNodesData.value = nestGroupsBy(nodesData.value, nodesGroupBy.value)
  }
}

function removeGroup(element) {
  const index = nodesGroupBy.value.indexOf(element);
  if (index > -1) {
    nodesGroupBy.value.splice(index, 1);
  }
}

async function initTelemetryData() {

  if (selectedDeviceType.value === 'All') {
    await telemetryStore.getTelemetryData(selectedTenant.value)
  } else {
    await telemetryStore.getTelemetryData(selectedTenant.value, { type: selectedDeviceType.value })
  }
  groupingNodesData()
  initTableChartData()
}

function initTableChartData() {

  //table data
  tmpGatewaysFirmwareVersionTableData.value = groupBy(gatewaysData.value, 'fwVersion')
  availableGatewaysFwVersion.value = Object.keys(tmpGatewaysFirmwareVersionTableData.value)
  selectedGatewaysFw.value = availableGatewaysFwVersion.value[0]
  gatewaysFirmwareVersionTableData.value = tmpGatewaysFirmwareVersionTableData.value[selectedGatewaysFw.value] === undefined ? [] : tmpGatewaysFirmwareVersionTableData.value[selectedGatewaysFw.value]

  tmpNodesFirmwareVersionTableData.value = groupBy(nodesData.value, 'fwVersion')
  availableNodesFwVersion.value = Object.keys(tmpNodesFirmwareVersionTableData.value)
  selectedNodesFw.value = availableNodesFwVersion.value[0]
  nodesFirmwareVersionTableData.value = tmpNodesFirmwareVersionTableData.value[selectedNodesFw.value] === undefined ? [] : tmpNodesFirmwareVersionTableData.value[selectedNodesFw.value]

  //chart data
  const tmpGatewaysFirmwareVersionBarChartData = gatewaysData.value.reduce((acc, item) => {
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

  updateData(gatewaysFirmwareVersionBarChart.value, tmpGatewaysFirmwareVersionBarChartData.fwVersion, tmpGatewaysFirmwareVersionBarChartData.count)

  const tmpNodesFirmwareVersionBarChartData = nodesData.value.reduce((acc, item) => {
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

  updateData(nodesFirmwareVersionBarChart.value, tmpNodesFirmwareVersionBarChartData.fwVersion, tmpNodesFirmwareVersionBarChartData.count)
}

/// experimental
function nestGroupsBy(arr, properties) {
  properties = Array.from(properties);
  if (properties.length === 1) {
    return groupBy(arr, properties[0]);
  }
  const property = properties.shift();
  var grouped = groupBy(arr, property);
  for (let key in grouped) {
    grouped[key] = nestGroupsBy(grouped[key], Array.from(properties));
  }
  return grouped;
}

/**
 * Group objects by property.
 * `nestGroupsBy` helper method.
 *
 * @param {String} property
 * @param {Object[]} conversions
 * @returns {Object}
 */
function groupBy(conversions, property) {
  return conversions.reduce((acc, obj) => {
    let key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});
}


//------------

///utils
const { isDark } = storeToRefs(useThemeStore())
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))
const whileState = ref(true)
const searchValue = ref('')

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

onMounted(async () => {
  renderBarChart()
  await initTenantsList()
  await initTypesList()
  await initTelemetryData()

  //init periodical request
  while (whileState.value) {
    await initTelemetryData()
    await delay(5000)
  }
})

onUnmounted(() => {
  whileState.value = false
})

//chart
const nodesFirmwareVersionBarChartCanvas = ref(null)
let nodesFirmwareVersionBarChart

const gatewaysFirmwareVersionBarChartCanvas = ref(null)
let gatewaysFirmwareVersionBarChart

function renderBarChart() {
  let gatewaysFirmwareVersionChartData = {
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

  const gatewaysFirmwareVersionChartCtx = gatewaysFirmwareVersionBarChartCanvas.value.getContext('2d')
  gatewaysFirmwareVersionBarChart = shallowRef(new Chart(gatewaysFirmwareVersionChartCtx, {
    type: 'bar',
    data: gatewaysFirmwareVersionChartData,
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

  let nodesFirmwareVersionChartData = {
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

  const nodesFirmwareVersionChartCtx = nodesFirmwareVersionBarChartCanvas.value.getContext('2d')
  nodesFirmwareVersionBarChart = shallowRef(new Chart(nodesFirmwareVersionChartCtx, {
    type: 'bar',
    data: nodesFirmwareVersionChartData,
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

const tmpGatewaysFirmwareVersionTableData = ref('')
const gatewaysFirmwareVersionTableData = ref([])
const availableGatewaysFwVersion = ref([])
const selectedGatewaysFw = ref()

function selectedGatewaysFwChanged() {
  gatewaysFirmwareVersionTableData.value = tmpGatewaysFirmwareVersionTableData.value[selectedGatewaysFw.value]
}

const tmpNodesFirmwareVersionTableData = ref('')
const nodesFirmwareVersionTableData = ref([])
const availableNodesFwVersion = ref([])
const selectedNodesFw = ref()

function selectedNodesFwChanged() {
  nodesFirmwareVersionTableData.value = tmpNodesFirmwareVersionTableData.value[selectedNodesFw.value]
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
        <div class="grid grid-cols-2 items-top">
          <div class="flex gap-4">
            <div class="custom-select">
              <h1 class="text-sm text-label-secondary">Tenant</h1>
              <select name="tenants" id="tenants" v-model="selectedTenant" @change="initTelemetryData()">
                <option value="none">none</option>
                <option v-for="tenant in tenants" :value="tenant.name">{{ tenant.name }}</option>
              </select>
            </div>
            <div class="custom-select">
              <h1 class="text-sm text-label-secondary">Device Type</h1>
              <select name="type" id="type" v-model="selectedDeviceType" @change="initTypesList()">
                <option value="All">All</option>
                <option v-for="data in types" :value="data.name">{{ data.name }}</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end">
            <p class="text-sm text-label-secondary">Last Updated: {{ lastUpdated }}</p>
          </div>
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
          <div v-if="isThereOfflineDevice && !isNoDevices"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-start">
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <p class="text-lg text-label-primary font-semibold">Offline devices</p>
                <p class="text-sm text-var-blue">show all offline devices ></p>
              </div>
              <div class="flex flex-col gap-2 h-[280px] overflow-y-auto">
                <div v-for="data in offlineDevices"
                  class="bg-var-red rounded-[4px] px-[20px] py-[20px] text-white  flex flex-col gap-2 justify-start over">
                  <div class="flex justify-between">
                    <!-- <p class="text-sm">{{ data.device }}</p> -->
                    <p class="text-xs">Last Heard: {{ data._time }}</p>
                  </div>
                  <label class="text-sm font-semibold">{{ data.alias }} - {{ data.device }}</label>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!isThereOfflineDevice && !isNoDevices"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-center">
            <div class="flex flex-col gap-2 h-full">
              <div
                class="border-2 rounded-xl border-dashed border-[#36AE7C] flex justify-center items-center w-full h-full flex-col gap-2">
                <img src="../../assets/smile-icon.svg" alt="" height="120px" width="120px">
                <p class="text-lg text-label-primary font-semibold ">Relax, all your devices are online!</p>
              </div>
            </div>
          </div>
          <div v-if="isNoDevices"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-center">
            <div class="flex flex-col gap-2 h-full">
              <div
                class="border-2 rounded-xl border-dashed border-[#D9683C] flex justify-center items-center w-full h-full flex-col gap-2">
                <img src="../../assets/oops-icon.svg" alt="" height="120px" width="120px">
                <p class="text-lg text-label-primary font-semibold ">Ooops, seems like you don't have any device yet</p>
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
                  <div class="flex items-center gap-3" v-if="selectedDeviceType !== 'All'">
                    <h1 class="text-label-primary text-sm font-medium">Group By</h1>
                    <div class="flex gap-1">
                      <div @click="removeGroup(group)"
                        class="bg-[#E2EBF6] border text-[#3962EB] px-2 py-1 rounded-full cursor-pointer text-xs font-sembold"
                        v-for="group in nodesGroupBy">
                        {{ group }}
                      </div>
                    </div>
                    <div class="dropdown">
                      <div class="p-2 rounded-lg cursor-pointer bg-bkg-tertiary">
                        <img src="../../assets/group-icon.svg" alt="" height="16px" width="16px">
                      </div>
                      <div class="dropdown-content">
                        <div v-for="(option, index) in type.groups" :key="index" class="">
                          <label class="cursor-pointer select-none">
                            <input class="cursor-pointer sr-only peer" type="checkbox" id="" :value="option"
                              v-model="nodesGroupBy"
                              :disabled="nodesGroupBy.length >= 2 && !nodesGroupBy.includes(option)">
                            <div
                              class="font-normal peer-checked:text-[#3962EB] text-sm rounded-lg w-full h-6 bg-gray-200 peer peer-checked:bg-[#E2EBF6]">
                              <p class="h-full flex items-center justify-center ">{{ option }}</p>
                            </div>

                          </label>
                        </div>
                      </div>
                    </div>

                  </div>
                  <!-- <div class="grid grid-cols-3 items-center gap-4" v-if="selectedDeviceType !== 'All'">
                    <h1 class="text-label-primary font-medium">Group By</h1>
                    <div class="custom-select-2 col-span-2">
                      <select name="nodesGroupBy" id="nodesGroupBy" v-model="nodesGroupBy">
                        <option value="none">none</option>
                        <option v-for="(option, index) in type.groups" :key="index" :value="option">{{ option }}
                        </option>
                      </select>
                    </div>
                  </div> -->
                </div>

                <div v-if="nodesGroupBy.length === 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

                <div v-if="nodesGroupBy.length == 1" v-for="( value, key ) in groupedNodesData"
                  class="flex flex-col gap-4">
                  <div class="px-6 py-2 bg-bkg-secondary rounded-[8px]">
                    <h1 class="text-label-primary font-semibold">
                      {{ nodesGroupBy[0] }} {{ key }}
                    </h1>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div
                      class="border border-bkg-tertiary border-opacity-60 rounded-[16px] px-6 py-6 shadow-md flex flex-col gap-2"
                      v-for="data in value">
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

                <div v-if="nodesGroupBy.length > 1" class="flex flex-col gap-4">
                  <!-- Iterate over the outermost grouping -->

                  <div v-for="(outerGroup, outerKey) in groupedNodesData" :key="outerKey"
                    class="rounded-[16px] bg-bkg-secondary p-[10px] flex flex-col gap-4">
                    <!-- Display the outermost group title -->
                    <div class="p-[6px]">
                      <h1 class="text-label-primary font-semibold text-normal">
                        {{ nodesGroupBy[0] }} {{ outerKey }}
                      </h1>
                    </div>

                    <!-- Iterate over the first level of inner grouping -->
                    <div v-for="(innerGroup, innerKey) in outerGroup" :key="innerKey"
                      class="bg-bkg-primary p-[10px] rounded-[11px] border border-bkg-tertiary">
                      <!-- Display the first level inner group title -->
                      <div class="p-[6px]">
                        <h2 class="text-label-primary font-medium text-normal">
                          {{ nodesGroupBy[1] }} {{ innerKey }}
                        </h2>
                      </div>
                      <div class="grid grid-cols-3">
                        <!-- Iterate over the items in each nested array -->
                        <div v-for="data in innerGroup" :key="data.device"
                          class="border border-bkg-tertiary border-opacity-60 rounded-[8px] px-6 py-6 flex flex-col gap-2 bg-bkg-primary shadow-sm">
                          <div class="flex justify-between items-center">
                            <div class="flex gap-5 items-center">
                              <!-- Assuming BaseIndicator and SignalIndicator are components or placeholders -->
                              <BaseIndicator :status="data.status" />
                              <h1 class="font-medium text-base sm:text-lg text-label-primary">
                                {{ data.alias }}
                              </h1>
                            </div>
                            <div>
                              <!-- Assuming SignalIndicator is a component for signal strength -->
                              <SignalIndicator :status="data.rssi" />
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
            </div>
          </div>
        </div>
        <div
          class="p-8 bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex-col gap-5 flex">

          <h1 class="text-label-primary text-lg font-semibold">
            Firmware Versions
          </h1>
          <div>
            <div class="py-2 px-4 rounded-md bg-bkg-tertiary w-fit">
              <h1 class="text-label-primary text-md font-medium">
                Gateways
              </h1>
            </div>
            <div class="grid grid-cols-3 gap-6">
              <div class="col-span-2">
                <canvas ref="gatewaysFirmwareVersionBarChartCanvas"></canvas>
              </div>
              <div class="flex flex-col gap-2">
                <div class="custom-select-2">
                  <select name="availableGatewaysFw" id="availableGatewaysFw" v-model="selectedGatewaysFw"
                    @change="selectedGatewaysFwChanged()">
                    <option v-for="fw in availableGatewaysFwVersion" :value="fw">{{ fw }}</option>
                  </select>
                </div>
                <EasyDataTable class="col-span-1" :rows-per-page="10" :rows-items="[10]"
                  table-class-name="customize-table" :headers="header" :items="gatewaysFirmwareVersionTableData"
                  theme-color="#1363df">
                </EasyDataTable>
              </div>
            </div>
          </div>
          <div>
            <div class="py-2 px-4 rounded-md bg-bkg-tertiary w-fit">
              <h1 class="text-label-primary text-md font-medium">
                Nodes
              </h1>
            </div>
            <div class="grid grid-cols-3 gap-6">
              <div class="col-span-2">
                <canvas ref="nodesFirmwareVersionBarChartCanvas"></canvas>
              </div>
              <div class="flex flex-col gap-2">
                <div class="custom-select-2">
                  <select name="availableNodesFw" id="availableNodesFw" v-model="selectedNodesFw"
                    @change="selectedNodesFwChanged()">
                    <option v-for="fw in availableNodesFwVersion" :value="fw">{{ fw }}</option>
                  </select>
                </div>
                <EasyDataTable class="col-span-1" :rows-per-page="10" :rows-items="[10]"
                  table-class-name="customize-table" :headers="header" :items="nodesFirmwareVersionTableData"
                  theme-color="#1363df">
                </EasyDataTable>
              </div>
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
  @apply relative inline-block w-full bg-bkg-secondary border border-label-tertiary rounded-2xl py-[6px] px-4 flex-1
}

.custom-select select {
  font-size: 16px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="%23999" d="M10 12l-5-5h10l-5 5z"/></svg>') no-repeat right 1px center;
  @apply w-full cursor-pointer focus:outline-none text-label-primary
}

.custom-select-2 {
  @apply w-full
}

.custom-select-2 select {
  font-size: 16px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="%23999" d="M10 12l-5-5h10l-5 5z"/></svg>') no-repeat right 10px center;
  @apply w-full cursor-pointer focus:outline-none text-label-primary bg-bkg-secondary border border-label-tertiary rounded-md py-[6px] px-4 font-medium
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  @apply opacity-0 absolute right-0 bg-bkg-secondary rounded-lg z-10 border min-w-[160px] shadow-lg transition-opacity ease-in-out delay-100 duration-300 p-4 flex flex-col gap-1
}

.dropdown:hover>.dropdown-content {
  @apply opacity-100
}


::-webkit-scrollbar {
  width: 0.2em;
}

/* ::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
} */

::-webkit-scrollbar-thumb {
  background-color: #C8C8C8;
  border-radius: 10px;
}
</style>
