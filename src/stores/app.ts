import { reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import { usePrimeVue } from 'primevue/config'
import axios from 'axios'
import { AuthenticationStore } from 'algorand-authentication-component-vue'

export interface IState {
  env: string
  envName: string

  bff: string

  appTaskPoolId: number

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
  appTaskPoolId: 0,
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

  try {
    const stateFromStorage = localStorage.getItem('state')
    if (stateFromStorage) {
      const istate = JSON.parse(stateFromStorage) as IState
      // if network has been changed make sure we do not load bad data from localstorage
      if (istate.algodHost) initState.algodHost = istate.algodHost
      if (istate.algodPort) initState.algodPort = istate.algodPort
      if (istate.algodToken) initState.algodToken = istate.algodToken
      if (istate.theme) initState.theme = istate.theme
      if (istate.env) initState.env = istate.env
      if (istate.envName) initState.envName = istate.envName
      if (istate.appTaskPoolId) initState.appTaskPoolId = istate.appTaskPoolId
    }
  } catch (e: any) {
    console.error(e)
  }

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
      localStorage.setItem('env', state.env)

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

export const resetConfiguration = () => {}

export const useMainnet = () => {
  const app = useAppStore()
  app.state.algodHost = 'https://mainnet-api.algonode.cloud'
  app.state.algodPort = 443
  app.state.algodToken = ''
  app.state.env = 'mainnet-v1.0'
  app.state.envName = 'Algorand Mainnet'
  app.state.appTaskPoolId = 0
  app.state.authState = new AuthenticationStore()
  //app.state.tokens = tokens
}
export const useTestnet = () => {
  const app = useAppStore()
  app.state.algodHost = 'https://testnet-api.algonode.cloud'
  app.state.algodPort = 443
  app.state.algodToken = ''
  app.state.env = 'testnet-v1.0'
  app.state.envName = 'Algorand Testnet'
  app.state.appTaskPoolId = 643872805
  app.state.authState = new AuthenticationStore()
}
export const useVoitest = () => {
  const app = useAppStore()
  app.state.algodHost = 'https://voitest-api.k1-fi.a-wallet.net'
  app.state.algodPort = 443
  app.state.algodToken = ''
  app.state.env = 'voitest-v1'
  app.state.authState = new AuthenticationStore()
  app.state.envName = 'VOI Test'
  app.state.appTaskPoolId = 0
}

export const useSandnet = () => {
  const app = useAppStore()
  app.state.algodHost = 'http://localhost'
  app.state.algodPort = 4001
  app.state.algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  app.state.env = 'sandnet-v1'
  app.state.envName = 'AVM Sandbox'
  //app.state.tokens = tokens
  app.state.appTaskPoolId = 1033
}
