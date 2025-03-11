<script setup>
import SearchBar from '@/components/input/SearchBar.vue'
import { useNodesStore } from '@/stores/master-data/nodes-store'
import { useReportStore } from '@/stores/report/report-store'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'

//stores
const modalActive = ref(false)
const searchValue = ref()
const openDropdownSearch = ref(false)
const labelFilterMachine = ref(' ')
const dataFilterMachine = ref('')
const searchMachine = ref('')

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
  { text: 'Uptime (minute)', value: 'uptime', sortable: true },
  { text: 'Percentage', value: 'percentage', sortable: true },
  { text: '', value: 'operation', width: 50 }
]

const reportStore = useReportStore()
const { reportCompletenessSpecific, isLoading } = storeToRefs(useReportStore())

async function getDataReport() {
  await reportStore.getReportSpecific(
    dataFilterMachine.value,
    new Date(startDate.value + 'T' + '00:00:00').toISOString(),
    new Date(endDate.value + 'T' + '00:00:00').toISOString()
  )
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
</script>
<template>
  <alert message="" :modalActive="modalActive" isError="" @close="closeNotification" />
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
        <div class="grid grid-cols-2 gap-2">
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
                v-model="startDate"
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
                v-model="endDate"
              />
            </div>
          </div>
        </div>
        <div class="flex grow md:grow-0">
          <BasicButton class="primary" label="Filter" @click="getDataReport()" />
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
