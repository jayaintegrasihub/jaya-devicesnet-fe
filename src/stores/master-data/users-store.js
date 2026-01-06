import usersApi from '@/services/master-data/users-api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUsersStore = defineStore('users', {
  state: () => ({
    users: ref([]),
    user: ref([]),
    status: ref({
      isError: null,
      message: null,
      code: null
    }),
    deleteUserLoading: ref(false),
    createUserLoading: ref(false),
    editUserLoading: ref(false),
    isLoading: ref(false)
  }),
  actions: {
    async getUsers() {
      this.isLoading = true
      try {
        const res = await usersApi.getUsers()
        this.isLoading = false
        this.users = res.data.users
        console.log(res.data.users)

        this.users.map((item, index) => {
          item.no = index + 1
        })
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.isLoading = false
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
    async getUser(id) {
      this.isLoading = true
      try {
        const res = await usersApi.getUser(id)
        this.isLoading = false
        this.user = res.data.user
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.isLoading = false
        this.status.message = err.response.data.error
        this.status.code = err.response.data.status
        return err
      }
    },
    async createUser(data) {
      this.createUserLoading = true
      try {
        const res = await usersApi.createUser(data)
        console.log(res)
        this.createUserLoading = false
        this.status.isError = false
        this.status.message = 'Data Posted'
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.createUserLoading = false
        this.status.isError = true
        this.status.message =
          err.response.data.data.message || JSON.stringify(err.response.data.data)
        this.status.code = err.response.data.status
        return err
      }
    },
    async deleteUser(id) {
      this.deleteUserLoading = true
      try {
        const res = await usersApi.deleteUser(id)
        console.log(res)
        this.deleteUserLoading = false
        this.status.message = 'Data Deleted'
        this.status.code = res.status
      } catch (err) {
        console.error(err)
        this.deleteUserLoading = false
        this.status.message = JSON.stringify(err.response.data.data)
        this.status.code = err.response.data.status
        return err
      }
    },
    async editUser(id, data) {
      this.editUserLoading = true
      try {
        const res = await usersApi.editUser(id, data)
        console.log(res)
        this.editUserLoading = false
        this.status.message = 'Data Updated'
        this.status.code = res.data.status
      } catch (err) {
        console.error(err)
        this.editUserLoading = false
        this.status.message = JSON.stringify(err.response.data.data)
        this.status.code = err.response.data.status
        return err
      }
    }
  }
})
