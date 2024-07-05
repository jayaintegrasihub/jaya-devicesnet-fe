<template>
  <div class="tab">
    <button v-for="(tab, index) in tabs" :key="tab.value"
        @click="$emit('clicked', tab.value)"
        class="nav"
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
      var subNavs = document.getElementsByClassName("nav")
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
  @apply 
    items-start justify-start h-full
    flex flex-col w-[200px] gap-2
    border rounded-lg shadow-inner p-2 bg-white
}

button {
  @apply disabled:opacity-75 flex items-center relative text-[#353535] cursor-pointer p-2 rounded-md
  w-full text-[10px] sm:text-[16px] 
} 

button:hover {
  @apply bg-[#E0F6E8] text-[#353535]  
  transition-colors duration-300 
}

.active {
  @apply bg-[#1363df] text-white
  transition-colors duration-300 
}

.active:hover {
  @apply bg-[#1363df] text-white  
  transition-colors duration-300 
}




</style>