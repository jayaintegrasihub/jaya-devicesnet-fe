<script setup>
import SearchBar from '@/components/input/SearchBar.vue'
import { useTenantsStore } from '@/stores/master-data/tenants-store'
import { useTypesStore } from '@/stores/master-data/types-store'
import { useReportStore } from '@/stores/report/report-store'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'

//stores
const modalActive = ref(false)
const searchValue = ref()

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
const tenantStore = useTenantsStore()
const { tenants } = storeToRefs(useTenantsStore())
const selectedTenant = useLocalStorage('SelectedTenantReport', '')

async function initTenantsList() {
  await tenantStore.getTenants()

  if (tenants.value.length === 0) {
    selectedTenant.value = 'none'
  } else if (selectedTenant.value === '') {
    selectedTenant.value = tenants.value[0].name
  }
}

const typeStore = useTypesStore()
const { types } = storeToRefs(useTypesStore())
const selectedDeviceType = useLocalStorage('SelectedDeviceTypeReport', 'All')

async function initTypesList() {
  await typeStore.getTypes()
  if (selectedDeviceType.value !== 'All') {
    let selectedType = findByName(types.value, selectedDeviceType.value)
    await typeStore.getType(selectedType.id)
  }
}

const findByName = (array, name) => {
  return array.find((item) => item.name === name)
}

const reportStore = useReportStore()
const { reportCompletenessSummary, isLoading } = storeToRefs(useReportStore())

async function getDataReport() {
  await reportStore.getReportSummary(
    selectedTenant.value,
    selectedDeviceType.value,
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
  await initTenantsList()
  await initTypesList()
})
</script>
<template>
  <alert message="" :modalActive="modalActive" isError="" @close="closeNotification" />
  <div class="mx-8 grid grid-row gap-6 md:gap-4">
    <div class="flex flex-col md:flex-row gap-4 md:justify-between">
      <SearchBar v-model="searchValue" />
      <div class="grid grid-cols-2 md:flex gap-4 justify-end">
        <select class="select-option" name="tenants" id="tenants" v-model="selectedTenant">
          <option value="none">none</option>
          <option v-for="tenant in tenants" :value="tenant.id" v-bind:key="tenant.id">
            {{ tenant.name }}
          </option>
        </select>
        <select class="select-option" name="type" id="type" v-model="selectedDeviceType">
          <option value="All">All</option>
          <option v-for="data in types" :value="data.id" v-bind:key="data.id">
            {{ data.name }}
          </option>
        </select>
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
    :items="reportCompletenessSummary"
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
