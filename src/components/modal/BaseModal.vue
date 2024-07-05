<template>
  <div>
    <!-- <alert 
  :message ="status.message"
    :modalActive="modalActive"
    :isError="status.isError"
     @close="closeNotification" /> -->
    <transition name="fade">
      <div class="modal" v-show="isOpen">
        <transition name="drop-in">
          <div class="modal-inner" v-show="isOpen" ref="target">
            <div class="modal-content">
              <h1 class="title">{{ title }}</h1>
              <!-- <VeeForm :validation-schema="schema" v-slot="{ handleSubmit }" as="div" ref="form">
                <form @submit="handleSubmit($event, onSubmit)" class="form-wrapper">
                  <BaseInput name="name" type="text" placeholder="Define vehicle name" class="outlined" label="Vehicle Name"/>
                <div class="flex flex-col gap-1 text-left">
                  <label for="contractorId" class="text-xs font-bold">Vehicle Type</label>
                  <select name="contractorId" v-model="type" class="cursor-pointer select-option text-sm" required>
                    <option v-if="!vehicleTypes.length" class="text-sm" value="0" disabled selected>No Type Available</option>
                    <option class="text-sm" v-for="brand in vehicleTypes" :key="brand.id" :value="brand.name">{{ brand.name }}</option>
                  </select> 
                </div>
                <div class="flex flex-col gap-1 text-left">
                  <label for="contractorId" class="text-xs font-bold">Vehicle Brand</label>
                  <select name="contractorId" v-model="brandName" class="cursor-pointer select-option text-sm" required>
                    <option v-if="!vehicleBrands.length" class="text-sm" value="0" disabled selected>No Brand Available</option>
                    <option class="text-sm" v-for="brand in vehicleBrands" :key="brand.id" :value="brand.name">{{ brand.name }}</option>
                  </select> 
                </div>
                <div class="flex flex-col gap-1 text-left">
                  <label for="contractorId" class="text-xs font-bold">Hull Number</label>
                  <select name="contractorId" v-model="hullNumber" class="cursor-pointer select-option text-sm">
                    <option class="text-sm" value="" >Not Selected</option>
                    <option class="text-sm" v-for="hull in hulls" :key="hull.id" :value="hull.number">{{ hull.number }}</option>
                  </select> 
                </div>
                <div class="flex flex-col gap-1 text-left">
                  <label for="contractorId" class="text-xs font-bold">Contractor</label>
                  <select name="contractorId" v-model="contractorId" class="cursor-pointer select-option text-sm" required @change="fillSitesList(contractorId)">
                    <option v-if="!contractors.length" class="text-sm" value="0" disabled selected>No Contractor Available</option>
                    <option class="text-sm" v-for="contractor in contractors" :key="contractor.id" :value="contractor.id">{{ contractor.name }}</option>
                  </select> 
                </div>
                <div class="flex flex-col gap-1 text-left">
                  <label for="contractorId" class="text-xs font-bold">Site</label>
                  <select name="contractorId" v-model="siteId" class="cursor-pointer select-option text-sm" required>
                    <option v-if="!siteInContractors.length" class="text-sm" disabled selected>No Site Available</option>
                    <option class="text-sm" v-for="site in siteInContractors" :key="site.id" :value="site.id">{{ site.name }}</option>
                  </select> 
                </div>
                <BaseInput name="fabricationYear" type="number" placeholder="Input the fabrication year" class="outlined" label="Fabrication Year"/>
                <BaseInput name="purchaseYear" type="number" placeholder="Input the purchase year" class="outlined" label="Purchase Year"/>
                <BaseInput name="registrationNumber" type="text" placeholder="Input the registration number" class="outlined" label="Registration Number"/>
                <div class="flex justify-between gap-10">
                  <BaseButton type="button" class="filled__softblue" :label="cancelLabel" @click="cancelForm"/>
                  <BaseButton type="submit" class="filled__green" :label="registerLabel" :loading="createVehicleIsLoading"  />
                </div>
                </form>
              </VeeForm> -->
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

  
<script setup>
import BaseInput from '@/components/input/BaseInput.vue'
import BaseButton from '@/components/input/BaseButton.vue'
import { Form as VeeForm } from 'vee-validate'
import { storeToRefs } from 'pinia'
import { ref, onMounted } from 'vue'
import { onClickOutside } from '@vueuse/core'
import * as yup from 'yup'

const schema = yup.object({
  name: yup.string().required().label('Vehicle Name'),
  fabricationYear: yup.number().required().label('Fabrication Year'),
  purchaseYear: yup.number().required().label('Purchase Year'),
  registrationNumber: yup.string().required().label('Registration Number'),
})
const props = defineProps({
  isOpen: Boolean,
  title: String
})

//dropdown var
const brandName = ref('')
const type = ref('')
const hullNumber = ref('')
const contractorId = ref('')
const siteId = ref('')


//stores

onMounted(() => {

})

function fillSitesList(item) {
  contractorsStore.getSites(item)
}

const modalActive = ref(false)
const cancelLabel = ref('CANCEL')
const registerLabel = ref('REGISTER')
const regButtonClick = ref(0)
const cancelButtonClick = ref(0)
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

const onSubmit = async (values, { resetForm }) => {
  values.name = values.name.toUpperCase()
  values.fabricationYear = values.fabricationYear.toString()
  values.purchaseYear = values.purchaseYear.toString()
  values.registrationNumber = values.registrationNumber.replace(/\s/g, '').toUpperCase()
  let newValues = values
  newValues.brandName = brandName.value
  newValues.type = type.value
  newValues.hullNumber = hullNumber.value
  newValues.contractorId = contractorId.value
  newValues.siteId = siteId.value

  console.log(newValues)
  regButtonClick.value = ++regButtonClick.value
  if (regButtonClick.value == 1) {
    registerLabel.value = 'the data entered is correct?'
  }

  if (regButtonClick.value == 2) {

    await vehiclesStore.createVehicle(newValues)
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
    vehiclesStore.getVehicles()
  }
}

const closeNotification = () => {
  modalActive.value = false
}
// Define custom events
const emits = defineEmits(['close'])

const form = ref(null)
const target = ref(null)

onClickOutside(target, () => {
  if (props.isOpen) {
    emits('close')
  }
})

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


</script>
  
<style scoped>
.title {
  @apply text-left border-b-[1px] pb-[18px] text-[20px] font-semibold text-black mb-6
}


.message-wrapper {
  @apply flex items-center gap-2
}

.form-wrapper {
  @apply flex flex-col gap-6
}


.modal {
  @apply fixed top-0 left-0 w-full h-full overflow-x-hidden overflow-y-auto bg-[#ABADAF]/20 z-10
}

.modal-inner {
  @apply max-w-[500px] my-[100px] mx-auto
}

.modal-content {
  @apply relative w-[600px] p-[40px] bg-white gap-[30px] rounded-xl
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

.select-option {
  @apply px-6 py-3 rounded-[5px] border border-[#CFCFCF] bg-[#F2F2F2]
}
</style>