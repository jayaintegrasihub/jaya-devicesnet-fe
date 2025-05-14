<script setup>
import OfflineDeviceDetail from '@/components/modal/OfflineDeviceDetail.vue'
import router from '@/router'
import { useNodesStore } from '@/stores/master-data/nodes-store'
import { useTelemetryStore } from '@/stores/telemetry/telemetry-store'
import { useThemeStore } from '@/stores/theme'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const { isDark } = storeToRefs(useThemeStore())
const selectedTenant = useLocalStorage('SelectedTenant', '')
const selectedDeviceType = useLocalStorage('SelectedDeviceType', 'All')

const telemetryStore = useTelemetryStore()
const nodesStore = useNodesStore()
const { node } = storeToRefs(useNodesStore())
const { offlineNodesList, lastUpdated } = storeToRefs(useTelemetryStore())
const selectedOfflineDevice = ref('')
const offlineDeviceDetailData = ref({})
const isOfflineDetailPops = ref(false)
const selectedGroupBy = ref([])
const nodesOfflineGroupBy = ref([])
const filterType = ref('filter')
const filterMenu = ref(null);
const showFilterby = ref(false)
const dataWithFilter = ref([])
const filters = ref([
  { searchby: '', value: '' }
])
const filterbyOptions = ['Division', 'Floor', 'MachineType', 'Tray']
const isFiltering = ref(false)

function goBack() {
  router.go(-1)
}

async function showOfflineNodeDetail(id) {
  await nodesStore.getNode(id)
  offlineDeviceDetailData.value = node.value
  isOfflineDetailPops.value = true
}

async function initTelemetryData() {
  telemetryStore.stopListening()

  if (selectedDeviceType.value === 'All') {
    telemetryStore.startListening(selectedTenant.value, undefined, () => {})
  } else {
    telemetryStore.startListening(selectedTenant.value, selectedDeviceType.value, () => {})
  }
}

onMounted(() => {
  initTelemetryData()
  document.addEventListener('click', handleClickOutside);
})

onUnmounted(() => {
  telemetryStore.stopListening()
  document.removeEventListener('click', handleClickOutside);
})


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

function removeGroupby(data) {
  const index = selectedGroupBy.value.findIndex(item => item === data);
  if (index !== -1) {
    selectedGroupBy.value.splice(index, 1);
  }

  if (selectedGroupBy.value.length === 0) {
    nodesOfflineGroupBy.value = [];
    isFiltering.value = false;
  } else {
    const dataGroup = groupByMultiple(offlineNodesList.value, selectedGroupBy.value);
    nodesOfflineGroupBy.value = dataGroup
    isFiltering.value = true;
  }
}

watch([offlineNodesList], ()=> {
  if(filterType.value === "filter") {
    filterAction()
  }else {
    if (selectedGroupBy.value.length === 0) {
      nodesOfflineGroupBy.value = []
      isFiltering.value = false
    } else {
      const dataGroup = groupByMultiple(offlineNodesList.value, selectedGroupBy.value)
      nodesOfflineGroupBy.value = dataGroup

      console.log(dataGroup)
      isFiltering.value = true
    }
  }
})

function changefilterType(){
  if(filterType.value === "filter") {
    filterType.value = "groupby"
  }else {
    filterType.value = "filter"
  }

  dataWithFilter.value = []
  nodesOfflineGroupBy.value = []
  isFiltering.value = false
}

function groupByMultiple(array, keys) {
  if (keys.length === 0) return array

  const [firstKey, ...restKeys] = keys

  const grouped = array.reduce((acc, obj) => {
    const rawGroupKey = obj[firstKey];

    let groupKey = rawGroupKey;
    if (firstKey === 'Floor' && rawGroupKey != null) {
      groupKey = `Floor ${rawGroupKey}`;
    } else if (rawGroupKey == null) {
      groupKey = 'Unknown';
    }

    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(obj)
    return acc
  }, {})

  return Object.entries(grouped).map(([group, items]) => ({
    group,
    items: groupByMultiple(items, restKeys) // <== REKURSIF
  }))
}

