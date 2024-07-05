<script setup>
import SearchBar from '@/components/input/SearchBar.vue'
import { onMounted, ref } from 'vue'
import BaseInput from '@/components/input/BaseInput.vue'
import BaseButton from '@/components/input/BaseButton.vue'
import { Form as VeeForm } from 'vee-validate'
import { useApiKeysStore } from '@/stores/master-data/apikeys-store'
import { storeToRefs } from 'pinia'
import { useLoadingStore } from '@/stores/loading-store'
import * as yup from 'yup'
import { useClipboard } from '@vueuse/core'

// Create a clipboard instance
const { copy, copied } = useClipboard()

const copyToClipboard = (target) => {
  copy(target);
}
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

const status = ref({
  message: '',
  isError: false
})

const isEnable = ref(false)
const expiresAt = ref('')

function clearRefs() {
  isEnable.value = false
  expiresAt.value = ''
  username.value = ''
  description.value = ''
}

onMounted(async () => {
  await apiKeysStore.getApiKeys()
})

//table
const header = [
  { text: "Username", value: "username", sortable: true },
  { text: "Expired At", value: "expiresAt", sortable: true },
  { text: "Description", value: "description", sortable: true },
  { text: "Status", value: "isEnable", sortable: true },
  { text: "", value: "operation", width: 50 },
]
//stores
const loadingStore = useLoadingStore()
const apiKeysStore = useApiKeysStore()
const { apiKeys, createdApiKey, createApiKeyStatus, editApiKeyStatus, deleteApiKeyStatus, getApiKeysLoading, createApiKeyLoading, editApiKeyLoading, deleteApiKeyLoading } = storeToRefs(useApiKeysStore())

//form data
const username = ref('')
const description = ref('')

//alert control
const modalActive = ref(false)
const searchValue = ref()
const closeNotification = () => {
  modalActive.value = false
}
//create Tenant
let submitLabel = 'Submit'
let submitClicked = 0
const schema = yup.object({
  username: yup.string().required().label(' '),
  description: yup.string().required().label(' '),
})

const onSubmit = async (values, { resetForm }) => {
  let newValues = values
  newValues.isEnable = isEnable.value
  newValues.expiresAt = expiresAt.value
  submitClicked = ++submitClicked
  if (submitClicked === 1) {
    submitLabel = 'the data entered is correct?'
  }

  if (submitClicked === 2) {
    await apiKeysStore.createApiKey(newValues)
    status.value.message = createApiKeyStatus.value.message
    status.value.isError = createApiKeyStatus.value.isError
    submitLabel = 'Submit'
    submitClicked = 0
    modalActive.value = true
    if (createApiKeyStatus.value.isError) {
      closeNotification()
    } else {
      resetForm()
      await delay(1000)
      closeNotification()
      apiKeyModalToggle()
      apiKeysStore.getApiKeys()
      clearRefs()
    }
  }
}

//delete Tenant
const isModalPops = ref(false)
let selectedItem = ref({ id: null, name: null })

function delModalToggle(item) {
  isEdit.value = false
  selectedItem.value.name = item.name
  selectedItem.value.id = item.id
  isModalPops.value = !isModalPops.value
}

async function deleteItem() {
  cancelEdit()
  loadingStore.startLoading()
  await apiKeysStore.deleteApiKey(selectedItem.value.id)
  status.value.message = deleteApiKeyStatus.value.message
  status.value.isError = deleteApiKeyStatus.value.isError
  loadingStore.stopLoading()
  modalActive.value = true
  await delay(1000)
  closeNotification()
  apiKeysStore.getApiKeys()
}

//edit Tenant
const selectedEditItem = ref({})
const isEdit = ref(false)

function editModalToggle(item) {
  username.value = item.username
  description.value = item.description
  isEnable.value = item.isEnable
  expiresAt.value = item.expiresAt
  isEdit.value = true
  selectedEditItem.value = item
}

function cancelEdit() {
  submitLabel = 'Submit'
  submitClicked = 0
  clearRefs()
  selectedEditItem.value = {}
  isEdit.value = false
}

