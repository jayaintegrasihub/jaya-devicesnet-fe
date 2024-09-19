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
import OfflineDeviceDetail from '@/components/modal/OfflineDeviceDetail.vue'
import { useNodesStore } from '@/stores/master-data/nodes-store'
import { useGatewaysStore } from '@/stores/master-data/gateways-store'

import { Chart, BarElement, BarController, CategoryScale, Decimation, Filler, Legend, Title, Tooltip, PointElement, LineElement, LinearScale } from 'chart.js';
Chart.register(BarElement, BarController, CategoryScale, Decimation, Filler, Legend, Title, Tooltip, PointElement, LineElement, LinearScale)
import { shallowRef } from 'vue'
import router from '@/router'


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
  gatewaysGroupBy.value = []
  nodesGroupBy.value = []
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
const { eventData, isNoGateways, isNoNodes, nodesData, gatewaysData, lastUpdated, isThereOfflineGateway, isThereOfflineNode, offlineGatewaysList, offlineNodesList, telemetryData, totalDevices, totalGateways, totalNodes, totalOffline, totalOnline, onlineGateways, onlineNodes, offlineGateways, offlineNodes } = storeToRefs(useTelemetryStore())
const groupedGatewaysData = ref({})
const gatewaysGroupBy = useLocalStorage('GatewaysGroupBy', [])
const groupedNodesData = ref({})
const nodesGroupBy = useLocalStorage('NodesGroupBy', [])

// Watch for changes in nodesGroupBy
watch(gatewaysGroupBy, async (value) => {
  groupingGatewaysData()
}, { deep: true })

// Watch for changes in nodesGroupBy
watch(nodesGroupBy, async (value) => {
  groupingNodesData()
}, { deep: true })

function groupingGatewaysData() {
  if (gatewaysGroupBy.value.length === 0) {
    groupedGatewaysData.value = gatewaysData.value
  } else {
    groupedGatewaysData.value = nestGroupsBy(gatewaysData.value, gatewaysGroupBy.value)
  }
}

function removeGatewaysGroup(element) {
  const index = gatewaysGroupBy.value.indexOf(element);
  if (index > -1) {
    gatewaysGroupBy.value.splice(index, 1);
  }
}
function groupingNodesData() {
  if (nodesGroupBy.value.length === 0) {
    groupedNodesData.value = nodesData.value
  } else {
    groupedNodesData.value = nestGroupsBy(nodesData.value, nodesGroupBy.value)
  }
}

function removeNodesGroup(element) {
  const index = nodesGroupBy.value.indexOf(element);
  if (index > -1) {
    nodesGroupBy.value.splice(index, 1);
  }
}

async function initTelemetryData() {
  telemetryStore.stopListening()

  if (selectedDeviceType.value === 'All') {
    telemetryStore.startListening(selectedTenant.value, undefined, () => {
      groupingNodesData()
      groupingGatewaysData()
      initTableChartData()
    })
  } else {
    telemetryStore.startListening(selectedTenant.value, selectedDeviceType.value, () => {
      groupingNodesData()
      groupingGatewaysData()
      initTableChartData()
    })
  }

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
  console.log(arr, properties)

  properties = Array.from(properties);
  if (properties.length === 1) {
    return groupBy(arr, properties[0]);
  }
  const property = properties.shift();
  var grouped = groupBy(arr, property);
  for (let key in grouped) {
    grouped[key] = nestGroupsBy(grouped[key], Array.from(properties));
  }
  return grouped
}

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

const tabs = [
  {
    title: 'Card',
    value: 'card',
  },
  {
    title: 'Table',
    value: 'table',
  }
]
const selectedNodesView = useLocalStorage('selectedNodesView', 'card')
const selectedGatewaysView = useLocalStorage('selectedGatewaysView', 'card')

function changeGatewayView(navigation) {
  var subNavs = document.getElementsByClassName("gateway-tab")
  console.log(subNavs)
  for (var i of subNavs) {
    i.classList.remove("active");
  }
  console.log(navigation)
  event.target.className += " active"
  selectedGatewaysView.value = navigation
}

