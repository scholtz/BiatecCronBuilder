<script setup lang="ts">
import Layout from '@/layouts/PublicLayout.vue'
import Panel from 'primevue/panel'
import Button from 'primevue/button'
import {
  useAppStore,
  resetConfiguration,
  useMainnet,
  useTestnet,
  useVoitest,
  useSandnet
} from '@/stores/app'

const store = useAppStore()
</script>

<template>
  <Layout :hideTopMenu="true">
    <MenuLevel2Settings />
    <Panel header="Settings" class="m-4 flex flex-grow-1 flex-column" toggleableContent="text">
      <p class="m-0"></p>
      <div class="card">
        <h4>Blockchain configuration</h4>
        <div class="field grid">
          <label for="algodnode" class="col-12 mb-2 md:col-2 md:mb-0">Network defaults</label>
          <div class="col-12 md:col-10">
            <Button @click="useMainnet" class="my-2 mr-2">Algorand Mainnet</Button>
            <Button @click="useTestnet" class="m-2">Algorand Testnet</Button>
            <Button @click="useVoitest" class="m-2">VoiTest</Button>
            <Button @click="useSandnet" class="m-2">Sandbox</Button>
          </div>
        </div>
        <div class="field grid">
          <label for="algodHost" class="col-12 mb-2 md:col-2 md:mb-0">Blockchain endpoint</label>
          <div class="col-12 md:col-10">
            <input
              v-model="store.state.algodHost"
              id="algodHost"
              type="text"
              class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border border-round appearance-none outline-none focus:border-primary w-full"
            />
          </div>
        </div>
        <div class="field grid">
          <label for="algodPort" class="col-12 mb-2 md:col-2 md:mb-0"
            >Blockchain endpoint port</label
          >
          <div class="col-12 md:col-10">
            <input
              v-model="store.state.algodPort"
              id="algodPort"
              type="text"
              class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border border-round appearance-none outline-none focus:border-primary w-full"
            />
          </div>
        </div>
        <div class="field grid">
          <label for="algodToken" class="col-12 mb-2 md:col-2 md:mb-0"
            >Blockchain endpoint token</label
          >
          <div class="col-12 md:col-10">
            <input
              v-model="store.state.algodToken"
              id="algodToken"
              type="text"
              class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border border-round appearance-none outline-none focus:border-primary w-full"
            />
          </div>
        </div>

        <h4>Default configuration</h4>
        <div class="field grid">
          <label class="col-12 mb-2 md:col-2 md:mb-0">Danger zone</label>
          <div class="col-12 md:col-10">
            <Button @click="resetConfiguration" class="my-2" severity="danger">
              Reset configuration
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  </Layout>
</template>