async function onToggle(data) {
  cancelEdit()
  let isEnable = { isEnable: data.isEnable }
  console.log(isEnable)
  await apiKeysStore.editApiKey(data.id, isEnable)
  status.value.message = editApiKeyStatus.value.message
  status.value.isError = editApiKeyStatus.value.isError
  modalActive.value = true
  setTimeout(closeNotification, 3000)
  apiKeysStore.getApiKeys()
  clearRefs()
}

const onEdit = async (values, { resetForm }) => {
  console.log(values)
  let newValues = values
  newValues.isEnable = isEnable.value
  newValues.expiresAt = expiresAt.value
  submitClicked = ++submitClicked
  if (submitClicked === 1) {
    submitLabel = 'the data entered is correct?'
  }
  if (submitClicked === 2) {
    loadingStore.startLoading()
    await apiKeysStore.editApiKey(selectedEditItem.value.id, newValues)
    loadingStore.stopLoading()
    isEdit.value = false
    submitLabel = 'Submit'
    submitClicked = 0
    modalActive.value = true
    if (editApiKeyStatus.value.isError) {
      closeNotification()
    } else {
      resetForm()
      await delay(1000)
      closeNotification()
      apiKeysStore.getApiKeys()
      clearRefs()
    }
  }
}

///create success
const apiKeyModalState = ref(false)

function apiKeyModalToggle() {
  apiKeyModalState.value = !apiKeyModalState.value
}