function changeNodeView(navigation) {
  var subNavs = document.getElementsByClassName("node-tab")
  console.log(subNavs)
  for (var i of subNavs) {
    i.classList.remove("active");
  }
  console.log(navigation)
  event.target.className += " active"
  selectedNodesView.value = navigation
}

const gwHeader = [
  { text: "", value: "status", sortable: true, width: 30 },
  { text: "Serial Number", value: "device", sortable: true },
  { text: "Alias", value: "alias", sortable: true },
  { text: "Last Heard", value: "_time", sortable: true },
  { text: "Uptime", value: "uptime", sortable: true },
  { text: "Humidity (%)", value: "humidity", sortable: true },
  { text: "Temperature (C)", value: "temperature", sortable: true },
  { text: "Radio dBm", value: "rssi", sortable: true },
  { text: "Fw. Version", value: "fwVersion", sortable: true },
  { text: "Hw. Version", value: "hwVersion", sortable: true },
  { text: "", value: "operation", width: 50 },
]
const nodeHeader = [
  { text: "", value: "status", sortable: true, width: 30 },
  { text: "Serial Number", value: "device", sortable: true },
  { text: "Conn. Gateway", value: "gateway", sortable: true },
  { text: "Alias", value: "alias", sortable: true },
  { text: "Last Heard", value: "_time", sortable: true },
  { text: "Uptime", value: "uptime", sortable: true },
  { text: "Humidity (%)", value: "humidity", sortable: true },
  { text: "Temperature (C)", value: "temperature", sortable: true },
  { text: "Radio dBm", value: "rssi", sortable: true },
  { text: "Fw. Version", value: "fwVersion", sortable: true },
  { text: "Hw. Version", value: "hwVersion", sortable: true },
  { text: "", value: "operation", width: 50 },
]

const { isDark } = storeToRefs(useThemeStore())
const searchNode = ref('')
const searchGateway = ref('')

// const filteredTelemetryData = computed(() => {
//   if (!searchNode.value.trim()) {
//     return telemetryData.value
//   }
//   const searchTerm = searchNode.value.trim().toLowerCase()
//   return telemetryData.value.filter(telemetry => {
//     return telemetry.alias.toLowerCase().includes(searchTerm) ||
//       telemetry.device.toLowerCase().includes(searchTerm)
//   })
// })


onMounted(async () => {
  renderBarChart()
  await initTenantsList()
  await initTypesList()
  await initTelemetryData()
})

