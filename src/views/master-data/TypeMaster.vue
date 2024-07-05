<script setup>
import SearchBar from '@/components/input/SearchBar.vue'
import { onMounted, ref } from 'vue'
import BaseInput from '@/components/input/BaseInput.vue'
import BaseButton from '@/components/input/BaseButton.vue'
import { Form as VeeForm } from 'vee-validate'
import { useTypesStore } from '@/stores/master-data/types-store'
import { storeToRefs } from 'pinia'
import { useLoadingStore } from '@/stores/loading-store'
import * as yup from 'yup'
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

onMounted(async () => {
  await typesStore.getTypes()
})

//table
const header = [
  { text: "Name", value: "name", sortable: true },
  { text: "Group", value: "groups", sortable: true },
  { text: "Description", value: "description", sortable: true },
  { text: "", value: "operation", width: 50 },
]
//stores
const loadingStore = useLoadingStore()
const typesStore = useTypesStore()
const { types, isLoading, status, createTypeLoading, editTypeLoading } = storeToRefs(useTypesStore())

//form data
const groups = ref([''])
const typeName = ref('')
const description = ref('')
//form control
function addGroup() {
  groups.value.push('');
}
function removeGroup(index) {
  groups.value.splice(index, 1);
}
//alert control
const modalActive = ref(false)
const searchValue = ref()
const closeNotification = () => {
  modalActive.value = false
}
//create type
let submitLabel = 'Submit'
let submitClicked = 0
const schema = yup.object({
  name: yup.string().required().label(' '),
  description: yup.string().required().label(' '),
})

const onSubmit = async (values, { resetForm }) => {
  let newValues = values
  
  const newGroup = groups.value.map((data) => 
    data.replace(/\s/g, '')
  )
  newValues.groups = newGroup
  
  console.log(newValues)
  submitClicked = ++submitClicked
  if (submitClicked === 1) {
    submitLabel = 'the data entered is correct?'
  }

  if (submitClicked === 2) {
    await typesStore.createType(newValues)
    submitLabel = 'Submit'
    submitClicked = 0
    modalActive.value = true
    if (status.value.isError) {
      closeNotification()
    } else {
      resetForm()
      groups.value = ['']
      await delay(1000)
      closeNotification()
      typesStore.getTypes()
    }
  }
}

//delete type
const isModalPops = ref(false)
let selectedItem = ref({ id: null, name: null })

function delModalToggle(item) {
  isEdit.value = false
  selectedItem.value.name = item.name
  selectedItem.value.id = item.id
  isModalPops.value = !isModalPops.value
}

async function deleteItem() {
  loadingStore.startLoading()
  await typesStore.deleteType(selectedItem.value.id)
  loadingStore.stopLoading()
  modalActive.value = true
  await delay(1000)
  closeNotification()
  typesStore.getTypes()
}

//edit type
const selectedEditItem = ref({})
const isEdit = ref(false)
function editModalToggle(item) {
  typeName.value = item.name
  description.value = item.description
  groups.value = item.groups
  isEdit.value = true
  selectedEditItem.value = item
}

function cancelEdit() {
  submitLabel = 'Submit'
  submitClicked = 0
  typeName.value = ''
  description.value = ''
  selectedEditItem.value = {}
  groups.value = ['']
  isEdit.value = false
}

const onEdit = async (values, { resetForm }) => {
  let newValues = values
  newValues.groups = groups.value
  console.log(newValues)
  submitClicked = ++submitClicked
  if (submitClicked === 1) {
    submitLabel = 'the data entered is correct?'
  }
  if (submitClicked === 2) {
    loadingStore.startLoading()
    await typesStore.editType(selectedEditItem.value.id, newValues)
    loadingStore.stopLoading()
    isEdit.value = false
    submitLabel = 'Submit'
    submitClicked = 0
    modalActive.value = true
    if (status.value.isError) {
      closeNotification()
    } else {
      resetForm()
      groups.value = ['']
      await delay(1000)
      closeNotification()
      typesStore.getTypes()
    }
  }
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
      <EasyDataTable :rows-per-page="10" table-class-name="customize-table" :headers="header" :items="types"
        theme-color="#1363df" :search-value="searchValue" :loading="isLoading">
        <template #item-groups="item">
          <div class="flex gap-2">
            <div v-for="data in item.groups"
              class="bg-accent-1 rounded-full text-center text-white w-fit min-w-[80px] py-1 px-2">{{ data
              }}</div>
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
      <h1 class="text-xl text-label-primary">Create New Type</h1>
      <VeeForm :validation-schema="schema" v-slot="{ handleSubmit }" as="div" ref="form">
        <form @submit="handleSubmit($event, onSubmit)" class="form-wrapper">
          <BaseInput name="name" type="text" placeholder="Name" label="Name" />
          <BaseInput name="description" type="text" placeholder="Description" label="Description" />
          <div class="groups flex flex-col gap-2">
            <p class="label">Groups</p>
            <div class="input-wrapper" v-for="(value, index) in groups" :key="index">
              <input required v-model="groups[index]" type="text" :placeholder="'Group ' + (index + 1)">
              <button type="button" @click="removeGroup(index)" v-if="groups.length > 1"
                class="text-sm text-red-500 hover:opacity-80">Remove</button>
            </div>
            <button type="button" @click="addGroup"
              class="hover:opacity-80 text-right bg-bkg-secondary w-fit px-2 py-2 rounded-lg text-label-primary text-xs">Add
              Group</button>
          </div>
          <div class="flex justify-between gap-10">
            <BaseButton type="submit" class="primary" :label="submitLabel" :loading="createTypeLoading" />
          </div>
        </form>
      </VeeForm>
    </div>
    <div class="rounded-lg border-2 border-bkg-secondary px-4 py-6 flex flex-col gap-8" v-if="isEdit">
      <h1 class="text-xl text-label-primary">Edit Type</h1>
      <VeeForm :validation-schema="schema" v-slot="{ handleSubmit }" as="div" ref="form">
        <form @submit="handleSubmit($event, onEdit)" class="form-wrapper">
          <BaseInput v-model="typeName" name="name" type="text" placeholder="Name" label="Name" />
          <BaseInput v-model="description" name="description" type="text" placeholder="Description" label="Description" />
          <div class="groups flex flex-col gap-2">
            <p class="label">Groups</p>
            <div class="input-wrapper" v-for="(value, index) in groups" :key="index">
              <input required v-model="groups[index]" type="text" :placeholder="'Group ' + (index + 1)">
              <button type="button" @click="removeGroup(index)" v-if="groups.length > 1"
                class="text-sm text-red-500 hover:opacity-80">Remove</button>
            </div>
            <button type="button" @click="addGroup"
              class="hover:opacity-80 text-right bg-bkg-secondary w-fit px-2 py-2 rounded-lg text-label-primary text-xs">Add
              Group</button>
          </div>
          <div class="flex justify-between gap-10">
            <BaseButton type="button" class="secondary" label="Cancel" :loading="editTypeLoading" @click="cancelEdit" />
            <BaseButton type="submit" class="primary" :label="submitLabel" :loading="editTypeLoading" />
          </div>
        </form>
      </VeeForm>
    </div>
  </div>
</template>

<style scoped>
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
