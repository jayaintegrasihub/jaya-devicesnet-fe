<script setup>
import SearchBar from '@/components/input/SearchBar.vue'
import { onMounted, ref } from 'vue'
import BaseInput from '@/components/input/BaseInput.vue'
import BaseButton from '@/components/input/BaseButton.vue'
import { Form as VeeForm } from 'vee-validate'
import { storeToRefs } from 'pinia'
import { useLoadingStore } from '@/stores/loading-store'
import * as yup from 'yup'
import { useUsersStore } from '@/stores/master-data/users-store'
import { useTenantsStore } from '@/stores/master-data/tenants-store'
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

onMounted(async () => {
  await usersStore.getUsers()
  await tenantsStore.getTenants()
})

//table
const header = [
  { text: 'Username', value: 'username', sortable: true },
  { text: 'Email', value: 'email', sortable: true },
  { text: 'Role', value: 'role', sortable: true },
  { text: 'Tenants', value: 'tenant', sortable: true },
  { text: '', value: 'operation', width: 50 }
]
//stores
const loadingStore = useLoadingStore()
const usersStore = useUsersStore()
const tenantsStore = useTenantsStore()
const { users, isLoading, status, createUserLoading, editUserLoading } =
  storeToRefs(useUsersStore())
const { tenants } = storeToRefs(useTenantsStore())

//form data
const listTenants = ref([''])
const password = ref('')
const passwordType = ref(false)
const confirmPasswordType = ref(false)

const description = ref('')
//form control
function addTenant() {
  listTenants.value.push('')
}
function removeTenant(index) {
  listTenants.value.splice(index, 1)
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
  username: yup.string().required().label(' '),
  email: yup.string().required().label(' ').email(),
  password: yup.string().required().label(' ').min(8),
  confirmPassword: yup.string().required().label(' ').min(8),
  role: yup.string().required()
})

const schemaEditUser = yup.object({
  password: yup.string().required().label(' ').min(8),
  confirmPassword: yup.string().required().label(' ').min(8)
})

