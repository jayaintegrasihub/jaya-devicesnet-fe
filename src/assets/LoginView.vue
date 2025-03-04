<script setup>
import { Form as VeeForm } from 'vee-validate'
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth/auth-store'
import { storeToRefs } from 'pinia';
import { loginSchema } from '@/composable/authSchema'
import { useRoute, useRouter } from 'vue-router'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import { useLocaleStore } from '@/stores/localization/LocaleStore';
const { t } = useI18n()

const { locale } = useI18n()  // Access the locale from useI18n
const privacyPolicy = import.meta.env.VITE_APP_API_URL + 'resources/privacy-policy.pdf'
const route = useRoute()
const routers = useRouter()
const localeStore = useLocaleStore()
const authStore = useAuthStore()
const { status, isLoading } = storeToRefs(useAuthStore())
const modalActive = ref(false)
const password = ref(false)
const closeNotification = () => {
  modalActive.value = false
}

function toRegisterPage() {
  router.push({ name: 'signup' })
}
function toResetPasswordPage() {
  router.push({ name: 'resetPassword' })
}

const onSubmit = async (values, { resetForm }) => {
  await authStore.signIn(values)
  modalActive.value = true
  setTimeout(closeNotification, 5000)
  resetForm()
}

onMounted(() => {
  let selectedLocale = localeStore.locale
  console.log(selectedLocale)
  var element = document.getElementById(selectedLocale)
  element.classList.add("active")
})


function chageLanguage(lang) {
  const newPath = `/${lang}`;
  router.push(newPath);
  console.log(newPath)
  var subNavs = document.getElementsByClassName("nav")
  for (var i of subNavs) {
    i.classList.remove("active");
  }
  event.target.className += " active"
  localeStore.setLocale(lang)
  console.log(localeStore.locale)
  locale.value = lang
}


const tabs = [
  {
    title: 'Italy',
    value: 'ita'
  },
  {
    title: 'English',
    value: 'en'
  }
]
</script>
<template>
  <alert :message="status.message" :modalActive="modalActive" :isError="status.isError" @close="closeNotification" />

  <div class=" w-full h-full bg-cover absolute z-0 flex p-[20px] bg-bkg-primary">
    <div class="w-full xl:w-fit my-auto xl:mx-auto items-center flex flex-col gap-10">
      <img alt="aid logo" class="w-[100px]" src="../../assets/aid-logo.svg" width="200" height="200" />
      <div
        class="shadow-md w-full xl:w-[463px] xl:px-10 xl:py-[42px] px-[20px] py-[30px] bg-bkg-primary rounded-lg flex-col justify-start items-start gap-8 flex">
        <p class="text-label-primary text-xl font-medium">{{ $t('login') }}</p>
        <VeeForm :validationSchema="loginSchema" v-slot="{ handleSubmit }" as="div" class="w-full">
          <form @submit="handleSubmit($event, onSubmit)" class="form-wrapper">
            <BasicInput name="email" type="email" placeholder="your email" class="outlined" label="Email" />

            <div class="flex items-center gap-2">
              <BasicInput name="password" :type="password ? 'text' : 'password'" placeholder="your password"
                class="outlined" label="Password" />
              <input class="cursor-pointer hidden w-[30px]" id="show-password" type="checkbox" v-model="password"><label
                class="cursor-pointer" for="show-password">
                <img v-if="!password" alt="aid logo" class="w-[24px]" src="../../assets/eye-open.svg" width="200"
                  height="200" />
                <img v-if="password" alt="aid logo" class="w-[24px]" src="../../assets/eye-close.svg" width="200"
                  height="200" />
              </label>
            </div>
            <div class="flex gap-1 text-xs">
              <p>{{ $t('forgotPassword') }}</p>
              <div class="cursor-pointer text-accent-1" @click="toResetPasswordPage()">
                <p>{{ $t('recoverHere') }}</p>
              </div>
            </div>
            <BasicButton type="submit" class="primary" :label="$t('login')" :loading="isLoading" />
          </form>
          <BasicButton type="button" class="outlined" label="Register" @click="toRegisterPage()" />
        </VeeForm>
      </div>
    </div>
  </div>
  <div class="absolute bottom-2 flex justify-between items-center w-full px-8">
    <div class="master-data-tab">
      <div class="tab">
        <button v-for="(tab, index) in tabs" :key="tab.value" @click="chageLanguage(tab.value)" class="nav"
          :value="index" :id="tab.value">{{ tab.title }}
        </button>
      </div>
    </div>
    <a :href="privacyPolicy" target="_blank" class="col-span-1 text-[8px] sm:text-base">Privacy Policy</a>
  </div>
</template>

<style scoped>
p {
  @apply select-none
}


.master-data-tab {
  @apply h-20 flex py-4 gap-10 bg-bkg-primary z-20
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
  @apply bg-bkg-primary text-accent-1 transition-colors duration-300
}

.active:hover {
  @apply bg-bkg-primary text-label-primary transition-colors duration-300 cursor-default
}
</style>
