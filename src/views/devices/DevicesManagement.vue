<script>
import { onMounted } from 'vue'
import GatewayMaster from './GatewayMaster.vue'
import NodeMaster from './NodeMaster.vue'
import Tab from '@/components/tab/Tab.vue'
import { useLocalStorage } from '@vueuse/core'
export default {
  components: {
    Tab, GatewayMaster, NodeMaster
  },
  props: ['id'],

  setup(props) {
    const selectedComponent = useLocalStorage('SelectedDeviceTab', 'GatewayMaster')
    const tabs = [
      {
        title: 'Gateway',
        value: 'GatewayMaster',
      },
      {
        title: 'Node',
        value: 'NodeMaster',
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
  <div class="flex">
    <SideNav :isDevicesManagementActive="true" />
    <div class="flex flex-col w-screen">
      <TopBar>
        <p class="text-label-primary">Devices Provisioning</p>
      </TopBar>
      <div class=" m-[20px] flex-1 py-8 bg-bkg-primary rounded-[10px] shadow border border-bkg-secondary flex-col gap-5 flex">
        <div class="mx-8 grid grid-row gap-6 md:gap-10">
          <div class="md:w-fit">
            <Tab :tabs="tabs" @clicked="changeNavigation" />
          </div>
        </div>
        <component :is="selectedComponent" />
      </div>
    </div>
  </div>
</template>

<style scoped>
p {
  @apply select-none
}
</style>
