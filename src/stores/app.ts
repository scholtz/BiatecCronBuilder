import { reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import { usePrimeVue } from 'primevue/config'
import axios from 'axios'
import { AuthenticationStore } from 'algorand-authentication-component-vue'

export interface IState {
  env: string
  envName: string

  bff: string

  algodHost: string
  algodPort: number
  algodToken: string

  theme: string
  currentTheme: string

  authState: AuthenticationStore
  authComponent: any
  forceAuth: boolean
}
export interface IConfig {
  env: string
  envName: string

  bff: string

  algodHost: string
  algodPort: number
  algodToken: string
}
const defaultState: IState = {
  bff: 'http://localhost:8080',
  algodHost: 'http://localhost',
  algodPort: 4001,
  algodToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

  env: 'mainnet-v1.0',
  envName: 'Algorand Mainnet',
  theme: 'lara-dark-teal',
  currentTheme: 'lara-dark-teal',
  authState: new AuthenticationStore(),
  authComponent: null,
  forceAuth: false
}

let configData: IConfig | null = null
try {
  const config = await axios.get('/config.json')
  if (config && config.data) {
    configData = config.data as IConfig
    defaultState.bff = configData.bff
    defaultState.env = configData.env
    defaultState.envName = configData.envName
    defaultState.algodHost = configData.algodHost
    defaultState.algodPort = configData.algodPort
    defaultState.algodToken = configData.algodToken
  }
} catch (e: any) {
  console.error(e.message)
}

export const useAppStore = defineStore('app', () => {
  const PrimeVue = usePrimeVue()
  let lastTheme = localStorage.getItem('lastTheme')
  if (!lastTheme) lastTheme = 'lara-dark-teal'
  const initState = { ...defaultState }

  initState.theme = lastTheme
  console.log('initState.currentTheme:', initState.currentTheme, initState.theme)
  if (initState.currentTheme != initState.theme) {
    console.log('setting theme:', initState.theme)
    console.log(`setting theme from ${initState.currentTheme} to ${initState.theme}`)
    PrimeVue.changeTheme(initState.currentTheme, initState.theme, 'theme-link')
    PrimeVue.changeTheme(initState.currentTheme, initState.theme, 'theme-link-custom')
    initState.currentTheme = initState.theme
  }

  const state = reactive(initState)
  watch(
    state,
    async (newState, oldState) => {
      console.log('state update', oldState, newState)
      localStorage.setItem('state', JSON.stringify(newState))

      if (state.currentTheme != state.theme) {
        console.log(`setting theme from ${state.currentTheme} to ${state.theme}`)
        PrimeVue.changeTheme(state.currentTheme, state.theme, 'theme-link')
        PrimeVue.changeTheme(state.currentTheme, state.theme, 'theme-link-custom')
        state.currentTheme = state.theme
      }
    },
    { deep: true }
  )
  return { state }
})
