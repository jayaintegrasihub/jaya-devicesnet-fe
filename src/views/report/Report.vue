<script>
import { onMounted } from 'vue'
import Tab from '@/components/tab/Tab.vue'
import SummaryReport from './SummaryReport.vue'
import SpecificReport from './SpecificReport.vue'
import { useLocalStorage } from '@vueuse/core'
export default {
  components: {
    Tab,
    SummaryReport,
    SpecificReport
  },
  props: ['id'],

  setup(props) {
    const selectedComponent = useLocalStorage('SelectedReportTab', 'SummaryReport')
    const tabs = [
      {
        title: 'Summary',
        value: 'SummaryReport'
      },
      {
        title: 'Specific',
        value: 'SpecificReport'
      }
    ]

    function changeNavigation(navigation) {
      var subNavs = document.getElementsByClassName('nav')
      console.log(subNavs)
      for (var i of subNavs) {
        i.classList.remove('active')
      }
      console.log(navigation)
      // event.target.classList.add("active")
      event.target.className += ' active'
      selectedComponent.value = navigation
    }

    onMounted(async () => {
      var element = document.getElementById(selectedComponent.value)
      element.classList.add('active')
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
    <SideNav :isReport="true" />
    <div class="flex flex-col w-screen">
      <TopBar>
        <p class="text-label-primary">Data Completeness Report</p>
      </TopBar>
      <div
        class="m-[20px] flex-1 py-8 bg-bkg-primary rounded-[10px] shadow border border-bkg-secondary flex-col gap-5 flex"
      >
        <div class="mx-8 grid grid-row gap-6 md:gap-10">
          <div class="flex flex-col md:flex-row gap-4 md:justify-between">
            <div class="md:w-fit">
              <Tab :tabs="tabs" @clicked="changeNavigation" />
            </div>
          </div>
        </div>
        <component :is="selectedComponent" />
      </div>
    </div>
  </div>
</template>

<style scoped>
p {
  @apply select-none;
}
</style>
