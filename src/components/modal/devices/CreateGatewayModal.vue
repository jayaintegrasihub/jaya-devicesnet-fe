<template>
  <transition name="fade">
    <div class="modal" v-show="isOpen">
      <transition name="drop-in">
        <div class="modal-inner" v-show="isOpen" ref="target">
          <div class="modal-content">
            <h1 class="title">{{ title }}</h1>
            <VeeForm :validation-schema="schema" v-slot="{ handleSubmit }" as="div" ref="form">
              <form @submit="handleSubmit($event, onSubmit)" class="form-wrapper">
                <BasicInput name="serialNumber" type="text" placeholder="Serial Number" label="Serial Number" />
                <BasicInput name="alias" type="text" placeholder="Alias" label="Alias" />
                <BasicDropdown name="tenantId" placeholder="Tenant" label="Tenant" :options="tenants" />
                <div class="input-wrapper border-label-secondary">
                  <label for="type" class="text-[12px] font-semibold select-none text-label-primary">Device Type</label>
                  <select name="type" v-model="selectedType" @change="fillGroupList" class="cursor-pointer text-sm" required>
                    <option v-if="!types.length" class="text-sm" value="0" disabled selected>No Type Available
                    </option>
                    <option class="text-sm" v-for="deviceType in types" :key="deviceType.id" :value="deviceType">
                      {{ deviceType.name }}
                    </option>
                  </select>
                </div>
                <!-- <TypeDropdown name="type" placeholder="Device Type" label="Device Type" :options="types"
                  v-model="selectedType" @change="fillGroupList" /> -->
                <BasicInput v-for="(group, index) in type.groups" :name="groupPrefix + group" type="text"
                  :placeholder="group" :label="group" />
                <BasicInput name="description" type="text" placeholder="Notes" label="Notes" />
                <div class="flex justify-between gap-10">
                  <BasicButton type="button" class="secondary" :label="cancelLabel" @click="cancelForm" />
                  <BasicButton type="submit" class="primary" :label="registerLabel" />
                </div>
              </form>
            </VeeForm>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>


<script setup>
import TypeDropdown from '@/components/input/TypeDropdown.vue'
import { Form as VeeForm } from 'vee-validate'
import { storeToRefs } from 'pinia'
import { ref, onBeforeUpdate } from 'vue'
import { onClickOutside } from '@vueuse/core'
import * as yup from 'yup'
import { useGatewaysStore } from '@/stores/master-data/gateways-store'
import { useTypesStore } from '@/stores/master-data/types-store'
import { useTenantsStore } from '@/stores/master-data/tenants-store'
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))


onBeforeUpdate(() => {
  typesStore.getTypes()
  tenantsStore.getTenants()
  type.value.groups = {}
  selectedType.value = {}
  console.log(type.value.groups)
  console.log(selectedType.value)
})

//props
const props = defineProps({
  isOpen: Boolean,
  title: String
})

const selectedType = ref({})
const groupPrefix = 'group'
async function fillGroupList() {
  console.log(selectedType.value)
  await typesStore.getType(selectedType.value.id)
}
// Define custom events
const emits = defineEmits(['close'])
const form = ref(null)
const target = ref(null)
onClickOutside(target, () => {
  if (props.isOpen) {
    emits('close')
    regButtonClick.value = 0
    registerLabel.value = 'SUBMIT'
    cancelButtonClick.value = 0
    cancelLabel.value = 'CANCEL'
  }
})

//validation schema
const schema = yup.object({
  serialNumber: yup.string().required().label(' '),
  alias: yup.string().required().label(' '),
  tenantId: yup.string().required().label(' '),
  description: yup.string().required().label(' '),
})

//stores
const typesStore = useTypesStore()
const { types, type, status, isLoading } = storeToRefs(useTypesStore())
const tenantsStore = useTenantsStore()
const { tenants } = storeToRefs(useTenantsStore())
const gatewaysStore = useGatewaysStore()
const { gateways } = storeToRefs(useGatewaysStore())

//alert control
const modalActive = ref(false)
const closeNotification = () => {
  modalActive.value = false
}

//button label and action variable
const cancelLabel = ref('CANCEL')
const registerLabel = ref('REGISTER')
const regButtonClick = ref(0)
const cancelButtonClick = ref(0)

//cancel form handler
function cancelForm() {
  cancelButtonClick.value = ++cancelButtonClick.value
  switch (cancelButtonClick.value) {
    case 1:
      cancelLabel.value = 'The entered data will be lost!'
      break;
    case 2:
      form.value.resetForm()
      emits('close')
      cancelButtonClick.value = 0
      cancelLabel.value = 'CANCEL'
      break;
  }
}

const onSubmit = async (values, { resetForm }) => {
  let newValues = {}
  let groups = {}
  console.log(selectedType.value)

  for (const key in values) {
    if (key.startsWith(groupPrefix)) {
      const groupName = key.substring(groupPrefix.length); // Remove the prefix
      groups[groupName] = values[key].toUpperCase()
    } else {
      newValues[key] = values[key]
    }
  }
  newValues.group = groups
  const { ...rest } = newValues;
  const payload = {
    type: selectedType.value.name,
    ...rest
  }

  console.log(payload);
  regButtonClick.value = ++regButtonClick.value
  if (regButtonClick.value == 1) {
    registerLabel.value = 'the data entered is correct?'
  }

  if (regButtonClick.value == 2) {
    await gatewaysStore.createGateway(payload)
    modalActive.value = true
    if (status.value.isError) {
      setTimeout(closeNotification, 3000)
    } else {
      setTimeout(closeNotification, 3000)
      resetForm()
    }
    registerLabel.value = 'REGISTER'
    regButtonClick.value = 0
    emits('close')
    await delay(1000)
    gatewaysStore.getGateways()
  }
}

</script>

<style scoped>
.modal {
  @apply fixed top-0 left-0 w-full h-full overflow-x-hidden overflow-y-auto bg-[#ABADAF]/20 z-20
}

.modal-inner {
  @apply max-w-[500px] my-[100px] mx-auto
}

.modal-content {
  @apply relative w-[600px] p-[40px] bg-bkg-secondary rounded-xl gap-[20px] flex flex-col
}

.title {
  @apply text-left border-b-[1px] border-b-bkg-secondary text-[20px] font-semibold text-label-primary
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

.input-wrapper {
  @apply flex flex-col gap-1 text-left w-full px-4 py-2 rounded-[10px] border
}

select {
  @apply cursor-pointer text-[14px] font-medium bg-transparent outline-none text-label-primary
} 
</style>