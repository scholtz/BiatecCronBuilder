<script setup lang="ts">
import axios from 'axios'
import Blockly from 'blockly'
import BlocklyComponent from '../components/BlocklyComponent.vue'
import '../blocks/folks/oracle'
import '../blocks/algorand/pay'
import '../blocks/algorand/sc_balance'
import '../blocks/algorand/assert'
import '../blocks/pact/pact_swap'

import ProgressSpinner from 'primevue/progressspinner'

import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import DropDown from 'primevue/dropdown'
import Message from 'primevue/message'
import InputNumber from 'primevue/inputnumber'
import { onMounted, reactive, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import PublicLayout from '@/layouts/PublicLayout.vue'
import { useToast } from 'primevue/usetoast'
import Algosdk, { Transaction } from 'algosdk'
import { Buffer } from 'buffer'
import YAML from 'yaml'
import copy from 'copy-to-clipboard'

import AlgorandAddress from '@/components/AlgorandAddress.vue'

import Algodv2 = algosdk.Algodv2
import AtomicTransactionComposer = algosdk.AtomicTransactionComposer
import modelsv2 = algosdk.modelsv2

const toast = useToast()

const workspace = ref()
const state = reactive({
  workspace: '',
  yamlCode: '',
  tealScript: '',
  files: [] as string[],
  isBuilding: false,
  period: '3600',
  selectedFile: '',
  fileContent: '',
  buildInfo: {} as any,
  isSigningDeployTx: false,
  appId: 0,
  isSigningBootstrapTx: false,
  isBootstrapDone: false,
  isDeploying: false,
  isBootsraping: false,
  optinAsset: 0,
  isOpting: false
})
const store = useAppStore()

import { tealScriptGenerator, GeneratorState, postProcessing } from '../generators/tealscript'
import algosdk from 'algosdk'
import { BiatecCronJobClient } from '@/clients/BiatecCronJobClient'

const showCode = () => {
  GeneratorState.vars = {}
  state.yamlCode = postProcessing(
    tealScriptGenerator.workspaceToCode(workspace.value.workspace),
    parseInt(state.period),
    Math.round(new Date().getTime() / 1000),
    1000,
    0
  )
  const work = Blockly.serialization.workspaces.save(workspace.value.workspace)
  state.workspace = JSON.stringify(work)
  localStorage.setItem('work', state.workspace)
  console.log('work', work)
  state.tealScript = ''
}
const build = async () => {
  state.isBuilding = true
  try {
    GeneratorState.vars = {}
    const rebuild = state.tealScript ? '1' : '0'
    const buildInfo = await axios.post(
      `${await store.state.bff}/v1/build/${rebuild}`,
      state.yamlCode,
      {
        headers: {
          'Content-Type': 'application/yaml'
        }
      }
    )
    // Blockly.serialization.workspaces.load(state, myWorkspace);
    state.buildInfo = buildInfo.data
    state.files = Object.keys(buildInfo.data.files)
    state.tealScript = JSON.stringify(buildInfo.data.files)

    const current = YAML.parse(state.yamlCode)
    if (current?.schedule?.app) {
      state.appId = current.schedule.app
      state.isBootstrapDone = true
    }

    state.isBuilding = false
  } catch (e) {
    state.isBuilding = false
  }
}
const reloadStateFromLocalstorage = () => {
  try {
    setTimeout(() => {
      const work = localStorage.getItem('work')
      if (work) {
        const workObj = JSON.parse(work)
        console.log('restoring work', workObj)
        Blockly.serialization.workspaces.load(workObj, workspace.value.workspace)
      }
    }, 200)
  } catch (e) {
    console.error(e)
  }
}
onMounted(() => {
  reloadStateFromLocalstorage()
})

const optionsSchedule = [
  {
    value: '60',
    name: 'Run each minute'
  },
  {
    value: '3600',
    name: 'Run each hour'
  },
  {
    value: '86400',
    name: 'Run each day'
  }
]

const showFile = async (file: string) => {
  const fileData = await axios.get(`${store.state.bff}${state.buildInfo.files[file]}`)

  if (typeof fileData.data === 'string') {
    state.fileContent = fileData.data
  } else {
    state.fileContent = JSON.stringify(fileData.data, null, 2)
  }
  state.selectedFile = file
}
const goBackToDesigner = () => {
  state.selectedFile = ''
  reloadStateFromLocalstorage()
}

const deploy = async () => {
  try {
    state.isDeploying = true
    if (!store.state.authState.isAuthenticated) {
      toast.add({
        severity: 'info',
        detail: 'Authenticate first please, and repeat the action',
        life: 5000
      })
      store.state.forceAuth = true
      state.isDeploying = false
      return
    }

    const txsRequest = await axios.get(
      `${store.state.bff}/v1/tx-create/${state.buildInfo.hash}/${store.state.env}/${store.state.authState.account}/${state.buildInfo.client}`
    )
    const txs = txsRequest.data.map((t: string) => {
      return Algosdk.decodeUnsignedTransaction(Buffer.from(t, 'base64')) as Algosdk.Transaction
    })
    console.log('txs', txs)
    const groupedEncoded = txs.map((tx: Algosdk.Transaction) => tx.toByte())
    state.isSigningDeployTx = true
    const signed = (await store.state.authComponent.sign(groupedEncoded)) as Uint8Array[]
    state.isSigningDeployTx = false
    reloadStateFromLocalstorage()
    console.log('signed', signed)
    const algod = new Algodv2(store.state.algodToken, store.state.algodHost, store.state.algodPort)
    const { txId } = await algod.sendRawTransaction(signed).do()
    toast.add({
      severity: 'success',
      detail: `Tx ${txId} sent to the network`,
      life: 5000
    })
    const txInfo = await Algosdk.waitForConfirmation(algod, txId, 10)
    state.appId = txInfo['application-index']
    toast.add({
      severity: 'success',
      detail: `App ${state.appId} has been created`,
      life: 5000
    })

    console.log('sent', txInfo)
    console.log('deploy')
    state.isDeploying = false
  } catch (e: any) {
    state.isSigningDeployTx = false
    state.isDeploying = false
    console.error(e)

    toast.add({
      severity: 'error',
      detail: 'Error during deploy: ' + (e.message ?? e),
      life: 5000
    })
  }
}

const update = async () => {
  try {
    state.isDeploying = true
    if (!store.state.authState.isAuthenticated) {
      toast.add({
        severity: 'info',
        detail: 'Authenticate first please, and repeat the action',
        life: 5000
      })
      store.state.forceAuth = true
      state.isDeploying = false
      return
    }

    const txsRequest = await axios.get(
      `${store.state.bff}/v1/tx-update/${state.buildInfo.hash}/${store.state.env}/${state.appId}/${store.state.authState.account}/${state.buildInfo.client}`
    )
    const txs = txsRequest.data.map((t: string) => {
      return Algosdk.decodeUnsignedTransaction(Buffer.from(t, 'base64')) as Algosdk.Transaction
    })
    console.log('txs', txs)
    const groupedEncoded = txs.map((tx: Algosdk.Transaction) => tx.toByte())
    state.isSigningDeployTx = true
    const signed = (await store.state.authComponent.sign(groupedEncoded)) as Uint8Array[]
    state.isSigningDeployTx = false
    reloadStateFromLocalstorage()
    console.log('signed', signed)
    const algod = new Algodv2(store.state.algodToken, store.state.algodHost, store.state.algodPort)
    const { txId } = await algod.sendRawTransaction(signed).do()
    toast.add({
      severity: 'success',
      detail: `Tx ${txId} sent to the network`,
      life: 5000
    })
    const txInfo = await Algosdk.waitForConfirmation(algod, txId, 10)
    toast.add({
      severity: 'success',
      detail: `App ${state.appId} has been updated`,
      life: 5000
    })

    console.log('sent', txInfo)
    console.log('update done')
    state.isDeploying = false
  } catch (e: any) {
    state.isSigningDeployTx = false
    state.isDeploying = false
    console.error(e)

    toast.add({
      severity: 'error',
      detail: 'Error during update: ' + (e.message ?? e),
      life: 5000
    })
  }
}

const configure = async () => {
  try {
    if (!store.state.authState.isAuthenticated) {
      toast.add({
        severity: 'info',
        detail: 'Authenticate first please, and repeat the action',
        life: 5000
      })
      store.state.forceAuth = true
      return
    }
    state.isBootsraping = true

    const algod = new Algodv2(store.state.algodToken, store.state.algodHost, store.state.algodPort)

    const current = YAML.parse(state.yamlCode)
    if (!current?.schedule?.start) {
      console.log('current', current)
      throw Error('Start value is empty. Check your yaml configuration')
    }
    const txsRequest = await axios.post(
      `${store.state.bff}/v1/tx/${state.buildInfo.hash}/${store.state.env}/${store.state.authState.account}/${state.appId}/bootstrap/${state.buildInfo.client}`,
      {
        period: current.schedule.period,
        start: current.schedule.start,
        fee: current.schedule.fee
      }
    )
    const txs = txsRequest.data.map((t: string) => {
      return Algosdk.decodeUnsignedTransaction(Buffer.from(t, 'base64')) as Algosdk.Transaction
    })

    console.log('txs', txs)
    const groupedEncoded = txs.map((tx: Algosdk.Transaction) => {
      return tx.toByte() as Uint8Array
    })
    console.log('groupedEncoded', groupedEncoded)

    state.isSigningBootstrapTx = true
    const signed = (await store.state.authComponent.sign(groupedEncoded)) as Uint8Array[]
    state.isSigningBootstrapTx = false
    reloadStateFromLocalstorage()
    console.log('signed', signed)
    const simulate = await algod.simulateRawTransactions(signed).do()
    console.log('simulate', simulate)

    const simulateRequest = new modelsv2.SimulateRequest({
      allowEmptySignatures: true,
      allowMoreLogging: true,
      execTraceConfig: new modelsv2.SimulateTraceConfig({
        enable: true,
        scratchChange: true,
        stackChange: true,
        stateChange: true
      }),
      txnGroups: [
        new modelsv2.SimulateRequestTransactionGroup({
          txns: signed.map((txn) => algosdk.decodeObj(txn)) as algosdk.EncodedSignedTransaction[]
        })
      ]
    })
    const simulateResult: modelsv2.SimulateResponse = await algod
      .simulateTransactions(simulateRequest)
      .do()
    console.log('simulateResult', simulateResult)

    const { txId } = await algod.sendRawTransaction(signed).do()
    toast.add({
      severity: 'success',
      detail: `Tx ${txId} sent to the network`,
      life: 5000
    })
    const txInfo = await Algosdk.waitForConfirmation(algod, txId, 10)

    console.log('sent', txInfo)
    state.isBootstrapDone = true

    state.isBootsraping = false
    console.log('deploy')
  } catch (e: any) {
    state.isSigningBootstrapTx = false
    state.isBootsraping = false
    console.error(e)

    toast.add({
      severity: 'error',
      detail: 'Error during deploy: ' + (e.message ?? e),
      life: 5000
    })
  }
}
watch(
  () => store.state.authState.isAuthenticated,
  () => {
    if (store.state.authState.isAuthenticated) {
      reloadStateFromLocalstorage()
    }
  }
)

const optin = async () => {
  try {
    state.isDeploying = true
    if (!store.state.authState.isAuthenticated) {
      toast.add({
        severity: 'info',
        detail: 'Authenticate first please, and repeat the action',
        life: 5000
      })
      store.state.forceAuth = true
      state.isDeploying = false
      return
    }
    const signer = {
      addr: store.state.authState.account,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        const groupedEncoded = txnGroup.map((tx: Algosdk.Transaction) => tx.toByte())
        const signed = (await store.state.authComponent.sign(groupedEncoded)) as Uint8Array[]
        return signed
      }
    }

    state.isOpting = true
    const algod = new Algodv2(store.state.algodToken, store.state.algodHost, store.state.algodPort)
    var client = new BiatecCronJobClient(
      {
        id: state.appId,
        resolveBy: 'id',
        sender: signer
      },
      algod
    )
    const asset = Number(state.optinAsset)
    const transfer = await client.assetTransfer(
      {
        assetAmount: 0,
        assetReceiver: algosdk.getApplicationAddress(state.appId),
        note: '',
        xferAsset: asset
      },
      {
        assets: [asset]
      }
    )
    console.log('transfer', transfer)
    state.isOpting = false
    toast.add({
      severity: 'success',
      detail: `Optin to asset ${state.optinAsset} is successful`,
      life: 5000
    })
  } catch (e: any) {
    state.isOpting = false
    console.error(e)

    toast.add({
      severity: 'error',
      detail: 'Error opting: ' + (e.message ?? e),
      life: 5000
    })
  }
}

