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
  { text: 'Uptime (minute)', value: 'uptime', sortable: true },
  { text: 'Percentage', value: 'percentage', sortable: true },
  { text: '', value: 'operation', width: 50 }
]
const tenantStore = useTenantsStore()
const { tenants } = storeToRefs(useTenantsStore())
const selectedTenant = useLocalStorage('SelectedTenantReport', '')
const tenantId = ref('')

async function initTenantsList() {
  await tenantStore.getTenants()

  if (tenants.value.length === 0) {
    selectedTenant.value = 'none'
  } else if (selectedTenant.value === '') {
    selectedTenant.value = tenants.value[0].name
  }

  let searchTenantId = findByName(tenants.value, selectedTenant.value)
  tenantId.value = searchTenantId.id
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
const { reportCompleteness, isLoading } = storeToRefs(useReportStore())

async function getDataReport() {
  await reportStore.getReport(
    tenantId.value,
    selectedDeviceType.value,
    new Date(startDate.value + 'T' + startTime.value).toISOString(),
    new Date(endDate.value + 'T' + endTime.value).toISOString()
  )
}

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

onMounted(async () => {
  await initTenantsList()
  await initTypesList()
})
</script>
<template>
  <alert message="" :modalActive="modalActive" isError="" @close="closeNotification" />
  <div class="mx-8 grid grid-row gap-6 md:gap-10">
    <div class="flex flex-col md:flex-row gap-4 md:justify-between">
      <SearchBar v-model="searchValue" />
      <div class="grid grid-cols-2 md:flex gap-4 justify-end">
        <select
          class="select-option"
          name="tenants"
          id="tenants"
          v-model="selectedTenant"
          @change="initTelemetryData()"
        >
          <option value="none">none</option>
          <option v-for="tenant in tenants" :value="tenant.name">{{ tenant.name }}</option>
        </select>
        <select
          class="select-option"
          name="type"
          id="type"
          v-model="selectedDeviceType"
          @change="initTypesList()"
        >
          <option value="All">All</option>
          <option v-for="data in types" :value="data.name">{{ data.name }}</option>
        </select>
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
                v-model="startDate"
              />
              <input
                class="cursor-pointer outline-none bg-transparent text-xs"
                type="time"
                name="startTimeResetReason"
                id="startTimeResetReason"
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
                name="endDateResetReason"
                id="endDateResetReason"
                v-model="endDate"
              />
              <input
                class="cursor-pointer outline-none bg-transparent text-xs"
                type="time"
                name="endTimeResetReason"
                id="endTimeResetReason"
                v-model="endTime"
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
    :items="reportCompleteness"
    theme-color="#1363df"
    :search-value="searchValue"
    :loading="isLoading"
    style="margin-right: 20px; margin-left: 20px"
  >
    <template #item-operation>
      <div class="operation">
        <svg
          class="cursor-pointer hover:scale-110 duration-200"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20.8195 17.7516H19.5586C19.4602 17.7516 19.3781 17.8336 19.3781 17.932V19.3805H4.61953V4.61953H19.3805V6.06797C19.3805 6.16641 19.4625 6.24844 19.5609 6.24844H20.8219C20.9203 6.24844 21.0023 6.16875 21.0023 6.06797V3.71953C21.0023 3.32109 20.6813 3 20.2828 3H3.71953C3.32109 3 3 3.32109 3 3.71953V20.2805C3 20.6789 3.32109 21 3.71953 21H20.2805C20.6789 21 21 20.6789 21 20.2805V17.932C21 17.8312 20.918 17.7516 20.8195 17.7516ZM21.2555 11.8523L17.9297 9.22734C17.8055 9.12891 17.625 9.21797 17.625 9.375V11.1562H10.2656C10.1625 11.1562 10.0781 11.2406 10.0781 11.3438V12.6562C10.0781 12.7594 10.1625 12.8438 10.2656 12.8438H17.625V14.625C17.625 14.782 17.8078 14.8711 17.9297 14.7727L21.2555 12.1477C21.2779 12.1301 21.296 12.1077 21.3085 12.0821C21.3209 12.0565 21.3274 12.0285 21.3274 12C21.3274 11.9715 21.3209 11.9435 21.3085 11.9179C21.296 11.8923 21.2779 11.8699 21.2555 11.8523Z"
            class="fill-label-secondary"
            fill-opacity="0.8"
          />
        </svg>
      </div>
    </template>
  </EasyDataTable>
</template>

<style scoped>
p {
  @apply select-none;
}

.select-option {
  color: #444;
}
</style>