</script>
<template>
  <DeleteConfirmationModal :isOpen="isModalPops" @close="isModalPops = false" :item="selectedItem.name"
    @delete="deleteItem" />
  <alert :message="status.message" :modalActive="modalActive" :isError="status.isError" @close="closeNotification" />
  <div class="grid grid-cols-3 px-8 gap-8 flex-1">
    <div class="flex flex-col gap-4 col-span-2">
      <div class="grid grid-row gap-6 md:gap-10">
        <div class="flex flex-col md:flex-row gap-4 md:justify-between">
          <SearchBar v-model="searchValue" />
        </div>
      </div>
      <EasyDataTable :rows-per-page="10" table-class-name="customize-table" :headers="header" :items="apiKeys"
        theme-color="#1363df" :search-value="searchValue" :loading="getApiKeysLoading">

        <template #item-isEnable="item">
          <div class="toggle-wrapper">
            <span class="font-semibold"></span>
            <label class="inline-flex relative items-center cursor-pointer">
              <input type="checkbox" @change="onToggle(item)" v-model="item.isEnable" class="sr-only peer">
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600">
              </div>
            </label>
          </div>
        </template>
        <template #item-operation="item">
          <div class="operation">
            <svg class="cursor-pointer hover:scale-110 duration-200" width="24" height="24" viewBox="0 0 24 24"
              fill="none" xmlns="http://www.w3.org/2000/svg" @click="editModalToggle(item)">
              <path
                d="M6.03984 17.625C6.08672 17.625 6.13359 17.6203 6.18047 17.6133L10.1227 16.9219C10.1695 16.9125 10.2141 16.8914 10.2469 16.8563L20.182 6.92109C20.2038 6.89941 20.221 6.87366 20.2328 6.8453C20.2445 6.81695 20.2506 6.78656 20.2506 6.75586C20.2506 6.72516 20.2445 6.69477 20.2328 6.66642C20.221 6.63806 20.2038 6.61231 20.182 6.59063L16.2867 2.69297C16.2422 2.64844 16.1836 2.625 16.1203 2.625C16.057 2.625 15.9984 2.64844 15.9539 2.69297L6.01875 12.6281C5.98359 12.6633 5.9625 12.7055 5.95312 12.7523L5.26172 16.6945C5.23892 16.8201 5.24707 16.9493 5.28545 17.071C5.32384 17.1927 5.39132 17.3032 5.48203 17.393C5.63672 17.543 5.83125 17.625 6.03984 17.625V17.625ZM7.61953 13.5375L16.1203 5.03906L17.8383 6.75703L9.3375 15.2555L7.25391 15.6234L7.61953 13.5375V13.5375ZM20.625 19.5938H3.375C2.96016 19.5938 2.625 19.9289 2.625 20.3438V21.1875C2.625 21.2906 2.70937 21.375 2.8125 21.375H21.1875C21.2906 21.375 21.375 21.2906 21.375 21.1875V20.3438C21.375 19.9289 21.0398 19.5938 20.625 19.5938Z"
                class="fill-label-secondary" fill-opacity="0.8" />
            </svg>
            <svg class="cursor-pointer hover:scale-110 transition-transform duration-200" width="24" height="24"
              viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" @click="delModalToggle(item)">
              <path
                d="M8.4375 4.3125H8.25C8.35313 4.3125 8.4375 4.22813 8.4375 4.125V4.3125H15.5625V4.125C15.5625 4.22813 15.6469 4.3125 15.75 4.3125H15.5625V6H17.25V4.125C17.25 3.29766 16.5773 2.625 15.75 2.625H8.25C7.42266 2.625 6.75 3.29766 6.75 4.125V6H8.4375V4.3125ZM20.25 6H3.75C3.33516 6 3 6.33516 3 6.75V7.5C3 7.60313 3.08437 7.6875 3.1875 7.6875H4.60312L5.18203 19.9453C5.21953 20.7445 5.88047 21.375 6.67969 21.375H17.3203C18.1219 21.375 18.7805 20.7469 18.818 19.9453L19.3969 7.6875H20.8125C20.9156 7.6875 21 7.60313 21 7.5V6.75C21 6.33516 20.6648 6 20.25 6ZM17.1398 19.6875H6.86016L6.29297 7.6875H17.707L17.1398 19.6875Z"
                fill="#ED424F" fill-opacity="0.8" />
            </svg>
          </div>
        </template>
      </EasyDataTable>
    </div>
    <div class="rounded-lg border-2 border-bkg-secondary px-4 py-6 flex flex-col gap-8" v-if="!isEdit">
      <h1 class="text-xl text-label-primary">Create New API Key</h1>
      <VeeForm :validation-schema="schema" v-slot="{ handleSubmit }" as="div" ref="form">
        <form @submit="handleSubmit($event, onSubmit)" class="form-wrapper">
          <BaseInput name="username" type="text" placeholder="Name" label="Name" />
          <BaseInput name="description" type="text" placeholder="Description" label="Description" />
          <div
            class="flex justify-between items-center text-xs font-semibold text-label-primary px-4 py-4 border border-label-secondary rounded-lg">
            <label for="expiresAt">Expires At</label>
            <input type="date" name="expiresAt" id="expiresAt" v-model="expiresAt" required>
          </div>
          <div class="flex justify-between items-center text-xs font-semibold text-label-primary px-4 py-4 ">
            <label for="isEnable" class="cursor-pointer">Activate</label>
            <input type="checkbox" class="cursor-pointer" name="isEmable" id="isEnable" v-model="isEnable">
          </div>
          <div class="flex justify-between gap-10">
            <BaseButton type="submit" class="primary" :label="submitLabel" :loading="createApiKeyLoading" />
          </div>
        </form>
      </VeeForm>
    </div>
    <div class="rounded-lg border-2 border-bkg-secondary px-4 py-6 flex flex-col gap-8" v-if="isEdit">
      <h1 class="text-xl text-label-primary">Edit Type</h1>
      <VeeForm :validation-schema="schema" v-slot="{ handleSubmit }" as="div" ref="form">
        <form @submit="handleSubmit($event, onEdit)" class="form-wrapper">
          <BaseInput v-model="username" name="username" type="text" placeholder="Name" label="Name" />
          <BaseInput v-model="description" name="description" type="text" placeholder="Description" label="Description" />
          <div
            class="flex justify-between items-center text-xs font-semibold text-label-primary px-4 py-4 border border-label-secondary rounded-lg">
            <label for="expiresAt">Expires At</label>
            <input type="date" name="expiresAt" id="expiresAt" v-model="expiresAt" required>
          </div>
          <div class="flex justify-between items-center text-xs font-semibold text-label-primary px-4 py-4 ">
            <label for="isEnable" class="cursor-pointer">Activate</label>
            <input type="checkbox" class="cursor-pointer" name="isEmable" id="isEnable" v-model="isEnable">
          </div>
          <div class="flex justify-between gap-10">
            <BaseButton type="button" class="secondary" label="Cancel" :loading="editApiKeyLoading" @click="cancelEdit" />
            <BaseButton type="submit" class="primary" :label="submitLabel" :loading="editApiKeyLoading" />
          </div>
        </form>
      </VeeForm>
    </div>
  </div>
  <transition name="fade">
    <div v-show="apiKeyModalState" class="absolute top-0 left-0 w-full h-full z-40 flex justify-center items-center">
      <div class="bg-bkg-secondary flex flex-col gap-4 rounded-lg px-8 py-10 text-sm">
        <h1 class="text-label-primary font-semibold text-xl">API Key Succesfully Created</h1>
        <div class="flex flex-col gap-2 border border-bkg-tertiary px-4 py-3 rounded-xl">
          <div class="flex justify-between">
            <p class="text-label-secondary font-medium">Username</p>
            <div
              class="flex text-label-secondary text-xs gap-1 justify-center items-center hover:bg-bkg-tertiary px-2 py-1 rounded-sm cursor-pointer"
              @click="copyToClipboard(createdApiKey.username)">
              <span v-if="!copied">Copy</span>
              <span v-else>Copied!</span>
              <div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12.5 1.74986H10.3419C10.0392 1.43379 9.67567 1.18226 9.2732 1.01042C8.87072 0.838587 8.43762 0.75 8 0.75C7.56238 0.75 7.12928 0.838587 6.72681 1.01042C6.32433 1.18226 5.9608 1.43379 5.65812 1.74986H3.5C3.16848 1.74986 2.85054 1.88156 2.61612 2.11598C2.3817 2.3504 2.25 2.66834 2.25 2.99986V13.4999C2.25 13.8314 2.3817 14.1493 2.61612 14.3837C2.85054 14.6182 3.16848 14.7499 3.5 14.7499H12.5C12.8315 14.7499 13.1495 14.6182 13.3839 14.3837C13.6183 14.1493 13.75 13.8314 13.75 13.4999V2.99986C13.75 2.66834 13.6183 2.3504 13.3839 2.11598C13.1495 1.88156 12.8315 1.74986 12.5 1.74986ZM9.73188 3.74986H6.26813C6.3285 3.33361 6.53678 2.95304 6.85482 2.6778C7.17286 2.40256 7.5794 2.25108 8 2.25108C8.4206 2.25108 8.82714 2.40256 9.14518 2.6778C9.46322 2.95304 9.6715 3.33361 9.73188 3.74986ZM12.25 13.2499H3.75V3.24986H4.83813C4.77978 3.4956 4.75021 3.74729 4.75 3.99986V4.49986C4.75 4.69877 4.82902 4.88954 4.96967 5.03019C5.11032 5.17084 5.30109 5.24986 5.5 5.24986H10.5C10.6989 5.24986 10.8897 5.17084 11.0303 5.03019C11.171 4.88954 11.25 4.69877 11.25 4.49986V3.99986C11.2498 3.74729 11.2202 3.4956 11.1619 3.24986H12.25V13.2499Z"
                    class='fill-label-secondary' />
                </svg>
              </div>
            </div>
          </div>
          <h2 class="text-label-primary font-medium cursor-copy">{{ createdApiKey.username }}</h2>
        </div>
        <div class="flex flex-col gap-2 border border-bkg-tertiary px-4 py-3 rounded-xl">
          <div class="flex justify-between">
            <p class="text-label-secondary font-medium">Description</p>
            <div
              class="flex text-label-secondary text-xs gap-1 justify-center items-center hover:bg-bkg-tertiary px-2 py-1 rounded-sm cursor-pointer"
              @click="copyToClipboard(createdApiKey.description)">
              <span v-if="!copied">Copy</span>
              <span v-else>Copied!</span>
              <div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12.5 1.74986H10.3419C10.0392 1.43379 9.67567 1.18226 9.2732 1.01042C8.87072 0.838587 8.43762 0.75 8 0.75C7.56238 0.75 7.12928 0.838587 6.72681 1.01042C6.32433 1.18226 5.9608 1.43379 5.65812 1.74986H3.5C3.16848 1.74986 2.85054 1.88156 2.61612 2.11598C2.3817 2.3504 2.25 2.66834 2.25 2.99986V13.4999C2.25 13.8314 2.3817 14.1493 2.61612 14.3837C2.85054 14.6182 3.16848 14.7499 3.5 14.7499H12.5C12.8315 14.7499 13.1495 14.6182 13.3839 14.3837C13.6183 14.1493 13.75 13.8314 13.75 13.4999V2.99986C13.75 2.66834 13.6183 2.3504 13.3839 2.11598C13.1495 1.88156 12.8315 1.74986 12.5 1.74986ZM9.73188 3.74986H6.26813C6.3285 3.33361 6.53678 2.95304 6.85482 2.6778C7.17286 2.40256 7.5794 2.25108 8 2.25108C8.4206 2.25108 8.82714 2.40256 9.14518 2.6778C9.46322 2.95304 9.6715 3.33361 9.73188 3.74986ZM12.25 13.2499H3.75V3.24986H4.83813C4.77978 3.4956 4.75021 3.74729 4.75 3.99986V4.49986C4.75 4.69877 4.82902 4.88954 4.96967 5.03019C5.11032 5.17084 5.30109 5.24986 5.5 5.24986H10.5C10.6989 5.24986 10.8897 5.17084 11.0303 5.03019C11.171 4.88954 11.25 4.69877 11.25 4.49986V3.99986C11.2498 3.74729 11.2202 3.4956 11.1619 3.24986H12.25V13.2499Z"
                    class='fill-label-secondary' />
                </svg>
              </div>
            </div>
          </div>
          <h2 class="text-label-primary font-medium cursor-copy">{{ createdApiKey.description }}</h2>
        </div>
        <div class="flex flex-col gap-2 border border-bkg-tertiary px-4 py-3 rounded-xl">
          <div class="flex justify-between">
            <p class="text-label-secondary font-medium">API Key</p>
            <div
              class="flex text-label-secondary text-xs gap-1 justify-center items-center hover:bg-bkg-tertiary px-2 py-1 rounded-sm cursor-pointer"
              @click="copyToClipboard(createdApiKey.apiKey)">
              <span v-if="!copied">Copy</span>
              <span v-else>Copied!</span>
              <div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12.5 1.74986H10.3419C10.0392 1.43379 9.67567 1.18226 9.2732 1.01042C8.87072 0.838587 8.43762 0.75 8 0.75C7.56238 0.75 7.12928 0.838587 6.72681 1.01042C6.32433 1.18226 5.9608 1.43379 5.65812 1.74986H3.5C3.16848 1.74986 2.85054 1.88156 2.61612 2.11598C2.3817 2.3504 2.25 2.66834 2.25 2.99986V13.4999C2.25 13.8314 2.3817 14.1493 2.61612 14.3837C2.85054 14.6182 3.16848 14.7499 3.5 14.7499H12.5C12.8315 14.7499 13.1495 14.6182 13.3839 14.3837C13.6183 14.1493 13.75 13.8314 13.75 13.4999V2.99986C13.75 2.66834 13.6183 2.3504 13.3839 2.11598C13.1495 1.88156 12.8315 1.74986 12.5 1.74986ZM9.73188 3.74986H6.26813C6.3285 3.33361 6.53678 2.95304 6.85482 2.6778C7.17286 2.40256 7.5794 2.25108 8 2.25108C8.4206 2.25108 8.82714 2.40256 9.14518 2.6778C9.46322 2.95304 9.6715 3.33361 9.73188 3.74986ZM12.25 13.2499H3.75V3.24986H4.83813C4.77978 3.4956 4.75021 3.74729 4.75 3.99986V4.49986C4.75 4.69877 4.82902 4.88954 4.96967 5.03019C5.11032 5.17084 5.30109 5.24986 5.5 5.24986H10.5C10.6989 5.24986 10.8897 5.17084 11.0303 5.03019C11.171 4.88954 11.25 4.69877 11.25 4.49986V3.99986C11.2498 3.74729 11.2202 3.4956 11.1619 3.24986H12.25V13.2499Z"
                    class='fill-label-secondary' />
                </svg>
              </div>
            </div>
          </div>
          <h2 class="text-label-primary font-medium cursor-copy">{{ createdApiKey.apiKey }}</h2>
        </div>
        <div class="flex flex-col gap-2 border border-bkg-tertiary px-4 py-3 rounded-xl">
          <div class="flex justify-between">
            <p class="text-label-secondary font-medium">Secret Key</p>
            <div
              class="flex text-label-secondary text-xs gap-1 justify-center items-center hover:bg-bkg-tertiary px-2 py-1 rounded-sm cursor-pointer"
              @click="copyToClipboard(createdApiKey.secretKey)">
              <span v-if="!copied">Copy</span>
              <span v-else>Copied!</span>
              <div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12.5 1.74986H10.3419C10.0392 1.43379 9.67567 1.18226 9.2732 1.01042C8.87072 0.838587 8.43762 0.75 8 0.75C7.56238 0.75 7.12928 0.838587 6.72681 1.01042C6.32433 1.18226 5.9608 1.43379 5.65812 1.74986H3.5C3.16848 1.74986 2.85054 1.88156 2.61612 2.11598C2.3817 2.3504 2.25 2.66834 2.25 2.99986V13.4999C2.25 13.8314 2.3817 14.1493 2.61612 14.3837C2.85054 14.6182 3.16848 14.7499 3.5 14.7499H12.5C12.8315 14.7499 13.1495 14.6182 13.3839 14.3837C13.6183 14.1493 13.75 13.8314 13.75 13.4999V2.99986C13.75 2.66834 13.6183 2.3504 13.3839 2.11598C13.1495 1.88156 12.8315 1.74986 12.5 1.74986ZM9.73188 3.74986H6.26813C6.3285 3.33361 6.53678 2.95304 6.85482 2.6778C7.17286 2.40256 7.5794 2.25108 8 2.25108C8.4206 2.25108 8.82714 2.40256 9.14518 2.6778C9.46322 2.95304 9.6715 3.33361 9.73188 3.74986ZM12.25 13.2499H3.75V3.24986H4.83813C4.77978 3.4956 4.75021 3.74729 4.75 3.99986V4.49986C4.75 4.69877 4.82902 4.88954 4.96967 5.03019C5.11032 5.17084 5.30109 5.24986 5.5 5.24986H10.5C10.6989 5.24986 10.8897 5.17084 11.0303 5.03019C11.171 4.88954 11.25 4.69877 11.25 4.49986V3.99986C11.2498 3.74729 11.2202 3.4956 11.1619 3.24986H12.25V13.2499Z"
                    class='fill-label-secondary' />
                </svg>
              </div>
            </div>
          </div>
          <h2 class="text-label-primary font-medium cursor-copy">{{ createdApiKey.secretKey }}</h2>
        </div>
        <div class="flex justify-between gap-10">
          <BaseButton type="submit" class="secondary" label="Close" @click="apiKeyModalToggle" />
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

p {
  @apply select-none
}

.input-wrapper {
  @apply flex justify-between gap-1 text-left w-full px-4 py-2 rounded-[10px] border border-label-secondary hover:opacity-80
}

.text-field {
  @apply flex flex-col gap-1
}

.label {
  @apply text-[12px] font-semibold select-none text-label-primary
}

input {
  @apply outline-none text-[14px] bg-transparent font-medium text-label-primary
}

input::placeholder {
  @apply text-[14px] text-label-secondary font-normal
}



.modal {
  @apply fixed top-0 left-0 w-full h-full overflow-x-hidden overflow-y-auto bg-[#ABADAF]/20 z-50
}

.modal-inner {
  @apply max-w-[500px] my-[100px] mx-auto
}

.modal-content {
  @apply relative w-[600px] p-[40px] bg-white rounded-xl gap-[40px] flex flex-col
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.drop-in-enter-active,
.drop-in-leave-active {
  transition: all 0.3s ease-out;
}

.drop-in-enter-from,
.drop-in-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}

.button-wrapper {
  @apply flex justify-between gap-8
}
</style>
