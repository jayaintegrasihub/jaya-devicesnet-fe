<template>
  <div :class="loading ? 'appLoading appLoading-loading' : 'appLoading'">
    <div v-if="loading" class="appLoading__backdrop">
      <div class="appLoading__wrapper">
        <div class="lottie">
          <LottieAnimation ref="anim" :animation-data="animationData" :loop="true" :auto-play="true" :speed="1"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { LottieAnimation } from "lottie-web-vue"
import animationData from '@/assets/animations/loading_anim.json'
import { ref } from "vue"

export default {
  components: { LottieAnimation },
  props: [
    'loading', 'message'
  ],
  setup() {
    let anim = ref()
    return {
      anim, animationData
    }
  }

}



</script>

<style scoped>
.appLoading {
  @apply z-50 fixed
}

.appLoading__backdrop {
  @apply bg-[#FEFEFE]/40 backdrop-blur-[2px]
  /* bg-transparent */
  fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center
}

.appLoading__text {
  @apply animate-pulse text-lg text-[#f2f2f2]
}
</style>