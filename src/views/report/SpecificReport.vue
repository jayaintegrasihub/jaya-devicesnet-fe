<script setup>
import SearchBar from '@/components/input/SearchBar.vue'
import { useLoadingStore } from '@/stores/loading-store'
import { useNodesStore } from '@/stores/master-data/nodes-store'
import { useReportStore } from '@/stores/report/report-store'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'

//stores
const loadingStore = useLoadingStore()
const modalActive = ref(false)
const searchValue = ref()
const openDropdownSearch = ref(false)
const labelFilterMachine = ref(' ')
const dataFilterMachine = ref('')
const searchMachine = ref('')
const notifFilterDate = ref(' ')

const nodesStore = useNodesStore()
const { nodes } = storeToRefs(useNodesStore())

const filteredNodes = computed(() => {
  return nodes.value.filter((item) =>
    item.alias.toLowerCase().includes(searchMachine.value.toLowerCase())
  )
})

function openCloseDropdownSearch() {
  openDropdownSearch.value = !openDropdownSearch.value
}

function changeDataFilterMachine(value, name) {
  labelFilterMachine.value = name
  dataFilterMachine.value = value
  openDropdownSearch.value = false
}

const closeNotification = () => {
  modalActive.value = false
}

const header = [
  { text: 'No', value: 'no', sortable: true },
  { text: 'Date', value: 'formattedCreatedAt', sortable: true },
  { text: 'Machine', value: 'machine', sortable: true },
  { text: 'Actual Data Count', value: 'actualDataCount', sortable: true },
  { text: 'Expected Data Count', value: 'expectedDataCount', sortable: true },
  { text: 'Uptime (second)', value: 'uptime', sortable: true },
  { text: 'Percentage', value: 'percentage', sortable: true },
  { text: '', value: 'operation', width: 50 }
]

const reportStore = useReportStore()
const { reportCompletenessSpecific, isLoading, statusExport } = storeToRefs(useReportStore())

async function getDataReport() {
  await reportStore.getReportSpecific(
    dataFilterMachine.value,
    new Date(startDate.value + 'T' + '00:00:00').toISOString(),
    new Date(endDate.value + 'T' + '00:00:00').toISOString()
  )

  notifFilterDate.value = ' '
}

const getDateNdaysAgo = (n) => {
  const date = new Date()
  date.setDate(date.getDate() - n)
  return date.toLocaleDateString('en-CA')
}
const startDate = ref(getDateNdaysAgo(7))
const endDate = ref(new Date().toLocaleDateString('en-CA'))

onMounted(async () => {
  await nodesStore.getNodes()
})

async function exportDataReport() {
  if (labelFilterMachine.value !== ' ') {
    loadingStore.startLoading()
    await reportStore.exportReportSpecific(
      dataFilterMachine.value,
      new Date(startDate.value + 'T' + '00:00:00').toISOString(),
      new Date(endDate.value + 'T' + '00:00:00').toISOString()
    )
    loadingStore.stopLoading()
    modalActive.value = true
    notifFilterDate.value = ' '
  }
}

