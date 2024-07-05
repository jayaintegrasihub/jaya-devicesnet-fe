<template>
  <div class="tab">
    <button v-for="(tab, index) in tabs" :key="tab.value"
        @click="$emit('clicked', tab.value)"
        class="nav"
        :value="index"
        :id="tab.value"
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
  @apply flex justify-between w-full border border-bkg-tertiary rounded-lg shadow-inner p-1 bg-bkg-secondary gap-2
}
button {
  @apply disabled:opacity-75 flex justify-center items-center relative text-label-secondary cursor-pointer py-[6px]  rounded-md
    w-[full] text-[10px] sm:text-[14px] font-medium px-6
} 

button:hover {
  @apply  bg-bkg-primary text-accent-1  
  transition-colors duration-700 
}

.active {
  @apply bg-bkg-primary text-accent-1  
  transition-colors duration-300 
}

.active:hover {
  @apply bg-bkg-primary text-accent-1 
  transition-colors duration-300 cursor-default
}




</style>