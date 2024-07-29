<script setup>
import { Form as VeeForm } from 'vee-validate'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth/auth-store'
import { storeToRefs } from 'pinia';
import { loginSchema } from '@/composable/authSchema'
  const authStore = useAuthStore()
  const { status } = storeToRefs(useAuthStore())
  const modalActive = ref(false)

  const closeNotification = () => {
    modalActive.value = false
  }
  
  const onSubmit = async (values, { resetForm }) => {
    await authStore.signIn(values)
    console.log(values)
    modalActive.value = true
    setTimeout(closeNotification, 5000)
    resetForm()
  }
</script>
<template>
  <alert 
    :message ="status.message"
    :modalActive="modalActive"
    :isError="status.isError"
     @close="closeNotification"
  />

  <div class="xl:bg-[url('@/assets/login-bg.png')] w-full h-full bg-cover absolute z-0 flex p-[20px]">
    <img alt="telemetric logo" class="w-[100px] absolute left-[20px] bottom-[20px] invisible xl:visible" src="../../assets/telemetric-logo.svg" width="200" height="200" />
    <img alt="jin logo" class="w-[100px] absolute right-[20px] bottom-[20px] invisible xl:visible" src="../../assets/white-logo.svg" width="125" height="125" />
    <img alt="jin logo" class="w-[100px] absolute right-[20px] bottom-[20px] visible xl:invisible" src="../../assets/black-logo.svg" width="125" height="125" />
    <div class="w-full xl:w-fit my-auto xl:mx-auto items-start xl:items-center flex flex-col xl:flex-row gap-4 xl:gap-80">
      <div class="flex flex-col xl:gap-10">
        <p class="xl:text-white text-label-primary text-xl xl:text-4xl font-normal tracking-[3.60px]">Welcome to</p>
        <p class="xl:text-white text-label-primary text-2xl xl:text-[64px] font-bold xl:flex-col flex gap-2 xl:gap-10">
          <span>
            TELEMETRIC
          </span> 
          <span>
            DEVICESNET
          </span> 
        </p>
      </div>
      <div class="w-full xl:w-[463px] xl:px-10 xl:py-[42px] px-[2px] py-[20px] bg-bkg-primary rounded-lg flex-col justify-start items-start gap-8 flex">
        <p class="text-label-primary text-xl font-medium">Sign In</p>
        <VeeForm :validationSchema="loginSchema" v-slot="{ handleSubmit }" as="div" class="w-full">
          <form  @submit="handleSubmit($event, onSubmit)" class="form-wrapper" >
            <BasicInput name="username" type="text" placeholder="your username" class="outlined" label="Username" />
            <BasicInput name="password" type="password" placeholder="your password" class="outlined" label="Password" />
            <BasicButton type="submit" class="primary" label="Login" />
          </form>
        </VeeForm>
      </div>
    </div>
  </div>

</template>

<style scoped>
  p {
    @apply select-none
  }
</style>
