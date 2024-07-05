<template>
  <!-- <div class="indicator" 
  :class="status? 'indicator-on' : 'indicator-off'">
  </div> -->
  <div class="relative flex h-3 w-3">
    <span class="absolute inline-flex h-full w-full rounded-full opacity-75" :class="status == 'ONLINE' ? 'indicator-on' : 'indicator-off'"></span>
    <span class="relative inline-flex rounded-full h-3 w-3" :class="status == 'ONLINE' ?  'status-on' : 'status-off'"></span>
  </div> 
</template>

<script>
  export default {
    props:
    [ 'status' ]
  }
</script>



<style scoped>
.indicator {
  @apply w-2 h-2 box-border rounded-full
}
.indicator-on {
  @apply animate-ping bg-[#36AE7C]
}
.indicator-off {
  @apply bg-[#EC4D2D]
  shadow-sm
  border
}
.status-on {
  @apply bg-[#36AE7C]
}
.status-off {
  @apply bg-[#EC4D2D]
}
</style>