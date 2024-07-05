<script setup>
import { useLoadingStore } from '@/stores/loading-store'
import { RouterLink, RouterView } from 'vue-router'
const themeStore = useThemeStore()
import { useThemeStore } from '@/stores/theme'
import { onMounted } from 'vue'

const loadingStore = useLoadingStore()

onMounted(() => {
  themeStore.switchTheme()
  // realtimeNotificationStore.getRealtimeNotification()
})

</script>

<template>
  <RouterView/>
  <loading :loading="loadingStore.loading"/>

</template>

<style>
:root {
  @apply bg-bkg-base
}
</style>
