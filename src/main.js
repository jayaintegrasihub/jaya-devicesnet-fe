
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { defineAsyncComponent } from 'vue'

import App from './App.vue'
import router from './router'
import './index.css'
import DeleteConfirmationModal from '@/components/modal/DeleteConfirmationModal.vue'
import loading from '@/components/loading.vue'
import BaseInput from '@/components/input/BaseInput.vue'
import BaseButton from '@/components/input/BaseButton.vue'
import BaseDropdown from '@/components/input/BaseDropdown.vue'
import SideNav from '@/components/navigation/SideNav.vue'
import TopBar from '@/components/navigation/TopBar.vue'
import Vue3EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')



app
.component('EasyDataTable', Vue3EasyDataTable)
.component('BasicInput', BaseInput)
.component('BasicButton', BaseButton)
.component('BasicDropdown', BaseDropdown)
.component('SideNav', SideNav)
.component('TopBar', TopBar)
.component('loading', loading)
.component('DeleteConfirmationModal', DeleteConfirmationModal)

app.component('alert', defineAsyncComponent(() =>
  import('@/components/alert/BaseAlert.vue')
))