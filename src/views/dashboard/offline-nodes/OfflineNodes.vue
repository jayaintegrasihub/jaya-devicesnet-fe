<script setup>
import OfflineDeviceDetail from '@/components/modal/OfflineDeviceDetail.vue'
import router from '@/router'
import { useNodesStore } from '@/stores/master-data/nodes-store'
import { useTelemetryStore } from '@/stores/telemetry/telemetry-store'
import { useThemeStore } from '@/stores/theme'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref } from 'vue'

const { isDark } = storeToRefs(useThemeStore())
const selectedTenant = useLocalStorage('SelectedTenant', '')
const selectedDeviceType = useLocalStorage('SelectedDeviceType', 'All')

const telemetryStore = useTelemetryStore()
const nodesStore = useNodesStore()
const { node } = storeToRefs(useNodesStore())
const { offlineNodesList } = storeToRefs(useTelemetryStore())
const selectedOfflineDevice = ref('')
const offlineDeviceDetailData = ref({})
const isOfflineDetailPops = ref(false)
const selectedGroupBy = ref('')
const nodesOfflineGroupBy = ref([])

const listGroupBy = [
  {
    value: 'devision',
    label: 'Devision'
  },
  {
    value: 'floor',
    label: 'Floor'
  },
  {
    value: 'machineType',
    label: 'Machine Type'
  },
  {
    value: 'tray',
    label: 'Tray'
  }
]

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
})

onUnmounted(() => {
  telemetryStore.stopListening()
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

function removeGroupby() {
  selectedGroupBy.value = ''
}

function groupBy(array, key) {
  return array.reduce((acc, obj) => {
    const groupKey = obj[key]
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(obj)
    return acc
  }, {})
}

function changeGroupby(data) {
  if (selectedGroupBy.value == data.label) {
    selectedGroupBy.value = ''
  } else {
    selectedGroupBy.value = data.label

    const dataGroupBy = groupBy(offlineNodesList.value, data.value)
    console.log(dataGroupBy)
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
                  <p>Offline Nodes</p>
                  <div class="flex items-center gap-3">
                    <h1 class="text-label-primary text-sm font-medium">Group By</h1>
                    <div class="flex gap-1">
                      <div
                        @click="removeGroupby()"
                        v-if="selectedGroupBy !== ''"
                        class="bg-[#E2EBF6] border text-[#3962EB] px-2 py-1 rounded-full cursor-pointer text-xs font-sembold"
                      >
                        {{ selectedGroupBy }}
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
                        <div v-for="(option, index) in listGroupBy" :key="index" class="">
                          <label class="cursor-pointer select-none">
                            <div
                              :class="
                                selectedGroupBy === option.label && 'text-[#3962EB] bg-bkg-tertiary'
                              "
                              class="font-normal text-sm rounded-lg w-full h-6 bg-bkg-primary"
                              @click="changeGroupby(option)"
                            >
                              <p class="h-full flex items-center justify-center">
                                {{ option.label }}
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div v-if="nodesOfflineGroupBy.length === 0">
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

                <div v-if="nodesOfflineGroupBy.length > 0">
                  <div
                    v-for="(value, key) in groupedNodesData"
                    class="flex flex-col gap-4 mb-10"
                    :key="key"
                  >
                    <div class="px-6 py-2 bg-bkg-secondary rounded-[8px]">
                      <h1 class="text-label-primary font-semibold">
                        {{ nodesOfflineGroupBy[0] }} {{ key }}
                      </h1>
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

.dropdown:hover > .dropdown-content {
  @apply opacity-100 visible;
}
</style>
