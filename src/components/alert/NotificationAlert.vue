<template>
<transition name="modal-animation">
  <div 
    class="message-modal" 
    :class="{ 'hasError' : isError }"  
    v-show="modalActive">
    <div class="message-wrapper">
      <h1 class="font-medium">There is an violation</h1>
      <p class="font-normal">Time: {{ message.timestamp }}</p>
      <p class="font-normal">Hull: {{ message.hullNumber }}</p>
      <p class="font-normal">Contractor: {{ message.timestamp }}</p>
      <p class="font-normal">Coordinate: {{ message.latitude }},{{ message.longitude }}</p>
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
  @apply  px-4 py-4 bottom-6 left-16 gap-5 rounded flex fixed items-start
        text-[white] text-base z-50
        bg-[#71D451]/20 drop-shadow-[0_0_6px_5px_rgba(0,0,0,0.05)] backdrop-blur-xl border-l-[10px] border-[#71D451]
}
/*error*/
.hasError {
  @apply  text-[white] text-base 
          bg-[#ED424F] drop-shadow-[0_0_6px_5px_rgba(0,0,0,0.05)] backdrop-blur-xl border-l-[10px] border-[#ED0000]
}

.message-wrapper {
  @apply flex flex-col gap-2 text-left
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