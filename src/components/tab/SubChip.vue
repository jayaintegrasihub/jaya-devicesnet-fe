<template>
  <div class="tab">
    <button v-for="(tab, index) in tabs" :key="tab.value"
        @click="$emit('clicked', tab.value)"
        class="subnav"
        :value="index"
        :id="tab.title"
        >{{tab.title}}
      </button>
  </div>
</template>

<script>

export default {
  props:[
    'tabs'
  ],
  setup(props, {emit}) {
    
    function changeTable(event) {
      var subNavs = document.getElementsByClassName("subnav")
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
  @apply w-full grid grid-cols-4 gap-[14px]
}
button {
  @apply disabled:opacity-75 flex justify-center items-center relative text-[#353535] cursor-pointer p-2 rounded-md
    w-[full] text-[10px] sm:text-[12px]
    border border-[#D9D9D9]
} 

button:hover {
  @apply bg-[#f2f2f2]/60 text-[#353535]  
  transition-colors duration-300 
}

.active {
  @apply bg-[#93C76A] text-white
  transition-colors duration-300 
}

.active:hover {
  @apply bg-[#93C76A] text-white  
  transition-colors duration-300 
}




</style>