onUnmounted(() => {
  telemetryStore.stopListening()
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

function goToDeviceDetailPage(id) {
  console.log(id)
  router.push({ name: 'deviceDetail', params: { id: id } })
}

function goToGatewayDetailPage(id) {
  console.log(id)
  router.push({ name: 'gatewayDetail', params: { id: id } })
}

// Offline Devices

const gatewayStore = useGatewaysStore()
const { gateway } = storeToRefs(useGatewaysStore())
const nodesStore = useNodesStore()
const { node } = storeToRefs(useNodesStore())
const selectedOfflineDevice = ref('')
const isOfflineDetailPops = ref(false)
const offlineDeviceDetailData = ref({})

async function showOfflineGatewayDetail(id) {
  await gatewayStore.getGateway(id)
  offlineDeviceDetailData.value = gateway.value
  isOfflineDetailPops.value = true
}
async function showOfflineNodeDetail(id) {
  await nodesStore.getNode(id)
  offlineDeviceDetailData.value = node.value
  isOfflineDetailPops.value = true
}
</script>

<template>
  <OfflineDeviceDetail :isOpen="isOfflineDetailPops" @close="isOfflineDetailPops = false"
    :data="offlineDeviceDetailData" :id="selectedOfflineDevice" />
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
              <select class="custom-select-option" name="tenants" id="tenants" v-model="selectedTenant"
                @change="initTelemetryData()">
                <option value="none">none</option>
                <option v-for="tenant in tenants" :value="tenant.name">{{ tenant.name }}</option>
              </select>
            </div>
            <div class="custom-select">
              <h1 class="text-sm text-label-secondary">Device Type</h1>
              <select class="custom-select-option" name="type" id="type" v-model="selectedDeviceType"
                @change="initTypesList()">
                <option value="All">All</option>
                <option v-for="data in types" :value="data.name">{{ data.name }}</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end">
            <p class="text-sm text-label-secondary">Last Updated: {{ lastUpdated }}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div class="bg-bkg-secondary rounded-[24px] p-[2px] grid grid-rows-2">
            <div class="gap-[12px] flex-1 py-[12px] px-[20px] flex flex-col justify-center">
              <div class="flex justify-between">
                <h1 class="text-label-primary text-lg font-semibold">
                  Total Devices
                </h1>
                <img v-if="!isDark" src="../../assets/device-icon.svg" height="30px" width="30px" alt="">
                <img v-if="isDark" src="../../assets/device-icon-white.svg" height="30px" width="30px" alt="">
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
                  <img v-if="!isDark" src="../../assets/gateway-icon.svg" height="24px" width="24px" alt="">
                  <img v-if="isDark" src="../../assets/gateway-icon-white.svg" height="24px" width="24px" alt="">
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
                  <img v-if="!isDark" src="../../assets/node-icon.svg" height="24px" width="24px" alt="">
                  <img v-if="isDark" src="../../assets/node-icon-white.svg" height="24px" width="24px" alt="">
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
          <div v-if="isThereOfflineGateway && !isNoGateways"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-start">
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <p class="text-lg text-label-primary font-semibold">Offline Gateways</p>
              </div>
              <div class="flex flex-col gap-2 h-[280px] overflow-y-auto">
                <div v-for="data in offlineGatewaysList" @click="showOfflineGatewayDetail(data.id)"
                  class="cursor-pointer bg-var-red rounded-[4px] px-[20px] py-[20px] text-white  flex flex-col gap-2 justify-start over">
                  <div class="cursor-pointer flex justify-between">
                    <!-- <p class="text-sm">{{ data.device }}</p> -->
                    <p class="text-xs">Last Heard: {{ data.lastHeard }}</p>
                  </div>
                  <label class="cursor-pointer text-sm font-semibold">{{ data.alias }} - {{ data.device }}</label>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!isThereOfflineGateway && !isNoGateways"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-center">
            <div class="flex flex-col gap-2 h-full">
              <div
                class="border-2 rounded-xl border-dashed border-[#36AE7C] flex justify-center items-center w-full h-full flex-col gap-2">
                <img src="../../assets/smile-icon.svg" alt="" height="120px" width="120px">
                <p class="text-sm text-label-primary font-semibold ">Relax, all your gateways are online!</p>
              </div>
            </div>
          </div>
          <div v-if="isNoGateways"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-center">
            <div class="flex flex-col gap-2 h-full">
              <div
                class="border-2 rounded-xl border-dashed border-[#D9683C] flex justify-center items-center w-full h-full flex-col gap-2">
                <img src="../../assets/oops-icon.svg" alt="" height="120px" width="120px">
                <p class="text-sm text-label-primary font-semibold ">Ooops, seems like you don't have any gateways yet
                </p>
              </div>
            </div>
          </div>
          <!-- nodes -->
          <div v-if="isThereOfflineNode && !isNoNodes"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-start">
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <p class="text-lg text-label-primary font-semibold">Offline Nodes</p>
              </div>
              <div class="flex flex-col gap-2 h-[280px] overflow-y-auto">
                <div v-for="data in offlineNodesList" @click="showOfflineNodeDetail((data.id))"
                  class="cursor-pointer bg-var-red rounded-[4px] px-[20px] py-[20px] text-white  flex flex-col gap-2 justify-start over">
                  <div class="flex justify-between cursor-pointer">
                    <!-- <p class="text-sm">{{ data.device }}</p> -->
                    <p class="text-xs cursor-pointer">Last Heard: {{ data.lastHeard }}</p>
                  </div>
                  <label class="text-sm font-semibold cursor-pointer">{{ data.alias }} - {{ data.device }}</label>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!isThereOfflineNode && !isNoNodes"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-center">
            <div class="flex flex-col gap-2 h-full">
              <div
                class="border-2 rounded-xl border-dashed border-[#36AE7C] flex justify-center items-center w-full h-full flex-col gap-2">
                <img src="../../assets/smile-icon.svg" alt="" height="120px" width="120px">
                <p class="text-sm text-label-primary font-semibold ">Relax, all your nodes are online!</p>
              </div>
            </div>
          </div>
          <div v-if="isNoNodes"
            class="flex-1 p-[20px] bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex flex-col justify-center">
            <div class="flex flex-col gap-2 h-full">
              <div
                class="border-2 rounded-xl border-dashed border-[#D9683C] flex justify-center items-center w-full h-full flex-col gap-2">
                <img src="../../assets/oops-icon.svg" alt="" height="120px" width="120px">
                <p class="text-sm text-label-primary font-semibold ">Ooops, seems like you don't have any nodes yet</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="p-[20px] flex flex-col gap-[20px]">
        <!-- <div class="flex flex-col md:flex-row gap-4 md:justify-between">
          <SearchBar v-model="searchNode" />
        </div> -->
        <div
          class="flex-1 py-8 bg-bkg-primary rounded-[6px] sm:rounded-[24px] shadow border border-bkg-secondary flex-col gap-5 flex">
          <div class="mx-8 grid grid-row gap-4 md:gap-8">
            <div class="flex flex-col gap-10">
              <div class="flex flex-col gap-4">
                <div class="flex gap-4 w-full">
                  <div
                    class="w-full flex justify-between items-center border border-bkg-tertiary border-opacity-60 rounded-[8px] px-6 py-2 gap-2 font-semibold bg-bkg-secondary text-label-primary">
                    <p>
                      Gateways
                    </p>
                    <div class="flex items-center gap-3" v-if="selectedDeviceType !== 'All'">
                      <h1 class="text-label-primary text-sm font-medium">Group By</h1>
                      <div class="flex gap-1">
                        <div @click="removeGatewaysGroup(group)"
                          class="bg-[#E2EBF6] border text-[#3962EB] px-2 py-1 rounded-full cursor-pointer text-xs font-sembold"
                          v-for="group in gatewaysGroupBy">
                          {{ group }}
                        </div>
                      </div>
                      <div class="dropdown">
                        <div class="p-2 rounded-lg cursor-pointer bg-bkg-tertiary">
                          <img v-if="!isDark" src="../../assets/group-icon-white.svg" alt="" height="16px" width="16px">
                          <img v-if="isDark" src="../../assets/group-icon-black.svg" alt="" height="16px" width="16px">
                        </div>
                        <div class="dropdown-content">
                          <div v-for="(option, index) in type.groups" :key="index" class="">
                            <label class="cursor-pointer select-none">
                              <input class="cursor-pointer sr-only peer" type="checkbox" id="" :value="option"
                                v-model="gatewaysGroupBy"
                                :disabled="gatewaysGroupBy.length >= 2 && !gatewaysGroupBy.includes(option)">
                              <div
                                class="font-normal peer-checked:text-[#3962EB] text-sm rounded-lg w-full h-6 bg-bkg-primary peer peer-checked:bg-bkg-tertiary">
                                <p class="h-full flex items-center justify-center ">{{ option }}</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="tab">
                    <button v-for="(tab, index) in tabs" :key="tab.value" @click="changeGatewayView(tab.value)"
                      class="gateway-tab outline-none" :value="index" :id="tab.value"
                      :class="selectedGatewaysView === tab.value ? 'active' : ''">{{ tab.title }}
                    </button>
                  </div>
                </div>
                <div :class="selectedGatewaysView === 'card' ? '' : 'hidden'">
                  <div v-if="gatewaysGroupBy.length === 0"
                    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[800px] overflow-y-scroll overflow-x-visible min-h-[200px]-[200px] pb-2">
                    <div
                      class="cursor-pointer hover:shadow-sm hover:opacity-80 border border-bkg-tertiary border-opacity-60 rounded-[16px] px-6 py-6 flex flex-col gap-2 transition-transform delay-75 duration-200 h-fit "
                      v-for="data in gatewaysData" @click="goToGatewayDetailPage(data.device)">
                      <a :href="`/device-detail/${data.device}`" target="_blank" @click.prevent>

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
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                              <div class="flex flex-col gap-1">
                                <p class="text-label-primary font-medium opacity-80 ">Last Heard:</p>
                                <p class="text-label-primary font-semibold opacity-90">{{ data._time }}</p>
                              </div>
                              <div class="dropdown">
                                <img src="../../assets/info-icon.svg" alt="" height="14px" width="14px"
                                  class="cursor-pointer">
                                <div class="dropdown-content w-full">
                                  {{ data.lastHeard }} ago
                                </div>
                              </div>
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
                      </a>
                    </div>
                  </div>

                  <div v-if="gatewaysGroupBy.length == 1" v-for="( value, key ) in groupedGatewaysData"
                    class="flex flex-col gap-4">
                    <div class="px-6 py-2 bg-bkg-secondary rounded-[8px]">
                      <h1 class="text-label-primary font-semibold">
                        {{ gatewaysGroupBy[0] }} {{ key }}
                      </h1>
                    </div>
                    <div
                      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[800px] overflow-y-scroll overflow-x-visible min-h-[200px]-[200px] pb-2">
                      <div
                        class="cursor-pointer hover:shadow-sm hover:opacity-80 border border-bkg-tertiary border-opacity-60 rounded-[16px] px-6 py-6 flex flex-col gap-2 transition-transform delay-75 duration-200 h-fit "
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
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                              <div class="flex flex-col gap-1">
                                <p class="text-label-primary font-medium opacity-80 ">Last Heard:</p>
                                <p class="text-label-primary font-semibold opacity-90">{{ data._time }}</p>
                              </div>
                              <div class="dropdown">
                                <img src="../../assets/info-icon.svg" alt="" height="14px" width="14px"
                                  class="cursor-pointer">
                                <div class="dropdown-content w-full">
                                  {{ data.lastHeard }} ago
                                </div>
                              </div>
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

                  <div v-if="gatewaysGroupBy.length > 1" class="flex flex-col gap-4">
                    <div v-for="(outerGroup, outerKey) in groupedGatewaysData" :key="outerKey"
                      class="rounded-[16px] bg-bkg-secondary p-[10px] flex flex-col gap-4 max-h-[800px] min-h-[200px] overflow-y-scroll overflow-x-visible">
                      <div class="p-[6px]">
                        <h1 class="text-label-primary font-semibold text-normal">
                          {{ gatewaysGroupBy[0] }} {{ outerKey }}
                        </h1>
                      </div>
                      <div v-for="(innerGroup, innerKey) in outerGroup" :key="innerKey"
                        class="bg-bkg-primary p-[10px] rounded-[11px] border border-bkg-tertiary">
                        <div class="p-[6px]">
                          <h2 class="text-label-primary font-medium text-normal">
                            {{ gatewaysGroupBy[1] }} {{ innerKey }}
                          </h2>
                        </div>
                        <div class="grid grid-cols-3">
                          <div v-for="data in innerGroup" :key="data.device"
                            class="cursor-pointer hover:shadow-sm hover:opacity-80 border border-bkg-tertiary border-opacity-60 rounded-[16px] px-6 py-6 flex flex-col gap-2 transition-transform delay-75 duration-200 h-fit ">
                            <div class="flex justify-between items-center">
                              <div class="flex gap-5 items-center">
                                <BaseIndicator :status="data.status" />
                                <h1 class="font-medium text-base sm:text-lg text-label-primary">
                                  {{ data.alias }}
                                </h1>
                              </div>
                              <div>
                                <SignalIndicator :status="data.rssi" />
                              </div>
                            </div>
                            <div class="grid grid-cols-1 xl:grid-cols-2 justify-between">
                              <div class="flex flex-col gap-1">
                                <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                                  <p class="font-medium text-label-primary opacity-80">SN:</p>
                                  <h2 class="font-semibold text-label-primary opacity-90">{{ data.device }}</h2>
                                </div>
                                <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                                  <div class="flex flex-col gap-1">
                                    <p class="text-label-primary font-medium opacity-80 ">Last Heard:</p>
                                    <p class="text-label-primary font-semibold opacity-90">{{ data._time }}</p>
                                  </div>
                                  <div class="dropdown">
                                    <img src="../../assets/info-icon.svg" alt="" height="14px" width="14px"
                                      class="cursor-pointer">
                                    <div class="dropdown-content w-full">
                                      {{ data.lastHeard }} ago
                                    </div>
                                  </div>
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
                <div :class="selectedGatewaysView === 'table' ? '' : 'hidden'" class="flex flex-col gap-4">
                  <div class="w-fit">
                    <SearchBar class="outlined" v-model="searchGateway" placeholder="Search by SN, alias ..." />
                  </div>
                  <EasyDataTable fixed-expand :rows-per-page="25" table-class-name="customize-table" :headers="gwHeader"
                    :items="gatewaysData" theme-color="#1363df" :search-value="searchGateway" sort-by="status">
                    <template #item-status="item">
                      <div class="w-full flex justify-center">
                        <BaseIndicator :status="item.status" />
                      </div>
                    </template>
                  </EasyDataTable>
                </div>
              </div>
              <div class="flex flex-col gap-4">
                <div class="flex gap-4 w-full">
                  <div
                    class="w-full flex justify-between items-center border border-bkg-tertiary border-opacity-60 rounded-[8px] px-6 py-2 gap-2 font-semibold bg-bkg-secondary text-label-primary">
                    <p>
                      Nodes
                    </p>
                    <div class="flex items-center gap-3" v-if="selectedDeviceType !== 'All'">
                      <h1 class="text-label-primary text-sm font-medium">Group By</h1>
                      <div class="flex gap-1">
                        <div @click="removeNodesGroup(group)"
                          class="bg-[#E2EBF6] border text-[#3962EB] px-2 py-1 rounded-full cursor-pointer text-xs font-sembold"
                          v-for="group in nodesGroupBy">
                          {{ group }}
                        </div>
                      </div>
                      <div class="dropdown">
                        <div class="p-2 rounded-lg cursor-pointer bg-bkg-tertiary">
                          <img v-if="!isDark" src="../../assets/group-icon-white.svg" alt="" height="16px" width="16px">
                          <img v-if="isDark" src="../../assets/group-icon-black.svg" alt="" height="16px" width="16px">
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
                  </div>
                  <div class="tab">
                    <button v-for="(tab, index) in tabs" :key="tab.value" @click="changeNodeView(tab.value)"
                      class="node-tab outline-none" :value="index" :id="tab.value"
                      :class="selectedNodesView === tab.value ? 'active' : ''">{{ tab.title }}
                    </button>
                  </div>
                </div>
                <div :class="selectedNodesView === 'card' ? '' : 'hidden'">
                  <div v-if="nodesGroupBy.length === 0"
                    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[800px] overflow-y-scroll overflow-x-visible min-h-[200px]-[200px] pb-2">
                    <div @click="goToDeviceDetailPage(data.device)"
                      class="border border-bkg-tertiary border-opacity-60 rounded-[16px] px-6 py-6 flex flex-col gap-2 cursor-pointer hover:shadow-sm hover:opacity-80 transition-transform delay-75 duration-200 h-fit "
                      v-for="data in nodesData">
                      <a :href="`/device-detail/${data.device}`" target="_blank" @click.prevent>
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
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                              <div class="flex flex-col gap-1">
                                <p class="text-label-primary font-medium opacity-80 ">Last Heard:</p>
                                <p class="text-label-primary font-semibold opacity-90">{{ data._time }}</p>
                              </div>
                              <div class="dropdown">
                                <img src="../../assets/info-icon.svg" alt="" height="14px" width="14px"
                                  class="cursor-pointer">
                                <div class="dropdown-content w-full">
                                  {{ data.lastHeard }} ago
                                </div>
                              </div>
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
                              <p class="text-label-primary font-medium opacity-80">Gateway:</p>
                              <p class="text-label-primary font-semibold opacity-90">{{ data.gateway }}</p>
                            </div>
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
                      </a>
                    </div>
                  </div>

                  <div v-if="nodesGroupBy.length == 1" v-for="( value, key ) in groupedNodesData"
                    class="flex flex-col gap-4 mb-10">
                    <div class="px-6 py-2 bg-bkg-secondary rounded-[8px]">
                      <h1 class="text-label-primary font-semibold">
                        {{ nodesGroupBy[0] }} {{ key }}
                      </h1>
                    </div>
                    <div
                      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[800px] overflow-y-scroll overflow-x-visible min-h-[200px]-[200px] pb-2">
                      <div @click="goToDeviceDetailPage(data.device)"
                        class="border border-bkg-tertiary border-opacity-60 rounded-[16px] px-6 py-6 flex flex-col gap-2 cursor-pointer hover:shadow-sm hover:opacity-80 transition-transform delay-75 duration-200 h-fit "
                        v-for="data in value">
                        <a :href="`/device-detail/${data.device}`" target="_blank" @click.prevent>
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
                              <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                                <div class="flex flex-col gap-1">
                                  <p class="text-label-primary font-medium opacity-80 ">Last Heard:</p>
                                  <p class="text-label-primary font-semibold opacity-90">{{ data._time }}</p>
                                </div>
                                <div class="dropdown">
                                  <img src="../../assets/info-icon.svg" alt="" height="14px" width="14px"
                                    class="cursor-pointer">
                                  <div class="dropdown-content w-full">
                                    {{ data.lastHeard }} ago
                                  </div>
                                </div>
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
                        </a>
                      </div>
                    </div>
                  </div>

                  <div v-if="nodesGroupBy.length > 1" class="flex flex-col gap-4">
                    <div v-for="(outerGroup, outerKey) in groupedNodesData" :key="outerKey"
                      class="rounded-[16px] bg-bkg-secondary p-[10px] flex flex-col gap-4 max-h-[800px] min-h-[200px] overflow-y-scroll overflow-x-visible">
                      <div class="p-[6px]">
                        <h1 class="text-label-primary font-semibold text-normal">
                          {{ nodesGroupBy[0] }} {{ outerKey }}
                        </h1>
                      </div>
                      <div v-for="(innerGroup, innerKey) in outerGroup" :key="innerKey"
                        class="bg-bkg-primary p-[10px] rounded-[11px] border border-bkg-tertiary">
                        <div class="p-[6px]">
                          <h2 class="text-label-primary font-medium text-normal">
                            {{ nodesGroupBy[1] }} {{ innerKey }}
                          </h2>
                        </div>
                        <div class="grid grid-cols-3">
                          <div v-for="data in innerGroup" :key="data.device" @click="goToDeviceDetailPage(data.device)"
                            class="border border-bkg-tertiary border-opacity-60 rounded-[16px] px-6 py-6 flex flex-col gap-2 cursor-pointer hover:shadow-sm hover:opacity-80 transition-transform delay-75 duration-200 h-fit ">
                            <a :href="`/device-detail/${data.device}`" target="_blank" @click.prevent>

                              <div class="flex justify-between items-center">
                                <div class="flex gap-5 items-center">
                                  <BaseIndicator :status="data.status" />
                                  <h1 class="font-medium text-base sm:text-lg text-label-primary">
                                    {{ data.alias }}
                                  </h1>
                                </div>
                                <div>
                                  <SignalIndicator :status="data.rssi" />
                                </div>
                              </div>
                              <div class="grid grid-cols-1 xl:grid-cols-2 justify-between">
                                <div class="flex flex-col gap-1">
                                  <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                                    <p class="font-medium text-label-primary opacity-80">SN:</p>
                                    <h2 class="font-semibold text-label-primary opacity-90">{{ data.device }}</h2>
                                  </div>
                                  <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                                    <div class="flex flex-col gap-1">
                                      <p class="text-label-primary font-medium opacity-80 ">Last Heard:</p>
                                      <p class="text-label-primary font-semibold opacity-90">{{ data._time }}</p>
                                    </div>
                                    <div class="dropdown">
                                      <img src="../../assets/info-icon.svg" alt="" height="14px" width="14px"
                                        class="cursor-pointer">
                                      <div class="dropdown-content w-full">
                                        {{ data.lastHeard }} ago
                                      </div>
                                    </div>
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
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div :class="selectedNodesView === 'table' ? '' : 'hidden'" class="flex flex-col gap-4">
                  <div class="w-fit">
                    <SearchBar class="outlined" v-model="searchNode" placeholder="Search by SN, alias ..." />
                  </div>
                  <EasyDataTable fixed-expand :rows-per-page="25" table-class-name="customize-table"
                    :headers="nodeHeader" :items="nodesData" theme-color="#1363df" :search-value="searchNode"
                    sort-by="status">
                    <template #item-status="item">
                      <div class="w-full flex justify-center">
                        <BaseIndicator :status="item.status" />
                      </div>
                    </template>
                    <template #item-operation="item">
                      <svg class="cursor-pointer" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg" @click="goToDeviceDetailPage(item.device)">
                        <path d="M13 7H22V9H13V7ZM13 15H22V17H13V15ZM16 11H22V13H16V11ZM13 12L8 7V11H2V13H8V17L13 12Z"
                          fill="#353535" fill-opacity="0.6" />
                      </svg>
                    </template>
                  </EasyDataTable>
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

.custom-select-option {
  @apply outline-none text-[10px] md:text-[12px] text-label-secondary pb-[6px] px-2 rounded-lg cursor-pointer md:min-w-[200px]
}

.custom-select-option option {
  @apply p-2 cursor-pointer bg-bkg-secondary
}


.custom-select {
  @apply relative inline-block w-full bg-bkg-secondary hover:bg-bkg-tertiary border border-label-tertiary rounded-2xl pt-[6px] px-4 flex-1
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

/* option {
  @apply bg-bkg-primary
} */

.info-wrapper {
  position: relative;
  display: inline-block;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  @apply opacity-0 flex flex-col gap-1 invisible absolute left-0 bg-bkg-secondary rounded-lg z-10 border min-w-[180px] shadow-lg transition-opacity ease-in-out delay-100 duration-300 p-4
}


.dropdown:hover>.dropdown-content {
  @apply opacity-100 visible
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


.tab {
  @apply flex justify-between w-fit rounded-lg shadow-inner p-1 bg-bkg-secondary gap-2
}

button {
  @apply disabled:opacity-75 flex justify-center items-center relative text-label-primary cursor-pointer py-[4px] rounded-md w-[full] text-[10px] sm:text-[12px] font-medium px-6
}

button:hover {
  @apply bg-bkg-primary text-label-primary transition-colors duration-700
}

.active {
  @apply bg-bkg-primary text-label-primary transition-colors duration-300
}

.active:hover {
  @apply bg-bkg-primary text-label-primary transition-colors duration-300 cursor-default
}
</style>
