<script>
import { onMounted } from 'vue'
import Tab from '@/components/tab/Tab.vue'
import { useLocalStorage } from '@vueuse/core'
import TypeMaster from './TypeMaster.vue'
import TenantsMaster from './TenantsMaster.vue'
import ApiKeyMaster from './ApiKeyMaster.vue'
export default {
  components: {
    Tab, TypeMaster, TenantsMaster, ApiKeyMaster
  },
  props: ['id'],

  setup(props) {
    const selectedComponent = useLocalStorage('SelectedMasterDataTab', 'TypeMaster')
    const tabs = [
      {
        title: 'Type',
        value: 'TypeMaster',
      },
      {
        title: 'Tenants',
        value: 'TenantsMaster',
      },
      {
        title: 'API Key',
        value: 'ApiKeyMaster',
      }
    ]

    function changeNavigation(navigation) {
      var subNavs = document.getElementsByClassName("nav")
      console.log(subNavs)
      for (var i of subNavs) {
        i.classList.remove("active");
      }
      console.log(navigation)
      // event.target.classList.add("active")
      event.target.className += " active"
      selectedComponent.value = navigation
    }

    onMounted(async () => {
      var element = document.getElementById(selectedComponent.value)
      element.classList.add("active")
    })

    return {
      selectedComponent,
      tabs,
      changeNavigation
    }
  }
}
</script>
<template>
  <div class="flex relative">
    <SideNav :isMasterDataActive="true" />
    <div class="flex flex-col w-screen">
      <TopBar>
        <p class="text-label-primary">Master Data</p>
      </TopBar>
      <div class="master-data-tab">
        <div class="tab">
          <button v-for="(tab, index) in tabs" :key="tab.value" @click="changeNavigation(tab.value)" class="nav"
            :value="index" :id="tab.value">{{ tab.title }}
          </button>
        </div>
      </div>
      <div
        class="m-[20px] flex-1 py-8 bg-bkg-primary rounded-[10px] shadow border border-bkg-secondary flex-col gap-5 flex">
        <component :is="selectedComponent" />
      </div>
    </div>
  </div>
</template>

<style scoped>
p {
  @apply select-none
}

.master-data-tab {
  @apply h-20 shadow-md flex sticky top-[60px] px-5 py-4 gap-10 border-b-2 border-label-tertiary bg-bkg-primary z-20
}

.master-data-tab h1 {
  @apply font-medium text-2xl
}

.tab {
  @apply flex justify-between w-fit border border-bkg-tertiary rounded-lg shadow-inner p-1 bg-bkg-secondary gap-2
}

button {
  @apply disabled:opacity-75 flex justify-center items-center relative text-label-primary cursor-pointer py-[6px] rounded-md w-[full] text-[10px] sm:text-[14px] font-medium px-6
}

button:hover {
  @apply bg-bkg-primary text-label-primary transition-colors duration-700
}

.active {
  @apply bg-bkg-primary text-label-primary transition-colors duration-300
}

.active:hover {
  @apply bg-bkg-primary text-label-primary transition-colors duration-300 cursor-default
}
</style>
