<template>
<transition name="modal-animation">
  <div 
    class="message-modal" 
    :class="{ 'hasError' : isError }"  
    v-show="modalActive">
    <div class="message-wrapper">
      <div class="message"> {{ message }} </div>
    </div>
    <div class="close-btn" @click="close">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="fill: white;transform: ;msFilter: ;"><path d="m16.192 6.344-4.243 4.242-4.242-4.242-1.414 1.414L10.535 12l-4.242 4.242 1.414 1.414 4.242-4.242 4.243 4.242 1.414-1.414L13.364 12l4.242-4.242z"></path></svg>
    </div>
  </div>
</transition>
</template>

<script>
export default {
  props:[
    'message', 'modalActive','isError'
  ],
  setup(props, {emit}) {
    const close = () => {
      emit('close')
    }
    return {
      close
    }
  } 

}
</script>

<style scoped>
/*base design*/
.message-modal { 
  @apply  px-4 py-4 top-6 right-6 gap-5 rounded flex fixed items-end
        text-white text-base z-50
        bg-[#36AE7C] drop-shadow-[0_0_6px_5px_rgba(0,0,0,0.05)] backdrop-blur-xl
}
/*error*/
.hasError {
  @apply  text-white text-base 
          bg-[#ED424F] drop-shadow-[0_0_6px_5px_rgba(0,0,0,0.05)] backdrop-blur-xl
}

.message-wrapper {
  @apply flex items-center gap-2
}

.close-btn svg {
 @apply cursor-pointer
}

/*animation*/
.modal-animation-enter-active,
.modal-animation-leave-active {
  transition: opacity 0.5s ease;
}

.modal-animation-enter-from,
.modal-animation-leave-to {
  opacity: 0;
}
</style>