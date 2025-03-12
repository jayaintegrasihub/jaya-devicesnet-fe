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
const notifFilterDate = ref(' ')

const closeNotification = () => {
  modalActive.value = false
}

const header = [
  { text: '', value: 'machine', sortable: true },
  { text: '', value: 'spacer1' },
  { text: '', value: 'spacer2' },
  { text: '', value: 'spacer3' },
  { text: '', value: 'spacer4' },
  { text: '', value: 'spacer5' },
  { text: '', value: 'spacer6' },
  { text: '', value: 'spacer7' },
  { text: '', value: 'spacer8' }
]

const headerExpand = [
  { text: 'No', value: 'no', sortable: true },
  { text: 'Date', value: 'formattedCreatedAt', sortable: true },
  { text: 'Actual Data Count', value: 'actualDataCount', sortable: true },
  { text: 'Expected Data Count', value: 'expectedDataCount', sortable: true },
  { text: 'Uptime (second)', value: 'uptime', sortable: true },
  { text: 'Percentage', value: 'percentage', sortable: true }
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

  notifFilterDate.value = ' '

  console.log(reportCompletenessSummary.value)
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

function checkRangeDate() {
  const from = new Date(startDate.value)
  const to = new Date(endDate.value)
  const diffTime = to - from
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  if (diffDays < 0) {
    notifFilterDate.value = "The 'To' date cannot be earlier than the 'From' date!"
  } else if (diffDays > 7) {
    notifFilterDate.value = 'The date range cannot exceed 1 week!'
  } else {
    notifFilterDate.value = ' '
  }
}
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
          <option v-for="data in types" :value="data.name" v-bind:key="data.id">
            {{ data.name }}
          </option>
        </select>
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
            label="Filter"
            @click="getDataReport()"
            :disabled="notifFilterDate !== ' ' ? true : false"
          />
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
  >
    <template #expand="item">
      <div class="py-4">
        <EasyDataTable
          :rows-per-page="25"
          table-class-name="customize-table"
          :headers="headerExpand"
          :items="item.report"
          theme-color="#1363df"
          :search-value="searchValue"
          :loading="isLoading"
          style="margin-right: 20px; margin-left: 20px"
        ></EasyDataTable>
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
