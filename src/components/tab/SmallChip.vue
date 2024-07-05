<template>
  <div class="tab">
    <button v-for="(tab, index) in tabs" :key="tab.value"
        @click="$emit('clicked', tab.value)"
        class="smallNav"
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
      var subNavs = document.getElementsByClassName("smallNav")
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
  @apply w-full grid grid-cols-4 
}
button {
  @apply disabled:opacity-75 flex justify-center items-center relative text-[#353535] cursor-pointer p-2
    w-[full] text-[10px] sm:text-[14px] font-medium
    border-b border-[#D9D9D9]
    outline-none
} 

button:hover {
  @apply bg-[#f2f2f2]/60 text-[#93C76A]  border-[#93C76A]
  transition-colors duration-300 
}

.active {
  @apply text-[#93C76A] bg-white border-b-2 border-[#93C76A]
  transition-colors duration-300 
}

.active:hover {
  @apply bg-[#93C76A] text-white  
  transition-colors duration-300 
}




</style>