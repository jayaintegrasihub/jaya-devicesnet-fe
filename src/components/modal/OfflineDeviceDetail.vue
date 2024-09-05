<template>
  <transition name="fade">
    <div class="modal" v-show="isOpen">
      <transition name="drop-in">
        <div class="modal-inner" v-show="isOpen" ref="target">
          <div class="modal-content">
            <div class="flex flex-col gap-4 text-center">
              <h1 class="text-lg text-label-primary font-medium">Offline Device Detail</h1>
              <h1 class="font-semibold text-label-primary text-lg">{{ props.id }}</h1>
            </div>
            <div class="flex flex-col gap-2 border-2 border-bkg-tertiary px-4 py-3 rounded-xl" v-for="(value, key) in props.data.group">
              <div class="flex justify-between">
                <p class="text-label-secondary font-medium">{{key}}</p>
              </div>
              <h2 class="text-label-primary font-medium cursor-copy">{{value}}</h2>
            </div>
            <div class="button-wrapper">
              <BaseButton type="button" class="filled__softblue" label="CLOSE" @click="emits('close')" />
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>


<script setup>
import BaseButton from '@/components/input/BaseButton.vue'
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps({
  data: Object,
  isOpen: Boolean,
  item: String,
})


// Define custom events
const emits = defineEmits(['close', 'delete'])

const target = ref(null)

onClickOutside(target, () => {
  if (props.isOpen) {
    emits('close')
  }
})

function onDelete() {
  emits('delete')
  emits('close')
}


</script>

<style scoped>
.modal {
  @apply fixed top-0 left-0 w-full h-full overflow-x-hidden overflow-y-auto bg-[#ABADAF]/20 z-10
}

.modal-inner {
  @apply max-w-[500px] my-[100px] mx-auto
}

.modal-content {
  @apply relative w-[400px] p-[40px] bg-bkg-secondary rounded-xl gap-[20px] flex flex-col
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