function changeGroupby(data) {
  const index = selectedGroupBy.value.findIndex(item => item === data)

  if (index !== -1) {
    selectedGroupBy.value.splice(index, 1)
  } else {
    if (selectedGroupBy.value.length >= 2) {
      selectedGroupBy.value.shift()
    }
    selectedGroupBy.value.push(data)
  }

  if (selectedGroupBy.value.length === 0) {
    nodesOfflineGroupBy.value = []
    isFiltering.value = false
  } else {
    const dataGroup = groupByMultiple(offlineNodesList.value, selectedGroupBy.value)
    nodesOfflineGroupBy.value = dataGroup

    console.log(dataGroup)
    isFiltering.value = true
  }
}


function isOptionDisabled(option, currentIndex) {
  return filters.value.some((filter, idx) => filter.searchby === option && idx !== currentIndex);
}

function showfilterfunction() {
  showFilterby.value = !showFilterby.value
}

function handleClickOutside(event) {
  if (filterMenu.value && !filterMenu.value.contains(event.target)) {
    showFilterby.value = false;
  }
};

function  deleteFilter(event, index) {
  event.stopPropagation()

  if (filters.value.length === 1) {
    filters.value[0].searchby = '';
    filters.value[0].value = '';
  } else {
    filters.value.splice(index, 1);
  }
}

function addFilter() {
  filters.value.push({ searchby: '', value: '' });
}

function multipleFilter(data, filters) {
  return data.filter(item => {
    return filters.every(filter => {
      return String(item[filter.searchby]) === String(filter.value)
    })
  })
}

function filterAction(){
  const hasValidFilter = filters.value.some(f => f.searchby && f.value);

  if (hasValidFilter) {
    const dataFilter = multipleFilter(offlineNodesList.value, filters.value);
    dataWithFilter.value = dataFilter
    isFiltering.value = true
  } else {
    dataWithFilter.value = [];
    isFiltering.value = false
  }
}

