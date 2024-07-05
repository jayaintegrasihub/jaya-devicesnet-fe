<template>
  <div v-bind="$attrs" class="input-wrapper border-label-secondary" :class="{ 'border-[#ED424F] !important': errorMessage }">
    <div class="flex gap-2 items-center">
      <label v-if="props.label" :for="name">{{ props.label }}</label>
      <span class="error-message" v-if="errorMessage">{{ errorMessage }} !!!</span>
    </div>
    <select :id="name" :name="props.name" v-model="value">
      <option v-if="options.length === 0" value="0" disabled>No Type Available</option>
      <option v-for="option in options" :key="option.id" :value="option.id">
        {{ option.name }}
      </option>
    </select>
  </div>
</template>


<script setup>
import { useField } from 'vee-validate';

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: null },
  options: { type: Array, required: true },
  modelValue: { type: [String, Number], default: null }, // Allow for string or number values
});

const { value, errorMessage } = useField(props.name);
</script>


<style scoped>
.input-wrapper {
  @apply flex flex-col gap-1 text-left w-full px-4 py-2 rounded-[10px] border
}

select {
  @apply cursor-pointer text-[14px] font-medium bg-transparent outline-none text-label-primary
}

label {
  @apply text-[12px] font-semibold select-none text-label-primary
}

option {
  @apply text-black
}

.error-message {
  @apply text-xs text-[#F15412]
}
</style>