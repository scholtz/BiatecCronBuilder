<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import Menubar from 'primevue/menubar'
import Badge from 'primevue/badge'
import Logo from '@/assets/projects/scheduler.svg?raw'
import type { MenuItem } from 'primevue/menuitem'

const store = useAppStore()
watch(
  store.state,
  () => {
    makeMenu()
  },
  { deep: true }
)
watch(
  () => store.state.authState.isAuthenticated,
  () => {
    makeMenu()
  }
)
const makeMenu = () => {
  const menuItems: MenuItem[] = []
  let auth: {}
  if (store.state.authState.isAuthenticated) {
    auth = {
      label: 'Logout',
      icon: 'pi pi-lock',
      command: async () => {
        store.state.authState.inAuthentication = false
        store.state.authState.isAuthenticated = false
        store.state.authState.arc76email = ''
        store.state.authState.arc14Header = ''
        store.state.authState.account = ''
        store.state.forceAuth = false
        console.log('logout sent')
        await store.state.authComponent?.logout()
      }
    }
  } else {
    auth = {
      label: 'Login',
      icon: 'pi pi-unlock',
      command: async () => {
        store.state.forceAuth = true
      }
    }
  }
  ;[
    {
      label: 'Decentralized scheduler',
      icon: 'pi pi-home',
      route: '/'
    },
    {
      label: 'Documentation',
      icon: 'pi pi-question',
      url: 'https://www.vote-coin.com'
    },
    auth
  ].forEach((i) => menuItems.push(i))
  items.value = menuItems
  console.log('menuItems', menuItems)
}
const items = ref<any>([])
const makeThemes = () => {
  const allowed = [
    { name: 'Lara Dark Teal', file: 'lara-dark-teal', icon: 'pi pi-moon' },
    { name: 'Lara Light Teal', file: 'lara-light-teal', icon: 'pi pi-sun' },

    { name: 'Aura Dark Teal', file: 'aura-dark-teal', icon: 'pi pi-moon' },
    { name: 'Aura Light Teal', file: 'aura-light-teal', icon: 'pi pi-sun' },

    { name: 'Saga Blue', file: 'saga-blue', icon: 'pi pi-sun' },
    { name: 'Rhea Light', file: 'rhea', icon: 'pi pi-sun' },
    { name: 'Arya Purple', file: 'arya-purple', icon: 'pi pi-moon' },
    { name: 'Nova Alt', file: 'nova-alt', icon: 'pi pi-sun' },

    { name: 'Soho Dark', file: 'soho-dark', icon: 'pi pi-moon' },
    { name: 'Soho Light', file: 'soho-light', icon: 'pi pi-sun' },

    {
      name: 'Bootstrap Dark Purple',
      file: 'bootstrap4-dark-purple',
      icon: 'pi pi-moon'
    },
    {
      name: 'Bootstrap Light Purple',
      file: 'bootstrap4-light-purple',
      icon: 'pi pi-sun'
    }
  ]

  const ret = []
  for (const item of allowed) {
    ret.push({
      label: item.name,
      icon: item.icon,
      command: async () => {
        store.state.theme = item.file
        localStorage.setItem('lastTheme', item.file)
      }
    })
  }
  return ret
}
makeMenu()
</script>

<template>
  <div class="card m-2 mb-0">
    <Menubar :model="items" class="my-2">
      <template #start>
        <RouterLink to="/">
          <div class="svg-image" v-html="Logo"></div>
        </RouterLink>
      </template>
      <template #item="{ item, props, hasSubmenu, root }">
        <RouterLink
          v-if="item.route"
          :to="item.route"
          class="flex align-items-center p-menuitem-link"
        >
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
          <Badge
            v-if="item.badge"
            :class="{ 'ml-auto': !root, 'ml-2': root }"
            :value="item.badge"
          />
          <span
            v-if="item.shortcut"
            class="ml-auto border-1 surface-border border-round surface-100 text-xs p-1"
            >{{ item.shortcut }}</span
          >
          <i
            v-if="hasSubmenu"
            :class="[
              'pi pi-angle-down',
              { 'pi-angle-down ml-2': root, 'pi-angle-right ml-auto': !root }
            ]"
          ></i>
        </RouterLink>

        <a
          v-else-if="item.url"
          :href="item.url"
          v-ripple
          class="flex align-items-center"
          v-bind="props.action"
          target="_blank"
        >
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
          <Badge
            v-if="item.badge"
            :class="{ 'ml-auto': !root, 'ml-2': root }"
            :value="item.badge"
          />
          <span
            v-if="item.shortcut"
            class="ml-auto border-1 surface-border border-round surface-100 text-xs p-1"
            >{{ item.shortcut }}</span
          >
          <i
            v-if="hasSubmenu"
            :class="[
              'pi pi-angle-down',
              { 'pi-angle-down ml-2': root, 'pi-angle-right ml-auto': !root }
            ]"
          ></i>
        </a>
        <a v-else v-ripple class="flex align-items-center" v-bind="props.action">
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
          <Badge
            v-if="item.badge"
            :class="{ 'ml-auto': !root, 'ml-2': root }"
            :value="item.badge"
          />
          <span
            v-if="item.shortcut"
            class="ml-auto border-1 surface-border border-round surface-100 text-xs p-1"
            >{{ item.shortcut }}</span
          >
          <i
            v-if="hasSubmenu"
            :class="[
              'pi pi-angle-down',
              { 'pi-angle-down ml-2': root, 'pi-angle-right ml-auto': !root }
            ]"
          ></i>
        </a>
      </template>
    </Menubar>
  </div>
</template>
<style>
.p-submenu-list {
  min-width: 300px;
}
</style>