const onSubmit = async (values, { resetForm }) => {
  let newValues = values

  if (newValues.role !== 'admin') {
    const newTenants = listTenants.value.map((data) => data.replace(/\s/g, ''))
    newValues.tenantIds = newTenants
  }

  submitClicked = ++submitClicked
  if (submitClicked === 1) {
    submitLabel = 'the data entered is correct?'
  }

  if (submitClicked === 2) {
    await usersStore.createUser(newValues)
    submitLabel = 'Submit'
    submitClicked = 0
    modalActive.value = true
    if (status.value.isError) {
      await delay(1500)
      closeNotification()
    } else {
      resetForm()
      listTenants.value = ['']
      await delay(1000)
      closeNotification()
      usersStore.getUsers()
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
  await usersStore.deleteUser(selectedItem.value.id)
  loadingStore.stopLoading()
  modalActive.value = true
  await delay(1000)
  closeNotification()
  usersStore.getUsers()
}

//edit type
const selectedEditItem = ref({})
const isEdit = ref(false)
function editModalToggle(item) {
  listTenants.value = item.tenant.map((item) => item.id)
  isEdit.value = true
  selectedEditItem.value = item
}

function cancelEdit() {
  submitLabel = 'Submit'
  submitClicked = 0
  password.value = ''
  selectedEditItem.value = {}
  listTenants.value = ['']
  isEdit.value = false
}

const onEdit = async (values, { resetForm }) => {
  let newValues = values
  newValues.tenantIds = listTenants.value
  submitClicked = ++submitClicked
  if (submitClicked === 1) {
    submitLabel = 'the data entered is correct?'
  }
  if (submitClicked === 2) {
    loadingStore.startLoading()
    await usersStore.editUser(selectedEditItem.value.id, newValues)
    loadingStore.stopLoading()
    submitLabel = 'Submit'
    submitClicked = 0
    modalActive.value = true
    if (status.value.isError) {
      await delay(1500)
      closeNotification()
    } else {
      resetForm()
      isEdit.value = false
      listTenants.value = ['']
      await delay(1000)
      closeNotification()
      usersStore.getUsers()
    }
  }
}

const user = localStorage.getItem('auth.user')
</script>
<template>
  <DeleteConfirmationModal
    :isOpen="isModalPops"
    @close="isModalPops = false"
    :item="selectedItem.name"
    @delete="deleteItem"
  />
  <alert
    :message="status.message"
    :modalActive="modalActive"
    :isError="status.isError"
    @close="closeNotification"
  />
  <div class="grid grid-cols-3 px-8 gap-8 flex-1">
    <div class="flex flex-col gap-4 col-span-2">
      <div class="grid grid-row gap-6 md:gap-10">
        <div class="flex flex-col md:flex-row gap-4 md:justify-between">
          <SearchBar v-model="searchValue" />
        </div>
      </div>
      <EasyDataTable
        :rows-per-page="10"
        table-class-name="customize-table"
        :headers="header"
        :items="users"
        theme-color="#1363df"
        :search-value="searchValue"
        :loading="isLoading"
      >
        <template #item-tenant="item">
          <div class="flex gap-2">
            <div
              v-for="data in item.tenant"
              class="bg-accent-1 rounded-full text-center text-white w-fit min-w-[80px] py-1 px-2"
            >
              {{ data.name }}
            </div>
          </div>
        </template>
        <template #item-operation="item">
          <div class="operation">
            <svg
              class="cursor-pointer hover:scale-110 duration-200"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              @click="editModalToggle(item)"
            >
              <path
                d="M6.03984 17.625C6.08672 17.625 6.13359 17.6203 6.18047 17.6133L10.1227 16.9219C10.1695 16.9125 10.2141 16.8914 10.2469 16.8563L20.182 6.92109C20.2038 6.89941 20.221 6.87366 20.2328 6.8453C20.2445 6.81695 20.2506 6.78656 20.2506 6.75586C20.2506 6.72516 20.2445 6.69477 20.2328 6.66642C20.221 6.63806 20.2038 6.61231 20.182 6.59063L16.2867 2.69297C16.2422 2.64844 16.1836 2.625 16.1203 2.625C16.057 2.625 15.9984 2.64844 15.9539 2.69297L6.01875 12.6281C5.98359 12.6633 5.9625 12.7055 5.95312 12.7523L5.26172 16.6945C5.23892 16.8201 5.24707 16.9493 5.28545 17.071C5.32384 17.1927 5.39132 17.3032 5.48203 17.393C5.63672 17.543 5.83125 17.625 6.03984 17.625V17.625ZM7.61953 13.5375L16.1203 5.03906L17.8383 6.75703L9.3375 15.2555L7.25391 15.6234L7.61953 13.5375V13.5375ZM20.625 19.5938H3.375C2.96016 19.5938 2.625 19.9289 2.625 20.3438V21.1875C2.625 21.2906 2.70937 21.375 2.8125 21.375H21.1875C21.2906 21.375 21.375 21.2906 21.375 21.1875V20.3438C21.375 19.9289 21.0398 19.5938 20.625 19.5938Z"
                class="fill-label-secondary"
                fill-opacity="0.8"
              />
            </svg>
            <svg
              v-if="item.username !== user"
              class="cursor-pointer hover:scale-110 transition-transform duration-200"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              @click="delModalToggle(item)"
            >
              <path
                d="M8.4375 4.3125H8.25C8.35313 4.3125 8.4375 4.22813 8.4375 4.125V4.3125H15.5625V4.125C15.5625 4.22813 15.6469 4.3125 15.75 4.3125H15.5625V6H17.25V4.125C17.25 3.29766 16.5773 2.625 15.75 2.625H8.25C7.42266 2.625 6.75 3.29766 6.75 4.125V6H8.4375V4.3125ZM20.25 6H3.75C3.33516 6 3 6.33516 3 6.75V7.5C3 7.60313 3.08437 7.6875 3.1875 7.6875H4.60312L5.18203 19.9453C5.21953 20.7445 5.88047 21.375 6.67969 21.375H17.3203C18.1219 21.375 18.7805 20.7469 18.818 19.9453L19.3969 7.6875H20.8125C20.9156 7.6875 21 7.60313 21 7.5V6.75C21 6.33516 20.6648 6 20.25 6ZM17.1398 19.6875H6.86016L6.29297 7.6875H17.707L17.1398 19.6875Z"
                fill="#ED424F"
                fill-opacity="0.8"
              />
            </svg>
          </div>
        </template>
      </EasyDataTable>
    </div>
    <div
      class="rounded-lg border-2 border-bkg-secondary px-4 py-6 flex flex-col gap-8"
      v-if="!isEdit"
    >
      <h1 class="text-xl text-label-primary">Create New User</h1>
      <VeeForm
        :validation-schema="schema"
        v-slot="{ handleSubmit, values }"
        :initial-values="{ role: '' }"
        as="div"
        ref="form"
      >
        <form @submit="handleSubmit($event, onSubmit)" class="form-wrapper">
          <BaseInput name="username" type="text" placeholder="Username" label="Userame" required />
          <BaseInput name="email" type="email" placeholder="Email" label="Email" required />
          <div style="position: relative">
            <BaseInput
              name="password"
              :type="passwordType ? 'text' : 'password'"
              placeholder="your password"
              class="outlined"
              label="Password"
            />
            <div style="position: absolute; top: 35%; right: 15px; transform: translatY(-50%)">
              <input
                class="cursor-pointer hidden w-[30px]"
                id="show-password"
                type="checkbox"
                v-model="passwordType"
              />
              <label class="cursor-pointer" for="show-password">
                <img
                  v-if="!passwordType"
                  alt="aid logo"
                  class="w-[24px]"
                  src="../../assets/eye-open.svg"
                  width="200"
                  height="200"
                />
                <img
                  v-if="passwordType"
                  alt="aid logo"
                  class="w-[24px]"
                  src="../../assets/eye-close.svg"
                  width="200"
                  height="200"
                />
              </label>
            </div>
          </div>
          <div style="position: relative">
            <BaseInput
              name="confirmPassword"
              :type="confirmPasswordType ? 'text' : 'password'"
              placeholder="enter confirm password"
              class="outlined"
              label="Confirm Password"
            />
            <div style="position: absolute; top: 35%; right: 15px; transform: translatY(-50%)">
              <input
                class="cursor-pointer hidden w-[30px]"
                id="show-confirmPassword"
                type="checkbox"
                v-model="confirmPasswordType"
              />
              <label class="cursor-pointer" for="show-confirmPassword">
                <img
                  v-if="!confirmPasswordType"
                  alt="aid logo"
                  class="w-[24px]"
                  src="../../assets/eye-open.svg"
                  width="200"
                  height="200"
                />
                <img
                  v-if="confirmPasswordType"
                  alt="aid logo"
                  class="w-[24px]"
                  src="../../assets/eye-close.svg"
                  width="200"
                  height="200"
                />
              </label>
            </div>
          </div>
          <div class="input-wrapper border-label-secondary">
            <label for="role" class="text-[12px] font-semibold select-none text-label-primary"
              >Role</label
            >
            <select name="role" v-model="values.role" class="cursor-pointer text-sm" required>
              <option value="" disabled hidden="">Pilih Role</option>

              <option class="text-sm" value="user">User</option>
              <option class="text-sm" value="admin">Admin</option>
            </select>
          </div>

          <div class="groups flex flex-col gap-2" v-if="values.role !== 'admin'">
            <p class="label">Tenants</p>
            <div class="input-wrapper-tenants" v-for="(value, index) in listTenants" :key="index">
              <select
                name="type"
                v-model="listTenants[index]"
                class="cursor-pointer text-sm w-full mr-1"
                required
              >
                <option v-if="!tenants.length" class="text-sm" value="0" disabled selected>
                  No Tenants Available
                </option>
                <option value="" disabled>Pilih Tenant</option>
                <option
                  class="text-sm"
                  v-for="tenant in tenants"
                  :key="tenant.id"
                  :value="tenant.id"
                  :disabled="listTenants.includes(tenant.id) && listTenants[index] !== tenant.id"
                >
                  {{ tenant.name }}
                </option>
              </select>
              <button
                type="button"
                @click="removeTenant(index)"
                v-if="listTenants.length > 1"
                class="text-sm text-red-500 hover:opacity-80"
              >
                Remove
              </button>
            </div>
            <button
              type="button"
              @click="addTenant"
              class="hover:opacity-80 text-right bg-bkg-secondary w-fit px-2 py-2 rounded-lg text-label-primary text-xs"
            >
              Add Tenant
            </button>
          </div>
          <div class="flex justify-between gap-10">
            <BaseButton
              type="submit"
              class="primary"
              :label="submitLabel"
              :loading="createUserLoading"
            />
          </div>
        </form>
      </VeeForm>
    </div>
    <div
      class="rounded-lg border-2 border-bkg-secondary px-4 py-6 flex flex-col gap-8"
      v-if="isEdit"
    >
      <h1 class="text-xl text-label-primary">Edit User</h1>
      <VeeForm :validation-schema="schemaEditUser" v-slot="{ handleSubmit }" as="div" ref="form">
        <form @submit="handleSubmit($event, onEdit)" class="form-wrapper">
          <div style="position: relative">
            <BaseInput
              name="password"
              :type="password ? 'text' : 'password'"
              placeholder="your password"
              class="outlined"
              label="Password"
            />
            <div style="position: absolute; top: 35%; right: 15px; transform: translatY(-50%)">
              <input
                class="cursor-pointer hidden w-[30px]"
                id="show-password"
                type="checkbox"
                v-model="password"
              />
              <label class="cursor-pointer" for="show-password">
                <img
                  v-if="!password"
                  alt="aid logo"
                  class="w-[24px]"
                  src="../../assets/eye-open.svg"
                  width="200"
                  height="200"
                />
                <img
                  v-if="password"
                  alt="aid logo"
                  class="w-[24px]"
                  src="../../assets/eye-close.svg"
                  width="200"
                  height="200"
                />
              </label>
            </div>
          </div>
          <div style="position: relative">
            <BaseInput
              name="confirmPassword"
              :type="confirmPasswordType ? 'text' : 'password'"
              placeholder="enter confirm password"
              class="outlined"
              label="Confirm Password"
            />
            <div style="position: absolute; top: 35%; right: 15px; transform: translatY(-50%)">
              <input
                class="cursor-pointer hidden w-[30px]"
                id="show-confirmPassword"
                type="checkbox"
                v-model="confirmPasswordType"
              />
              <label class="cursor-pointer" for="show-confirmPassword">
                <img
                  v-if="!confirmPasswordType"
                  alt="aid logo"
                  class="w-[24px]"
                  src="../../assets/eye-open.svg"
                  width="200"
                  height="200"
                />
                <img
                  v-if="confirmPasswordType"
                  alt="aid logo"
                  class="w-[24px]"
                  src="../../assets/eye-close.svg"
                  width="200"
                  height="200"
                />
              </label>
            </div>
          </div>

          <div class="groups flex flex-col gap-2" v-if="selectedEditItem.role !== 'admin'">
            <p class="label">Tenants</p>
            <div class="input-wrapper-tenants" v-for="(value, index) in listTenants" :key="index">
              <select
                name="type"
                v-model="listTenants[index]"
                class="cursor-pointer text-sm w-full mr-1"
                required
              >
                <option v-if="!tenants.length" class="text-sm" value="0" disabled selected>
                  No Tenants Available
                </option>
                <option value="" disabled>Pilih Tenant</option>
                <option
                  class="text-sm"
                  v-for="tenant in tenants"
                  :key="tenant.id"
                  :value="tenant.id"
                  :disabled="listTenants.includes(tenant.id) && listTenants[index] !== tenant.id"
                >
                  {{ tenant.name }}
                </option>
              </select>
              <button
                type="button"
                @click="removeTenant(index)"
                v-if="listTenants.length > 1"
                class="text-sm text-red-500 hover:opacity-80"
              >
                Remove
              </button>
            </div>
            <button
              type="button"
              @click="addTenant"
              class="hover:opacity-80 text-right bg-bkg-secondary w-fit px-2 py-2 rounded-lg text-label-primary text-xs"
            >
              Add Tenant
            </button>
          </div>
          <div class="flex justify-between gap-10">
            <BaseButton
              type="button"
              class="secondary"
              label="Cancel"
              :loading="editUserLoading"
              @click="cancelEdit"
            />
            <BaseButton
              type="submit"
              class="primary"
              :label="submitLabel"
              :loading="editUserLoading"
            />
          </div>
        </form>
      </VeeForm>
    </div>
  </div>
</template>

<style scoped>
p {
  @apply select-none;
}

.input-wrapper-tenants {
  @apply flex justify-between gap-1 text-left w-full px-4 py-2 rounded-[10px] border border-label-secondary hover:opacity-80;
}

.input-wrapper {
  @apply flex flex-col gap-1 text-left w-full px-4 py-2 rounded-[10px] border;
}

.text-field {
  @apply flex flex-col gap-1;
}

.label {
  @apply text-[12px] font-semibold select-none text-label-primary;
}

input {
  @apply outline-none text-[14px] bg-transparent font-medium text-label-primary;
}

input::placeholder {
  @apply text-[14px] text-label-secondary font-normal;
}

.modal {
  @apply fixed top-0 left-0 w-full h-full overflow-x-hidden overflow-y-auto bg-[#ABADAF]/20 z-50;
}

.modal-inner {
  @apply max-w-[500px] my-[100px] mx-auto;
}

.modal-content {
  @apply relative w-[600px] p-[40px] bg-white rounded-xl gap-[40px] flex flex-col;
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
  @apply flex justify-between gap-8;
}
</style>
