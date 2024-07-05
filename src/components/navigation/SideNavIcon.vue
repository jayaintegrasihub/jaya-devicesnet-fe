<template>
  <router-link :class="{ 'active': isActive, 'expanded': isExpanded }" :to="route" class="icon-link">
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path :d="path" />
      <slot></slot>
    </svg>
    <p class="text-[12px] transition-all duration-300 text-label-primary">{{ menuName }}</p>
    <div class="flying-text">
      <p>{{ menuName }}</p>
    </div>
  </router-link>
</template>

<script setup>

import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia';
const { isDark } = storeToRefs(useThemeStore())
const props = defineProps({
  isExpanded: Boolean,
  isActive: Boolean,
  menuName: String,
  active: {
    type: String,
    default: 'active',
  },
  route: {
    type: [String, Object],
    required: true,
  },
  path: {
    type: String,
  }
});
</script>

<style scoped>
.icon-link {
  @apply relative z-50 flex justify-start py-2 transition-all duration-300 w-[214px] gap-6 px-4 items-center
}

.expanded {
  @apply justify-start
}

svg {
  @apply cursor-pointer transition-all ease-in-out z-50 fill-label-secondary
}


.active {
  @apply border-l-4 border-accent-1 z-50 px-3 
}

.active svg {
  @apply fill-accent-1 z-50
}

svg:hover {
  @apply scale-110
}

svg:hover+.flying-text {
  @apply scale-100
}

.flying-text {
  @apply absolute w-auto py-2 px-8 ml-4 min-w-max left-12 rounded-md shadow-md text-label-primary bg-gray-900 text-xs font-bold transition-all duration-200 scale-0 origin-left z-50
}
</style>