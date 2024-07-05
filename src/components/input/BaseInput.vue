<template>
  <div v-bind="$attrs" class="input-wrapper border-label-secondary" :class="{'border-[#ED424F] !important' : errorMessage}">
    <div class="flex gap-2 items-center">
      <label v-show="props.label" :for="name">{{ props.label }}</label>
      <span class="error-message" v-show="errorMessage">{{ errorMessage }} !!!</span>
    </div>
    <input class="text-field" :id="name"
      :name="props.name" :type="props.type" v-model="value" :placeholder="props.placeholder" :required="props.required"/>
  </div>
</template>

<script setup>
import { useField } from 'vee-validate'

const props = defineProps(['name', 'label', 'type', 'placeholder', 'modelValue', 'required'])

const { value, errorMessage } = useField(props.name)


</script>

<style scoped>
.input-wrapper {
  @apply flex flex-col gap-1 text-left w-full px-4 py-2 rounded-[10px] border 
}
.text-field {
  @apply flex flex-col gap-1
}

label {
  @apply text-[12px] font-semibold select-none text-label-primary
}

input {
  @apply outline-none text-[14px] bg-transparent font-medium text-label-primary
}

input::placeholder {
  @apply text-[14px] text-label-secondary font-normal
}

.error-message {
  @apply text-xs text-[#F15412]
}
</style>