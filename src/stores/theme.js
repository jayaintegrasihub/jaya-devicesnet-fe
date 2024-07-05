import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export const useThemeStore = defineStore({
  id: 'theme',
  state: () => ({
    isDark: useLocalStorage('theme', false)
  }),
  actions: {
    async switchTheme() {
      document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light')
    }
  }
})

 