function checkRangeDate() {
  const from = new Date(startDate.value)
  const to = new Date(endDate.value)
  const diffTime = to - from
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  if (diffDays < 0) {
    notifFilterDate.value = "The 'To' date cannot be earlier than the 'From' date!"
  } else if (diffDays > 30) {
    notifFilterDate.value = 'The date range cannot exceed 1 month!'
  } else {
    notifFilterDate.value = ' '
  }
}
</script>
<template>
  <alert
    :message="statusExport.message"
    :modalActive="modalActive"
    :isError="statusExport.isError"
    @close="closeNotification"
  />
  <div
    class="flex grow md:grow-0 items-center p-3 rounded-md cursor-pointer hover:scale-110 duration-200 w-[100px] absolute right-16"
    style="background-color: #f6f6f9"
    :class="labelFilterMachine == ' ' ? '!cursor-not-allowed' : 'cursor-pointer'"
    @click="exportDataReport()"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.8195 17.7516H19.5586C19.4602 17.7516 19.3781 17.8336 19.3781 17.932V19.3805H4.61953V4.61953H19.3805V6.06797C19.3805 6.16641 19.4625 6.24844 19.5609 6.24844H20.8219C20.9203 6.24844 21.0023 6.16875 21.0023 6.06797V3.71953C21.0023 3.32109 20.6813 3 20.2828 3H3.71953C3.32109 3 3 3.32109 3 3.71953V20.2805C3 20.6789 3.32109 21 3.71953 21H20.2805C20.6789 21 21 20.6789 21 20.2805V17.932C21 17.8312 20.918 17.7516 20.8195 17.7516ZM21.2555 11.8523L17.9297 9.22734C17.8055 9.12891 17.625 9.21797 17.625 9.375V11.1562H10.2656C10.1625 11.1562 10.0781 11.2406 10.0781 11.3438V12.6562C10.0781 12.7594 10.1625 12.8438 10.2656 12.8438H17.625V14.625C17.625 14.782 17.8078 14.8711 17.9297 14.7727L21.2555 12.1477C21.2779 12.1301 21.296 12.1077 21.3085 12.0821C21.3209 12.0565 21.3274 12.0285 21.3274 12C21.3274 11.9715 21.3209 11.9435 21.3085 11.9179C21.296 11.8923 21.2779 11.8699 21.2555 11.8523Z"
        fill-opacity="1"
        :fill="labelFilterMachine == ' ' ? '#aaaaaa' : '#0989c0'"
      />
    </svg>
    <p
      class="ml-2"
      :style="labelFilterMachine == ' ' ? 'color: #aaaaaa;' : 'color: #0989c0;'"
      style="font-size: 14px; font-weight: 600"
    >
      Export
    </p>
  </div>
  <div class="mx-8 grid grid-row gap-6 md:gap-4">
    <div class="flex flex-col md:flex-row gap-4 md:justify-between">
      <SearchBar v-model="searchValue" />
      <div class="grid grid-cols-2 md:flex gap-4 justify-end">
        <div>
          <button
            id="dropdownSearchButton"
            data-dropdown-toggle="dropdownSearch"
            data-dropdown-placement="bottom"
            @click="openCloseDropdownSearch()"
            class="select-option text-center inline-flex items-center justify-between"
            type="button"
          >
            {{ labelFilterMachine == ' ' ? 'Choose Machine' : labelFilterMachine }}
            <svg
              class="w-2.5 h-2.5 ms-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path
                stroke="#333333"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m1 1 4 4 4-4"
              />
            </svg>
          </button>

          <!-- Dropdown menu -->
          <div
            id="dropdownSearch"
            :class="openDropdownSearch ? '' : 'hidden'"
            class="z-10 bg-white absolute rounded-lg shadow-sm border border-black-400 mt-2"
          >
            <div class="p-3">
              <SearchBar v-model="searchMachine" />
            </div>
            <ul
              class="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
              aria-labelledby="dropdownSearchButton"
            >
              <li
                v-for="node in filteredNodes"
                v-bind:key="node.id"
                @click="changeDataFilterMachine(node.serialNumber, node.alias)"
              >
                <div class="flex items-center ps-2 rounded-sm hover:bg-gray-100">
                  <label
                    for="checkbox-item-11"
                    class="w-full py-2 ms-2 text-sm font-medium text-gray-900 rounded-sm"
                    >{{ node.alias }}</label
                  >
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div>
          <div class="grid grid-cols-2 gap-2">
            <div
              :class="notifFilterDate === ' ' ? 'border-[#D9D9D9]' : 'border-[#FF0000]'"
              class="text-left flex items-center gap-2 border rounded-md p-2 w-fit"
            >
              <h2 class="font-semibold text-xs">From</h2>
              <div class="flex gap-6">
                <input
                  class="cursor-pointer outline-none bg-transparent text-xs"
                  type="date"
                  name="startDateResetReason"
                  id="startDateResetReason"
                  v-model="startDate"
                  @change="checkRangeDate()"
                />
              </div>
            </div>
            <div
              :class="notifFilterDate === ' ' ? 'border-[#D9D9D9]' : 'border-[#FF0000]'"
              class="text-left flex items-center gap-2 border rounded-md p-2 w-fit"
            >
              <h2 class="font-semibold text-xs">To</h2>
              <div class="flex gap-6">
                <input
                  class="cursor-pointer outline-none bg-transparent text-xs"
                  type="date"
                  name="endDateResetReason"
                  id="endDateResetReason"
                  v-model="endDate"
                  @change="checkRangeDate()"
                />
              </div>
            </div>
          </div>
          <p
            v-if="notifFilterDate !== ' '"
            style="
              color: red;
              font-size: 11px;
              margin-top: 2px;
              margin-left: 2px;
              position: absolute;
            "
          >
            {{ notifFilterDate }}
          </p>
        </div>
        <div class="flex grow md:grow-0">
          <BasicButton
            class="primary"
            :class="labelFilterMachine == ' ' ? '!cursor-not-allowed' : 'cursor-pointer'"
            label="Filter"
            @click="getDataReport()"
            :disabled="
              labelFilterMachine == ' ' ? true : false || notifFilterDate !== ' ' ? true : false
            "
          />
        </div>
      </div>
    </div>
  </div>
  <EasyDataTable
    :rows-per-page="25"
    table-class-name="customize-table"
    :headers="header"
    :items="reportCompletenessSpecific"
    theme-color="#1363df"
    :search-value="searchValue"
    :loading="isLoading"
    style="margin-right: 20px; margin-left: 20px"
  />
</template>

<style scoped>
p {
  @apply select-none;
}

.select-option {
  color: #444;
}
</style>
