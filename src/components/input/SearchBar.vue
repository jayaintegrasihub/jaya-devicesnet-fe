<template>
  <div>
    <div class="input-wrapper" v-bind="$attrs">
      <span>
        <svg xmlns="http://www.w3.org/2000/svg" id="Outline" viewBox="0 0 24 24" width="512" height="512"><path d="M23.707,22.293l-5.969-5.969a10.016,10.016,0,1,0-1.414,1.414l5.969,5.969a1,1,0,0,0,1.414-1.414ZM10,18a8,8,0,1,1,8-8A8.009,8.009,0,0,1,10,18Z"/></svg>
      </span>
      <input maxlength="40"
        :value="modelValue" 
        @input="$emit('update:modelValue', $event.target.value)"
        placeholder="Search..."
        >
    </div>
  </div>
</template>
<script>

export default {
  props: {
    modelValue: {
    type: [String, Number],
    default: '',
    },
  }
}
</script>

<style scoped>


input {
  @apply flex pl-3 text-[10px] md:text-xs font-medium bg-transparent focus:outline-none w-full h-full text-label-primary
} 

input::placeholder {
  @apply text-[10px] md:text-xs font-medium text-label-secondary
} 

.input-wrapper {
  @apply 
    flex flex-row items-center rounded-lg bg-bkg-secondary p-2 pl-4 hover:bg-bkg-tertiary transition-colors duration-300 h-full md:min-w-[300px]
    border border-bkg-tertiary
}

.floating {
  box-shadow: 0px 0px 11px 1px rgba(0, 0, 0, 0.19);
  @apply rounded-lg
}
.outlined {
  @apply
  border-solid border border-bkg-tertiary rounded-lg
}

svg {
  @apply w-4 h-4 fill-label-secondary
}

</style>