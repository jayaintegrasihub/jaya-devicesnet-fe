<template>
  <alert :message="editGatewayStatus.message" :modalActive="modalActive" :isError="editGatewayStatus.isError"/>
  <transition name="fade">
    <div class="modal" v-show="isOpen">
      <transition name="drop-in">
        <div class="modal-inner" v-show="isOpen" ref="target">
          <div class="modal-content">
            <h1 class="title">{{ title }}</h1>
            <VeeForm :validation-schema="schema" v-slot="{ handleSubmit }" as="div" ref="form">
              <form @submit="handleSubmit($event, onSubmit)" class="form-wrapper">
                <BasicInput v-model="props.formData.serialNumber" name="serialNumber" type="text"
                  placeholder="Serial Number" label="Serial Number" />
                <BasicInput v-model="props.formData.alias" name="alias" type="text" placeholder="Alias" label="Alias" />
                <BasicDropdown v-model="props.formData.tenantId" name="tenantId" placeholder="Tenant" label="Tenant"
                  :options="tenants" />
                <TypeDropdown name="type" placeholder="Device Type" label="Device Type" :options="types"
                  v-model="selectedType" @change="fillGroupList" />
                <!-- <BasicInput v-for="(value, key) in props.formData.group" :name="groupPrefix + key" type="text"
                  :placeholder="key" :label="key" v-model="props.formData.group[key]" /> -->
                <BasicInput v-for="group in type.groups" :name="groupPrefix + group" type="text"
                  :placeholder="group" :label="group" v-model="selectedGroup[group]" :required="true"/>
                <BasicInput v-model="props.formData.description" name="description" type="text" placeholder="Notes"
                  label="Notes" />
                <div class="flex justify-between gap-10">
                  <BasicButton type="button" class="secondary" :label="cancelLabel" @click="cancelForm" />
                  <BasicButton type="submit" class="primary" :label="registerLabel" :loading="editGatewayLoading"/>
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

//props
const props = defineProps({
  isOpen: Boolean,
  title: String,
  formData: {
    type: Object,
    // default: () => ({ imeiNumber: '', simNumber: '', simProvider: '', type: '', manufacturerName: '', variantName: '', notes: '' })
  }
})

const selectedGroup = ref({})
const selectedType = ref({})
const groupPrefix = 'group'

onBeforeUpdate(async () => {
  console.log(props.formData)
  await typesStore.getTypes()
  await tenantsStore.getTenants()
  props.formData.tenantId = props.formData.tenant.id
  selectedGroup.value = props.formData.group
  types.value.forEach(data => {
    if (data.name === props.formData.type) {
      selectedType.value = data
      fillGroupList()
    }
  })
})

async function fillGroupList() {
  await typesStore.getType(selectedType.value.id)
  console.log(type.value)
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
  type: yup.object().required().label(' '),
  description: yup.string().required().label(' '),
})

//stores
const typesStore = useTypesStore()
const { types, type } = storeToRefs(useTypesStore())
const tenantsStore = useTenantsStore()
const { tenants } = storeToRefs(useTenantsStore())
const gatewaysStore = useGatewaysStore()
const { editGatewayLoading, editGatewayStatus } = storeToRefs(useGatewaysStore())

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
      emits('close')
      cancelButtonClick.value = 0
      cancelLabel.value = 'CANCEL'
      break;
  }
}


const onSubmit = async (values, { resetForm }) => {
  let newValues = {}
  let groups = {}

  for (const key in values) {
    if (key.startsWith(groupPrefix)) {
      const groupName = key.substring(groupPrefix.length); // Remove the prefix
      groups[groupName] = values[key].toUpperCase()
    } else {
      newValues[key] = values[key]
    }
  }
  newValues.group = groups
  const { type: { name: typeName }, ...rest } = newValues;
  const payload = {
    type: typeName,
    ...rest
  }

  console.log(payload)
  regButtonClick.value = ++regButtonClick.value
  if (regButtonClick.value == 1) {
    registerLabel.value = 'the data entered is correct?'
  }

  if (regButtonClick.value == 2) {
    await gatewaysStore.editGateway(props.formData.id, payload)
    modalActive.value = true
    if (editGatewayStatus.value.isError) {
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
</style>