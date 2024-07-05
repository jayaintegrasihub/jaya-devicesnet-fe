<template>
  <div class="tab">
    <button v-for="(tab, index) in tabs" :key="tab.value"
        @click="$emit('clicked', tab.value)"
        class="largeNav"
        :value="index"
        :id="tab.value"
        >
        <Icon width="30" height="30" viewBox="0 0 30 30" :path="tab.icon"/>
        {{tab.title}}
      </button>
  </div>
</template>

<script>
import Icon from '../Icon.vue';

export default {
  components: {
    Icon
  },
  props:[
    'tabs', 'icon'
  ],
  setup(props, {emit}) {
    
    function changeTable(event) {
      var subNavs = document.getElementsByClassName("largeNav")
      for (var i of subNavs) {
        console.log(i)
        i.classList.remove("active");
      }
      event.target.className += " active"
    }
    return {
      changeTable
    }
  }
}
</script>

<style scoped>

.tab {
  @apply w-fit grid grid-rows-2 gap-[14px] h-fit
}
button {
  @apply disabled:opacity-75 flex flex-col gap-4 justify-center items-center relative 
  text-[#353535] cursor-pointer p-4 rounded-md
    w-[full] text-[10px] sm:text-[14px] font-semibold
    border-2 border-[#D9D9D9]
    
} 

button:hover {
  @apply bg-[#f2f2f2]/60 text-[#353535]  
  transition-colors duration-300 
}

.active {
  @apply border-2 border-[#C21629] text-[#C21629]
  transition-colors duration-300 
}

.active:hover {
  @apply border-2 border-[#C21629] text-[#C21629]
  transition-colors duration-300 
}

svg .active {
  @apply border-none
}



</style>