const copyLink = () => {
  const link = `${store.state.bff}${state.buildInfo.files[state.selectedFile]}`
  copy(link)

  toast.add({
    severity: 'info',
    detail: 'Link copied to clipboard: ' + link,
    life: 5000
  })
}
</script>

<template>
  <PublicLayout>
    <div class="grid m-1" v-if="!state.selectedFile">
      <div class="col-12">
        <h2 class="m-2">Step 1: Setup your scheduler</h2>
        <BlocklyComponent ref="workspace" class="m-2">
          <category name="Variables" custom="VARIABLE" colour="%{BKY_VARIABLES_HUE}"> </category>
          <category name="Math" colour="%{BKY_MATH_HUE}">
            <block type="math_number">
              <field name="NUM">0</field>
            </block>
            <block type="math_arithmetic"></block>
          </category>
          <category name="Text" colour="%{BKY_TEXTS_HUE}">
            <block type="text"></block>
          </category>
          <category name="Logic" colour="%{BKY_LOGIC_HUE}">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_operation"></block>
            <block type="logic_negate"></block>
            <block type="logic_boolean"></block>
          </category>
          <category name="Algorand" colour="teal">
            <block type="pay"></block>
            <block type="sc_balance"></block>
            <block type="assert"></block>
          </category>
          <category name="Folks" colour="blue">
            <block type="folks_oracle"></block>
          </category>
          <category name="Pact" colour="#7b5804">
            <block type="pact_swap"></block>
          </category>
        </BlocklyComponent>
      </div>
      <div class="col-12 md:col">
        <div>
          <DropDown
            class="m-2"
            v-model="state.period"
            option-label="name"
            option-value="value"
            :options="optionsSchedule"
          >
          </DropDown>
          <Button
            @click="showCode()"
            class="m-2"
            :severity="state.yamlCode ? 'secondary' : 'primary'"
            >Step 2: Generate biatec scheduler code
          </Button>
        </div>
        <div v-if="state.yamlCode">
          <Textarea v-model="state.yamlCode" class="w-full m-2" rows="15"></Textarea>
        </div>
      </div>
      <div class="col-12 md:col" v-if="state.yamlCode">
        <div>
          <Button
            @click="build"
            :disabled="state.isBuilding"
            class="m-2"
            :severity="state.tealScript ? 'secondary' : 'primary'"
          >
            Step 3: Build smart contract

            <ProgressSpinner
              v-if="state.isBuilding"
              style="width: 1em; height: 1em"
              strokeWidth="5"
              class="m-2"
            />
          </Button>
        </div>
        <div v-if="state.tealScript">
          <div v-for="(item, index) in state.files" :key="index">
            <Button
              size="small"
              class="m-1"
              @click="showFile(item)"
              :severity="item === 'stderr.txt' ? 'danger' : 'info'"
            >
              {{ item }}
            </Button>
          </div>
        </div>
      </div>
      <div class="col-12 md:col" v-if="state.tealScript">
        <div>
          <Button
            v-if="!state.appId"
            @click="deploy()"
            class="m-2"
            :severity="state.appId ? 'secondary' : 'primary'"
            :disabled="state.isDeploying"
          >
            Step 4: Deploy to {{ store.state.envName }}
          </Button>

          <Button
            v-if="state.appId"
            @click="update()"
            class="m-2"
            :severity="state.appId ? 'secondary' : 'primary'"
            :disabled="state.isDeploying"
          >
            Step 4: Update {{ state.appId }} to {{ store.state.envName }}
          </Button>
          <Message v-if="state.isSigningDeployTx" severity="info">
            Please check your wallet and sign deploy transaction
          </Message>
          <p v-if="state.appId">App id: {{ state.appId }}</p>
        </div>
        <div v-if="state.appId">
          <Button
            @click="configure()"
            class="m-2"
            :severity="state.isBootstrapDone ? 'secondary' : 'primary'"
            :disabled="state.isBootsraping"
          >
            Step 5: Configure
          </Button>
          <Message v-if="state.isSigningBootstrapTx" severity="info">
            Please check your wallet and sign deploy transaction
          </Message>
        </div>
        <div v-if="state.isBootstrapDone">
          <Message severity="info"> Contract is deployed </Message>
          <p>
            Use address <AlgorandAddress :address="Algosdk.getApplicationAddress(state.appId)" /> to
            deposit funds for scheduled tasks and fees
          </p>
        </div>
        <div v-if="state.isBootstrapDone">
          <InputNumber
            v-model="state.optinAsset"
            placeholder="Asset id to opt in with escrow account"
          />
          <Button @click="optin" class="m-2" severity="secondary" :disabled="state.isOpting">
            Opt in to asset
          </Button>
        </div>
      </div>
    </div>
    <div class="grid m-1" v-else>
      <div class="col-12">
        <h1>{{ state.selectedFile }}</h1>
      </div>
      <div class="col-12">
        <Button @click="goBackToDesigner()" class="m-2">Go back</Button>
        <Button @click="copyLink" class="m-2" severity="secondary">Copy link to file</Button>
      </div>
      <div class="col-12">
        <Textarea v-model="state.fileContent" class="w-full" rows="30"> </Textarea>
      </div>
    </div>
  </PublicLayout>
</template>