</script>
<template>
  <OfflineDeviceDetail
    :isOpen="isOfflineDetailPops"
    @close="isOfflineDetailPops = false"
    :data="offlineDeviceDetailData"
    :id="selectedOfflineDevice"
  />
  <div class="flex">
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
          <p class="text-label-primary select-none">Offline Nodes</p>
        </div>
      </TopBar>
      <div class="flex justify-end mx-[25px] mt-5">
        <p class="text-sm text-label-secondary">Last Updated: {{ lastUpdated }}</p>
      </div>
      <div
        class="m-[20px] flex-1 py-8 bg-bkg-primary rounded-[10px] shadow border border-bkg-secondary flex-col gap-5 flex"
      >
        <div class="mx-8 grid grid-row gap-4 md:gap-8">
          <div class="flex flex-col gap-10">
            <div class="flex flex-col gap-4">
              <div class="flex gap-4 w-full">
                <div
                  class="w-full flex justify-between items-center border border-bkg-tertiary border-opacity-60 rounded-[8px] px-6 py-2 gap-2 font-semibold bg-bkg-secondary text-label-primary"
                >
                  <p>Offline Nodes <span v-if="nodesOfflineGroupBy.length === 0">({{ filters.some(f => f.searchby && f.value) ? dataWithFilter.length : offlineNodesList.length }})</span></p>
                  <div class="flex items-center gap-3">
                    <div class="dropdown">
                      <div class="p-2 rounded-lg cursor-pointer bg-bkg-tertiary" @click="changefilterType()">
                        <img
                          v-if="!isDark"
                          src="../../../assets/switch-icon-black.svg"
                          alt=""
                          height="16px"
                          width="16px"
                        />
                        <img
                          v-if="isDark"
                          src="../../../assets/switch-icon-white.svg"
                          alt=""
                          height="16px"
                          width="16px"
                        />
                      </div>
                      <div class="text-label-primary tooltip-content text-sm font-normal" style="top: -45px; left: 20px">
                        Switch Filter
                      </div>
                    </div>
                    <div v-if="filterType === 'filter'" class="flex items-center gap-3" ref="filterMenu" >
                      <h1 class="text-label-primary text-sm font-medium">Filter By</h1>
                      <div class="dropdown">
                        <div class="p-2 rounded-lg cursor-pointer bg-bkg-tertiary" @click="showfilterfunction()">
                          <img
                            v-if="!isDark"
                            src="../../../assets/group-icon-white.svg"
                            alt=""
                            height="16px"
                            width="16px"
                          />
                          <img
                            v-if="isDark"
                            src="../../../assets/group-icon-black.svg"
                            alt=""
                            height="16px"
                            width="16px"
                          />
                        </div>
                        <div :class="showFilterby ? '!opacity-100 !visible' : ''"  class="filter-content"  style="left: -450px; min-width: 300px;">
                          <div v-for="(filter, index) in filters" :key="index" class="flex items-center gap-2 mb-2">
                            <select v-model="filter.searchby" class="border p-2 rounded">
                              <option disabled value="">Choose Search By</option>
                              <option 
                                v-for="option in filterbyOptions" 
                                :key="option" 
                                :value="option"
                                :disabled="isOptionDisabled(option, index)"
                              >
                                {{ option }}
                              </option>
                            </select>
                            <input v-model="filter.value" placeholder="Enter value" class="border p-2 rounded flex-1" />
                            <div class="p-2 rounded-lg cursor-pointer bg-bkg-tertiary" @click="deleteFilter($event, index)">
                              <svg class="cursor-pointer hover:scale-110 transition-transform duration-200" width="24" height="24"
                                viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M8.4375 4.3125H8.25C8.35313 4.3125 8.4375 4.22813 8.4375 4.125V4.3125H15.5625V4.125C15.5625 4.22813 15.6469 4.3125 15.75 4.3125H15.5625V6H17.25V4.125C17.25 3.29766 16.5773 2.625 15.75 2.625H8.25C7.42266 2.625 6.75 3.29766 6.75 4.125V6H8.4375V4.3125ZM20.25 6H3.75C3.33516 6 3 6.33516 3 6.75V7.5C3 7.60313 3.08437 7.6875 3.1875 7.6875H4.60312L5.18203 19.9453C5.21953 20.7445 5.88047 21.375 6.67969 21.375H17.3203C18.1219 21.375 18.7805 20.7469 18.818 19.9453L19.3969 7.6875H20.8125C20.9156 7.6875 21 7.60313 21 7.5V6.75C21 6.33516 20.6648 6 20.25 6ZM17.1398 19.6875H6.86016L6.29297 7.6875H17.707L17.1398 19.6875Z"
                                  fill="#ED424F" fill-opacity="0.8" />
                              </svg>
                            </div>
                          </div>

                          <div class="flex gap-3 mt-2 justify-end align-center">
                            <button @click="addFilter" :disabled="filters.length === 4" :class="filters.length === 4 && 'text-[#aaaaaa]'" class="text-sm hover:bg-var-softblue hover:text-white px-2 py-1 rounded-md">Add Filter</button>
                            <button @click="filterAction" class="text-sm hover:bg-var-softblue hover:text-white px-2 py-1 rounded-md">Confirm</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="filterType === 'groupby'" class="flex items-center gap-3">
                      <h1 class="text-label-primary text-sm font-medium">Group By</h1>
                      <div class="flex gap-1">
                        <div
                          @click="removeGroupby(data)"
                          v-if="selectedGroupBy.length !== 0"
                          v-for="data in selectedGroupBy"
                          class="bg-[#E2EBF6] border text-[#3962EB] px-2 py-1 rounded-full cursor-pointer text-xs font-sembold"
                        >
                          {{ data }}
                        </div>
                      </div>
                      <div class="dropdown">
                        <div class="p-2 rounded-lg cursor-pointer bg-bkg-tertiary">
                          <img
                            v-if="!isDark"
                            src="../../../assets/group-icon-white.svg"
                            alt=""
                            height="16px"
                            width="16px"
                          />
                          <img
                            v-if="isDark"
                            src="../../../assets/group-icon-black.svg"
                            alt=""
                            height="16px"
                            width="16px"
                          />
                        </div>
                        <div class="dropdown-content" style="left: -100px">
                          <div v-for="(data, index) in filterbyOptions" :key="index" class="">
                            <label class="cursor-pointer select-none">
                              <div
                                :class="
                                  selectedGroupBy === data && 'text-[#3962EB] bg-bkg-tertiary'
                                "
                                class="font-normal text-sm rounded-lg w-full h-6 bg-bkg-primary"
                                @click="changeGroupby(data)"
                              >
                                <p class="h-full flex items-center justify-center">
                                  {{ data }}
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div v-if="!isFiltering">
                  <div
                    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[800px] overflow-y-scroll overflow-x-visible min-h-[200px]-[200px] pb-2"
                  >
                    <div
                      v-for="(data, index) in offlineNodesList"
                      @click="showOfflineNodeDetail(data.id)"
                      :key="index"
                      class="cursor-pointer bg-var-red rounded-[4px] px-[20px] py-[20px] text-white flex flex-col gap-2 justify-start over"
                    >
                      <div class="flex justify-between cursor-pointer">
                        <!-- <p class="text-sm">{{ data.device }}</p> -->
                        <p class="text-xs cursor-pointer">Last Heard: {{ data.lastHeard }}</p>
                      </div>
                      <label class="text-sm font-semibold cursor-pointer"
                        >{{ data.alias }} - {{ data.device }}</label
                      >
                      <div class="grid grid-cols-1 xl:grid-cols-2 justify-between">
                        <div class="flex flex-col gap-1">
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Humidity:</p>
                            <p class="font-semibold opacity-90">{{ data.humidity }}%</p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Temperature:</p>
                            <p class="font-semibold opacity-90">{{ data.temperature }}°C</p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                            <div class="flex flex-col gap-1">
                              <p class="font-medium opacity-80">Reset Reason</p>
                              <p class="font-semibold opacity-90">
                                {{ getResetTitle(data.resetReason) }}
                              </p>
                            </div>
                            <div class="dropdown">
                              <img
                                src="../../../assets/info-icon.svg"
                                alt=""
                                height="14px"
                                width="14px"
                                class="cursor-pointer"
                              />
                              <div class="text-label-primary dropdown-content w-full">
                                {{ getResetReasonDescription(data.resetReason) }}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="flex flex-col gap-1">
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Fw Version:</p>
                            <p class="font-semibold opacity-90">
                              {{ data.fwVersion }}
                            </p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Hw Version:</p>
                            <p class="font-semibold opacity-90">
                              {{ data.hwVersion }}
                            </p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Lora dBm:</p>
                            <p class="font-semibold opacity-90">
                              {{ data.rssi }}
                            </p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Uptime:</p>
                            <p class="font-semibold opacity-90">
                              {{ data.uptime }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="dataWithFilter.length > 0">
                  <div
                    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[800px] overflow-y-scroll overflow-x-visible min-h-[200px]-[200px] pb-2"
                  >
                    <div
                      v-for="(data, index) in dataWithFilter"
                      @click="showOfflineNodeDetail(data.id)"
                      :key="index"
                      class="cursor-pointer bg-var-red rounded-[4px] px-[20px] py-[20px] text-white flex flex-col gap-2 justify-start over"
                    >
                      <div class="flex justify-between cursor-pointer">
                        <!-- <p class="text-sm">{{ data.device }}</p> -->
                        <p class="text-xs cursor-pointer">Last Heard: {{ data.lastHeard }}</p>
                      </div>
                      <label class="text-sm font-semibold cursor-pointer"
                        >{{ data.alias }} - {{ data.device }}</label
                      >
                      <div class="grid grid-cols-1 xl:grid-cols-2 justify-between">
                        <div class="flex flex-col gap-1">
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Humidity:</p>
                            <p class="font-semibold opacity-90">{{ data.humidity }}%</p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Temperature:</p>
                            <p class="font-semibold opacity-90">{{ data.temperature }}°C</p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                            <div class="flex flex-col gap-1">
                              <p class="font-medium opacity-80">Reset Reason</p>
                              <p class="font-semibold opacity-90">
                                {{ getResetTitle(data.resetReason) }}
                              </p>
                            </div>
                            <div class="dropdown">
                              <img
                                src="../../../assets/info-icon.svg"
                                alt=""
                                height="14px"
                                width="14px"
                                class="cursor-pointer"
                              />
                              <div class="text-label-primary dropdown-content w-full">
                                {{ getResetReasonDescription(data.resetReason) }}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="flex flex-col gap-1">
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Fw Version:</p>
                            <p class="font-semibold opacity-90">
                              {{ data.fwVersion }}
                            </p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Hw Version:</p>
                            <p class="font-semibold opacity-90">
                              {{ data.hwVersion }}
                            </p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Lora dBm:</p>
                            <p class="font-semibold opacity-90">
                              {{ data.rssi }}
                            </p>
                          </div>
                          <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                            <p class="font-medium opacity-80">Uptime:</p>
                            <p class="font-semibold opacity-90">
                              {{ data.uptime }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="selectedGroupBy.length == 1">
                  <div
                    v-for="(value, key) in nodesOfflineGroupBy"
                    class="flex flex-col gap-4 mb-10"
                    :key="key"
                  >
                    <div class="px-6 py-2 bg-bkg-secondary rounded-[8px] flex align-center justify-between">
                      <h1 class="text-label-primary font-semibold ">
                        {{ value.group }}
                      </h1>
                      <h1 class="text-label-primary font-semibold ">
                        ({{ value.items.length }})
                      </h1>
                    </div>
                    <div
                      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[800px] overflow-y-scroll overflow-x-visible min-h-[200px]-[200px] pb-2"
                    >
                      <div
                        v-for="(data, index) in value.items"
                        @click="showOfflineNodeDetail(data.id)"
                        :key="index"
                        class="cursor-pointer bg-var-red rounded-[4px] px-[20px] py-[20px] text-white flex flex-col gap-2 justify-start over"
                      >
                        <div class="flex justify-between cursor-pointer">
                          <!-- <p class="text-sm">{{ data.device }}</p> -->
                          <p class="text-xs cursor-pointer">Last Heard: {{ data.lastHeard }}</p>
                        </div>
                        <label class="text-sm font-semibold cursor-pointer"
                          >{{ data.alias }} - {{ data.device }}</label
                        >
                        <div class="grid grid-cols-1 xl:grid-cols-2 justify-between">
                          <div class="flex flex-col gap-1">
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                              <p class="font-medium opacity-80">Humidity:</p>
                              <p class="font-semibold opacity-90">{{ data.humidity }}%</p>
                            </div>
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                              <p class="font-medium opacity-80">Temperature:</p>
                              <p class="font-semibold opacity-90">{{ data.temperature }}°C</p>
                            </div>
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                              <div class="flex flex-col gap-1">
                                <p class="font-medium opacity-80">Reset Reason</p>
                                <p class="font-semibold opacity-90">
                                  {{ getResetTitle(data.resetReason) }}
                                </p>
                              </div>
                              <div class="dropdown">
                                <img
                                  src="../../../assets/info-icon.svg"
                                  alt=""
                                  height="14px"
                                  width="14px"
                                  class="cursor-pointer"
                                />
                                <div class="text-label-primary dropdown-content w-full">
                                  {{ getResetReasonDescription(data.resetReason) }}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div class="flex flex-col gap-1">
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                              <p class="font-medium opacity-80">Fw Version:</p>
                              <p class="font-semibold opacity-90">
                                {{ data.fwVersion }}
                              </p>
                            </div>
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                              <p class="font-medium opacity-80">Hw Version:</p>
                              <p class="font-semibold opacity-90">
                                {{ data.hwVersion }}
                              </p>
                            </div>
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                              <p class="font-medium opacity-80">Lora dBm:</p>
                              <p class="font-semibold opacity-90">
                                {{ data.rssi }}
                              </p>
                            </div>
                            <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                              <p class="font-medium opacity-80">Uptime:</p>
                              <p class="font-semibold opacity-90">
                                {{ data.uptime }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="selectedGroupBy.length > 1" class="flex flex-col gap-4">
                  <div
                    v-for="(outerGroup, outerKey) in nodesOfflineGroupBy"
                    :key="outerKey"
                    class="rounded-[16px] bg-bkg-secondary p-[10px] flex flex-col gap-4 max-h-[800px] min-h-[200px] overflow-y-scroll overflow-x-visible"
                  >
                    <div class="p-[6px] flex align-center justify-between">
                      <h1 class="text-label-primary font-semibold text-normal">
                        ({{ outerGroup.group }})
                      </h1>
                      <h1 class="text-label-primary font-semibold text-normal">
                        ({{ outerGroup.items.length }})
                      </h1>
                    </div>
                    <div
                      v-for="(innerGroup, innerKey) in outerGroup.items"
                      :key="innerKey"
                      class="bg-bkg-primary p-[10px] rounded-[11px] border border-bkg-tertiary"
                    >
                      <div class="p-[6px] flex align-center justify-between">
                        <h1 class="text-label-primary font-semibold text-normal">
                          ({{ innerGroup.group }})
                        </h1>
                        <h1 class="text-label-primary font-semibold text-normal">
                          ({{ innerGroup.items.length }})
                        </h1>
                      </div>
                      <div class="grid grid-cols-3 gap-2">
                        <div
                          v-for="(data, index) in innerGroup.items"
                          @click="showOfflineNodeDetail(data.id)"
                          :key="index"
                          class="cursor-pointer bg-var-red rounded-[4px] px-[20px] py-[20px] text-white flex flex-col gap-2 justify-start over"
                        >
                          <div class="flex justify-between cursor-pointer">
                            <!-- <p class="text-sm">{{ data.device }}</p> -->
                            <p class="text-xs cursor-pointer">Last Heard: {{ data.lastHeard }}</p>
                          </div>
                          <label class="text-sm font-semibold cursor-pointer"
                            >{{ data.alias }} - {{ data.device }}</label
                          >
                          <div class="grid grid-cols-1 xl:grid-cols-2 justify-between">
                            <div class="flex flex-col gap-1">
                              <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                                <p class="font-medium opacity-80">Humidity:</p>
                                <p class="font-semibold opacity-90">{{ data.humidity }}%</p>
                              </div>
                              <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                                <p class="font-medium opacity-80">Temperature:</p>
                                <p class="font-semibold opacity-90">{{ data.temperature }}°C</p>
                              </div>
                              <div class="flex text-[10px] sm:text-xs md:text-sm gap-1 items-center">
                                <div class="flex flex-col gap-1">
                                  <p class="font-medium opacity-80">Reset Reason</p>
                                  <p class="font-semibold opacity-90">
                                    {{ getResetTitle(data.resetReason) }}
                                  </p>
                                </div>
                                <div class="dropdown">
                                  <img
                                    src="../../../assets/info-icon.svg"
                                    alt=""
                                    height="14px"
                                    width="14px"
                                    class="cursor-pointer"
                                  />
                                  <div class="text-label-primary dropdown-content w-full">
                                    {{ getResetReasonDescription(data.resetReason) }}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="flex flex-col gap-1">
                              <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                                <p class="font-medium opacity-80">Fw Version:</p>
                                <p class="font-semibold opacity-90">
                                  {{ data.fwVersion }}
                                </p>
                              </div>
                              <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                                <p class="font-medium opacity-80">Hw Version:</p>
                                <p class="font-semibold opacity-90">
                                  {{ data.hwVersion }}
                                </p>
                              </div>
                              <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                                <p class="font-medium opacity-80">Lora dBm:</p>
                                <p class="font-semibold opacity-90">
                                  {{ data.rssi }}
                                </p>
                              </div>
                              <div class="flex text-[10px] sm:text-xs md:text-sm gap-1">
                                <p class="font-medium opacity-80">Uptime:</p>
                                <p class="font-semibold opacity-90">
                                  {{ data.uptime }}
                                </p>
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
      </div>
    </div>
  </div>
</template>

<style scoped>
p {
  @apply select-none;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  @apply opacity-0 flex flex-col gap-1 invisible absolute left-0 bg-bkg-secondary rounded-lg z-10 border min-w-[180px] shadow-lg transition-opacity ease-in-out delay-100 duration-300 p-4;
}

.filter-content {
  @apply opacity-0 flex flex-col gap-1 invisible absolute left-0 bg-bkg-secondary rounded-lg z-10 border min-w-[180px] shadow-lg transition-opacity ease-in-out delay-100 duration-300 p-4;
}

.tooltip-content {
  @apply opacity-0 invisible absolute bg-bkg-secondary rounded-lg z-10 border min-w-[110px] transition-opacity ease-in-out delay-100 duration-300 p-3;
}

.dropdown:hover > .dropdown-content {
  @apply opacity-100 visible;
}

.dropdown:hover > .tooltip-content {
  @apply opacity-100 visible;
}
</style>
