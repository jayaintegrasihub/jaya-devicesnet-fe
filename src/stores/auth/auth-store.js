import { defineStore } from 'pinia'
import router from '@/router'
import authAPI from '@/services/auth/authAPI'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: localStorage.getItem('auth.user'),
    accessToken: localStorage.getItem('auth.accessToken'),
    refreshToken: localStorage.getItem('auth.refreshToken'),
    status: ref({
      isError:null,
      message: null,
      code: null,
    }),
    isLoading: ref(false)
  }),
  actions: {
    async signUp(data) {
      this.isLoading = true
      try {
        const res = await authAPI.signUp(data)
        console.log(res)
        this.isLoading = false
        this.status.message = 'Account Created'
        this.status.code = res.data.status
        router.push({ name: 'EmailConfirmation' });
      } catch (err) {
        console.error(err)
        this.isLoading = false
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },

    async signIn(data) {
      this.isLoading = true
      try {
        const res = await authAPI.signIn(data)
        console.log(res)
        this.isLoading = false
        this.accessToken = res.data.accessToken
        this.refreshToken = res.data.refreshToken
        this.status.message = 'Login Successful'
        this.status.code = res.data.status
        this.status.isError = false
        localStorage.setItem('auth.accessToken', res.data.accessToken)
        localStorage.setItem('auth.refreshToken', res.data.refreshToken)
        router.push({ name: 'dashboard' })
      } catch (err) {
        console.error(err)
        this.isLoading = false
        let errorMsg
        let errorStatus = err.response.status
        console.log(errorStatus)

        switch (errorStatus) {
          case 401:
            errorMsg = err.response.data.data.username
            break;
          case 404:
            errorMsg = err.response.data.data.message
            var colonIndex = errorMsg.indexOf(':')
            if (colonIndex !== -1) {
              errorMsg = errorMsg.substring(colonIndex + 1).trim();
                console.log(errorMsg);
            } else {
                console.log("Colon not found in the input text.");
            }
            break;
        }
        this.status.message = errorMsg
        this.status.isError = true
        this.status.code = err.response.data.statusCode

        //define message 
        if (this.status.code == '400') {
          this.status.message = err.response.data.message
        } 
        if (this.status.code == '401') {
          this.status.message = "Hold on! You need to be logged in to access that page. Please log in or sign up to continue."
        } 
        if (this.status.code == '403') {
          this.status.message = "Sorry! You don't have permission to access that page. Please contact support if you believe this is an error."
        } 
        if (this.status.code == '404') {
          this.status.message = "Uh-oh! We couldn't find the page you were looking for Please check the URL and try again"
        } 
        if (this.status.code == '500') {
          this.status.message = "Yikes! Something went wrong on our end. Please try again later or contact support if the issue persists."
        } 
        if (this.status.code == '502') {
          this.status.message = "Oops! We're having trouble connecting to the server. Please try again later or contact support if the issue persists."
        } 
        if (this.status.code == '503') {
          this.status.message = "Hold tight! We're performing maintenance on our servers. Please try again later."
        }

        console.log(this.status)


        return err
      }
    },

    async signOut() {
      localStorage.removeItem('auth.accessToken');
      localStorage.removeItem('auth.user')
      router.push({ name: 'login' });
    },

    async forgotPassword(data) {

      this.isLoading = true
      try {
        const res = await authAPI.forgotPassword(data)
        this.isLoading = false
        this.status.message = 'Password reset email successfully sent'
      } catch (err) {
        this.isLoading = false
        this.status.message = err.response.data.error.errors[0].message
        return err
      }
    },

    async newPassword(data, email, signature) {
      this.isLoading = true
      try {
        await authAPI.newPassword(data, email, signature)
        this.isLoading = false
        router.push({ name: 'ResetPasswordConfirmation' });
      } catch (err) {
        console.error(err)
        this.isLoading = false
        return err
      }
    },

  }

})