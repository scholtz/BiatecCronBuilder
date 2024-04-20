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
import { useConfirm } from 'primevue/useconfirm'
import ConfirmDialog from 'primevue/confirmdialog'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import PublicLayout from '@/layouts/PublicLayout.vue'
import { useToast } from 'primevue/usetoast'
import Algosdk, { Transaction } from 'algosdk'
import { Buffer } from 'buffer'
import YAML from 'yaml'
import copy from 'copy-to-clipboard'
import * as algokit from '@algorandfoundation/algokit-utils'

import AlgorandAddress from '@/components/AlgorandAddress.vue'
import { tealScriptGenerator, GeneratorState, postProcessing } from '../generators/tealscript'
import algosdk from 'algosdk'
import { BiatecCronJobShortHashClient } from '@/clients/BiatecCronJobClient'

import Algodv2 = algosdk.Algodv2
import AtomicTransactionComposer = algosdk.AtomicTransactionComposer
import modelsv2 = algosdk.modelsv2
import { BiatecTaskManagerClient } from '@/clients/BiatecTaskManagerClient'
import getPoolManagerApp from '@/scripts/scheduler/getPoolManagerApp'
import getBoxReferenceApp from '@/scripts/scheduler/getBoxReferenceApp'
const toast = useToast()
const confirm = useConfirm()

const workspace = ref()
const state = reactive({
  workspace: '',
  yamlCode: '',
  tealScript: '',
  files: [] as string[],
  isBuilding: false,
  period: '3600',
  feeToken: 0,
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
  isOpting: false,
  gasAmount: 0,
  isFunding: false,
  isDeleting: false,
  currentTemplate: 'periodic',
  isConfirmDeleteVisible: false,
  templates: {
    'mainnet-v1.0': [
      {
        id: 'periodic',
        name: 'Periodic payment to another account',
        data: '{"blocks":{"languageVersion":0,"blocks":[{"type":"pay","id":"{[GaAJT8dWJ{an%l:4Q{","x":140,"y":76,"inputs":{"receiver":{"block":{"type":"text","id":"Q3#PA43z++/%-VvY(7Ga","fields":{"TEXT":"ALGONAUTSPIUHDCX3SLFXOFDUKOE4VY36XV4JX2JHQTWJNKVBKPEBQACRY"}}},"token":{"block":{"type":"math_number","id":"vasyr]%m~n)m$_p:%Lz{","fields":{"NUM":0}}},"amount":{"block":{"type":"math_number","id":"Mp@f{Z[6Oe}O%?;.Jl0W","fields":{"NUM":1000000}}}}}]},"variables":[{"name":"amount","id":"w+5n|;Y_49BJ13F9=DHD"},{"name":"asset","id":"x,h.A=bjs[xLs=Losh6l"}]}'
      },
      {
        id: 'dca',
        name: 'DCA',
        data: '{"blocks":{"languageVersion":0,"blocks":[{"type":"pact_swap","id":"sy8,1IjQjpJxN}I)^/7!","x":81,"y":57,"inputs":{"contract":{"block":{"type":"math_number","id":"EPY3RMQ-(nJJ[Yn0oipd","fields":{"NUM":1075389128}}},"sendToken":{"block":{"type":"math_number","id":"BW?tdzDSqV.F5#l^d4{O","fields":{"NUM":0}}},"sendAmount":{"block":{"type":"math_number","id":"pv4?cQB4t@)~PRvQW7Jt","fields":{"NUM":1000000}}},"receiveToken":{"block":{"type":"math_number","id":"vasyr]%m~n)m$_p:%Lz{","fields":{"NUM":452399768}}},"receiveAmountMin":{"block":{"type":"math_number","id":"M^GX;19;NqM*2jv+Bll?","fields":{"NUM":100000}}}}}]},"variables":[{"name":"amount","id":"w+5n|;Y_49BJ13F9=DHD"}]}'
      },
      {
        id: 'swapsend',
        name: 'Swap and send',
        data: '{"blocks":{"languageVersion":0,"blocks":[{"type":"variables_set","id":"^g8a-Xx7:Mo/f7eu@3pa","x":334,"y":38,"fields":{"VAR":{"id":"x,h.A=bjs[xLs=Losh6l"}},"inputs":{"VALUE":{"block":{"type":"math_number","id":"vasyr]%m~n)m$_p:%Lz{","fields":{"NUM":1241945177}}}},"next":{"block":{"type":"pact_swap","id":"sy8,1IjQjpJxN}I)^/7!","inputs":{"contract":{"block":{"type":"math_number","id":"EPY3RMQ-(nJJ[Yn0oipd","fields":{"NUM":1243421154}}},"sendToken":{"block":{"type":"math_number","id":"BW?tdzDSqV.F5#l^d4{O","fields":{"NUM":31566704}}},"sendAmount":{"block":{"type":"math_number","id":"pv4?cQB4t@)~PRvQW7Jt","fields":{"NUM":1000000}}},"receiveToken":{"block":{"type":"variables_get","id":"=Pqgm8-4vA:(oD:`^r#H","fields":{"VAR":{"id":"x,h.A=bjs[xLs=Losh6l"}}}},"receiveAmountMin":{"block":{"type":"math_number","id":"M^GX;19;NqM*2jv+Bll?","fields":{"NUM":1000000}}}},"next":{"block":{"type":"sc_balance","id":"B4GvXa#w~?{b6_Kv](fR","inputs":{"token":{"block":{"type":"variables_get","id":"7k_DSe_s%SlmkH`uWL!-","fields":{"VAR":{"id":"x,h.A=bjs[xLs=Losh6l"}}}},"var":{"block":{"type":"variables_get","id":"m/.beQbNMcBfxAQ.bYr=","fields":{"VAR":{"id":"w+5n|;Y_49BJ13F9=DHD"}}}}},"next":{"block":{"type":"pay","id":"{[GaAJT8dWJ{an%l:4Q{","inputs":{"receiver":{"block":{"type":"text","id":"Q3#PA43z++/%-VvY(7Ga","fields":{"TEXT":"ALGONAUTSPIUHDCX3SLFXOFDUKOE4VY36XV4JX2JHQTWJNKVBKPEBQACRY"}}},"token":{"block":{"type":"variables_get","id":";]o+2c:8x3:(=Z9NMx/w","fields":{"VAR":{"id":"x,h.A=bjs[xLs=Losh6l"}}}},"amount":{"block":{"type":"variables_get","id":"pi_xlN^bX*1AYv3x+YW8","fields":{"VAR":{"id":"w+5n|;Y_49BJ13F9=DHD"}}}}}}}}}}}}]},"variables":[{"name":"amount","id":"w+5n|;Y_49BJ13F9=DHD"},{"name":"asset","id":"x,h.A=bjs[xLs=Losh6l"}]}'
      },
      {
        id: 'oracleswap',
        name: 'Swap if oracle price is above',
        data: '{"blocks":{"languageVersion":0,"blocks":[{"type":"folks_oracle","id":"CHjx0oOHQUIq-r(uK^?,","x":176,"y":57,"inputs":{"contract":{"block":{"type":"math_number","id":"!{ZqyVgv:,R!9W#0j0Z$","fields":{"NUM":1040271396}}},"token":{"block":{"type":"math_number","id":"AsYu_4*yvHu=PIsgL:O.","fields":{"NUM":0}}},"var":{"block":{"type":"variables_get","id":"[7|-dP_~aSad!w8{p`@s","fields":{"VAR":{"id":"GP5HStL]-{xb)S52MqeV"}}}}},"next":{"block":{"type":"folks_oracle","id":"S.xoeyP~.V1u%Gk2^S*s","inputs":{"contract":{"block":{"type":"math_number","id":"BxFjX5AHEuYEah6%Yi(o","fields":{"NUM":1040271396}}},"token":{"block":{"type":"math_number","id":"b56eV=$7Jv4[n.?(4vF+","fields":{"NUM":246516580}}},"var":{"block":{"type":"variables_get","id":"Mm*S:@a]m,C0NqqyvyBn","fields":{"VAR":{"id":"j(f!{NqK5!=iby0Z1lFY"}}}}},"next":{"block":{"type":"assert","id":"Sj3R,?O)E]Ts))1S8^X@","inputs":{"condition":{"block":{"type":"logic_compare","id":"k#zX:iwQS6QrKDLU_De8","fields":{"OP":"LT"},"inputs":{"A":{"block":{"type":"variables_get","id":"Z3bCvQI[!`L#~SA$cb)[","fields":{"VAR":{"id":"j(f!{NqK5!=iby0Z1lFY"}}}},"B":{"block":{"type":"math_number","id":"[qn6G(OkmYToq=;O-j+K","fields":{"NUM":8000000000}}}}}},"error":{"block":{"type":"text","id":"S#kOOlV|Ks5IOs*GUKnC","fields":{"TEXT":"Gold price must be below 80 usd"}}}},"next":{"block":{"type":"variables_set","id":"a;QADXn5dET7Q|3l6$~Q","fields":{"VAR":{"id":"Djm4(/;d^;T:fX3xz3{s"}},"inputs":{"VALUE":{"block":{"type":"math_arithmetic","id":"~R8pB]QeF-ku8k56N#%o","fields":{"OP":"DIVIDE"},"inputs":{"A":{"block":{"type":"math_arithmetic","id":"St+Y4brd!96ts5-I:Jco","fields":{"OP":"MULTIPLY"},"inputs":{"A":{"block":{"type":"variables_get","id":"`]VYAV=w-YFFQRmzOhyW","fields":{"VAR":{"id":"j(f!{NqK5!=iby0Z1lFY"}}}},"B":{"block":{"type":"math_number","id":"j2Xs{8ug6}GiWrin*:8{","fields":{"NUM":100000}}}}}},"B":{"block":{"type":"variables_get","id":"~2,pA#oRFXk3`Hy}yoU[","fields":{"VAR":{"id":"GP5HStL]-{xb)S52MqeV"}}}}}}}},"next":{"block":{"type":"pact_swap","id":"aF?j@;;*pV7sqUfMvPW!","inputs":{"contract":{"block":{"type":"math_number","id":".4U:GgFh%A0ge4);ZD(0","fields":{"NUM":1244947358}}},"sendToken":{"block":{"type":"math_number","id":"Xcm/pVQc_6_[!.n{os(A","fields":{"NUM":0}}},"sendAmount":{"block":{"type":"variables_get","id":"OL;eabC4_c4-f0fY/|,0","fields":{"VAR":{"id":"Djm4(/;d^;T:fX3xz3{s"}}}},"receiveToken":{"block":{"type":"math_number","id":"K.=|BkkUD@VZ@A_XGB$e","fields":{"NUM":1241944285}}},"receiveAmountMin":{"block":{"type":"math_number","id":"p{.Qp-8`U_L3dEMy~_)9","fields":{"NUM":100000}}}}}}}}}}}}}]},"variables":[{"name":"amount","id":"w+5n|;Y_49BJ13F9=DHD"},{"name":"asset","id":"x,h.A=bjs[xLs=Losh6l"},{"name":"goldprice","id":"j(f!{NqK5!=iby0Z1lFY"},{"name":"algoprice","id":"GP5HStL]-{xb)S52MqeV"},{"name":"goldPriceInAlgo","id":"Djm4(/;d^;T:fX3xz3{s"}]}'
      }
    ],
    'testnet-v1.0': [
      {
        id: 'periodic',
        name: 'Periodic payment to another account',
        data: '{"blocks":{"languageVersion":0,"blocks":[{"type":"pay","id":"{[GaAJT8dWJ{an%l:4Q{","x":140,"y":76,"inputs":{"receiver":{"block":{"type":"text","id":"Q3#PA43z++/%-VvY(7Ga","fields":{"TEXT":"ALGONAUTSPIUHDCX3SLFXOFDUKOE4VY36XV4JX2JHQTWJNKVBKPEBQACRY"}}},"token":{"block":{"type":"math_number","id":"vasyr]%m~n)m$_p:%Lz{","fields":{"NUM":0}}},"amount":{"block":{"type":"math_number","id":"Mp@f{Z[6Oe}O%?;.Jl0W","fields":{"NUM":1000000}}}}}]},"variables":[{"name":"amount","id":"w+5n|;Y_49BJ13F9=DHD"},{"name":"asset","id":"x,h.A=bjs[xLs=Losh6l"}]}'
      },
      {
        id: 'dca',
        name: 'DCA',
        data: '{"blocks":{"languageVersion":0,"blocks":[{"type":"pact_swap","id":"sy8,1IjQjpJxN}I)^/7!","x":81,"y":57,"inputs":{"contract":{"block":{"type":"math_number","id":"EPY3RMQ-(nJJ[Yn0oipd","fields":{"NUM":88280437}}},"sendToken":{"block":{"type":"math_number","id":"BW?tdzDSqV.F5#l^d4{O","fields":{"NUM":0}}},"sendAmount":{"block":{"type":"math_number","id":"pv4?cQB4t@)~PRvQW7Jt","fields":{"NUM":10000000}}},"receiveToken":{"block":{"type":"math_number","id":"vasyr]%m~n)m$_p:%Lz{","fields":{"NUM":48806985}}},"receiveAmountMin":{"block":{"type":"math_number","id":"M^GX;19;NqM*2jv+Bll?","fields":{"NUM":1000}}}}}]},"variables":[{"name":"amount","id":"w+5n|;Y_49BJ13F9=DHD"}]}'
      },
      {
        id: 'swapsend',
        name: 'Swap and send',
        data: '{"blocks":{"languageVersion":0,"blocks":[{"type":"variables_set","id":"^g8a-Xx7:Mo/f7eu@3pa","x":488,"y":36,"fields":{"VAR":{"id":"x,h.A=bjs[xLs=Losh6l"}},"inputs":{"VALUE":{"block":{"type":"math_number","id":"vasyr]%m~n)m$_p:%Lz{","fields":{"NUM":48806985}}}},"next":{"block":{"type":"pact_swap","id":"sy8,1IjQjpJxN}I)^/7!","inputs":{"contract":{"block":{"type":"math_number","id":"EPY3RMQ-(nJJ[Yn0oipd","fields":{"NUM":88280437}}},"sendToken":{"block":{"type":"math_number","id":"BW?tdzDSqV.F5#l^d4{O","fields":{"NUM":0}}},"sendAmount":{"block":{"type":"math_number","id":"pv4?cQB4t@)~PRvQW7Jt","fields":{"NUM":10000000}}},"receiveToken":{"block":{"type":"variables_get","id":"=Pqgm8-4vA:(oD:`^r#H","fields":{"VAR":{"id":"x,h.A=bjs[xLs=Losh6l"}}}},"receiveAmountMin":{"block":{"type":"math_number","id":"M^GX;19;NqM*2jv+Bll?","fields":{"NUM":1000}}}},"next":{"block":{"type":"sc_balance","id":"B4GvXa#w~?{b6_Kv](fR","inputs":{"token":{"block":{"type":"variables_get","id":"7k_DSe_s%SlmkH`uWL!-","fields":{"VAR":{"id":"x,h.A=bjs[xLs=Losh6l"}}}},"var":{"block":{"type":"variables_get","id":"m/.beQbNMcBfxAQ.bYr=","fields":{"VAR":{"id":"w+5n|;Y_49BJ13F9=DHD"}}}}},"next":{"block":{"type":"pay","id":"{[GaAJT8dWJ{an%l:4Q{","inputs":{"receiver":{"block":{"type":"text","id":"Q3#PA43z++/%-VvY(7Ga","fields":{"TEXT":"ALGONAUTSPIUHDCX3SLFXOFDUKOE4VY36XV4JX2JHQTWJNKVBKPEBQACRY"}}},"token":{"block":{"type":"variables_get","id":";]o+2c:8x3:(=Z9NMx/w","fields":{"VAR":{"id":"x,h.A=bjs[xLs=Losh6l"}}}},"amount":{"block":{"type":"variables_get","id":"pi_xlN^bX*1AYv3x+YW8","fields":{"VAR":{"id":"w+5n|;Y_49BJ13F9=DHD"}}}}}}}}}}}}]},"variables":[{"name":"amount","id":"w+5n|;Y_49BJ13F9=DHD"},{"name":"asset","id":"x,h.A=bjs[xLs=Losh6l"}]}'
      }
    ],
    'voitest-v1.0': [
      {
        id: 'periodic',
        name: 'Periodic payment to another account',
        data: '{"blocks":{"languageVersion":0,"blocks":[{"type":"pay","id":"{[GaAJT8dWJ{an%l:4Q{","x":140,"y":76,"inputs":{"receiver":{"block":{"type":"text","id":"Q3#PA43z++/%-VvY(7Ga","fields":{"TEXT":"ALGONAUTSPIUHDCX3SLFXOFDUKOE4VY36XV4JX2JHQTWJNKVBKPEBQACRY"}}},"token":{"block":{"type":"math_number","id":"vasyr]%m~n)m$_p:%Lz{","fields":{"NUM":0}}},"amount":{"block":{"type":"math_number","id":"Mp@f{Z[6Oe}O%?;.Jl0W","fields":{"NUM":1000000}}}}}]},"variables":[{"name":"amount","id":"w+5n|;Y_49BJ13F9=DHD"},{"name":"asset","id":"x,h.A=bjs[xLs=Losh6l"}]}'
      }
    ],
    'sandnet-v1': [
      {
        id: 'periodic',
        name: 'Periodic payment to another account',
        data: '{"blocks":{"languageVersion":0,"blocks":[{"type":"pay","id":"{[GaAJT8dWJ{an%l:4Q{","x":140,"y":76,"inputs":{"receiver":{"block":{"type":"text","id":"Q3#PA43z++/%-VvY(7Ga","fields":{"TEXT":"ALGONAUTSPIUHDCX3SLFXOFDUKOE4VY36XV4JX2JHQTWJNKVBKPEBQACRY"}}},"token":{"block":{"type":"math_number","id":"vasyr]%m~n)m$_p:%Lz{","fields":{"NUM":0}}},"amount":{"block":{"type":"math_number","id":"Mp@f{Z[6Oe}O%?;.Jl0W","fields":{"NUM":1000000}}}}}]},"variables":[{"name":"amount","id":"w+5n|;Y_49BJ13F9=DHD"},{"name":"asset","id":"x,h.A=bjs[xLs=Losh6l"}]}'
      }
    ]
  }
})
const store = useAppStore()

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

    toast.add({
      severity: 'success',
      detail: `App has been built`,
      life: 10000
    })

    state.isBuilding = false
  } catch (e: any) {
    state.isBuilding = false
    toast.add({
      severity: 'error',
      detail: `Error while building: ${e.message ?? e}`,
      life: 10000
    })
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

const loadFeeToken = async () => {
  const poolManagerApp = getPoolManagerApp(store.state.env)
  const algod = new Algodv2(store.state.algodToken, store.state.algodHost, store.state.algodPort)
  const app = await algod.getApplicationByID(poolManagerApp).do()
  if (!app) {
    console.error('failed to load fee token')
    return
  }
  const key = app.params['global-state'].find((a: any) => a.key == 'ZmE=')
  if (!key || !key.value) {
    console.error('failed to load fee token')
    return
  }
  state.feeToken = key.value.uint
}

onMounted(async () => {
  reloadStateFromLocalstorage()
  await loadFeeToken()
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
        life: 10000
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
      life: 10000
    })
    const txInfo = await Algosdk.waitForConfirmation(algod, txId, 10)
    state.appId = txInfo['application-index']
    toast.add({
      severity: 'success',
      detail: `App ${state.appId} has been created`,
      life: 10000
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
      life: 10000
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
        life: 10000
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
      life: 10000
    })
    const txInfo = await Algosdk.waitForConfirmation(algod, txId, 10)
    toast.add({
      severity: 'success',
      detail: `App ${state.appId} has been updated`,
      life: 10000
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
      life: 10000
    })
  }
}
const toConfirmDeleteTask = () => {
  confirm.require({
    message: 'Are you sure you want to delete the app?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: async () => {
      toast.add({ severity: 'info', summary: 'Confirmed', detail: 'You have accepted', life: 3000 })
      await deleteTask()
    },
    reject: () => {
      toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
    }
  })
}
const deleteTask = async () => {
  try {
    if (!store.state.authState.isAuthenticated) {
      toast.add({
        severity: 'info',
        detail: 'Authenticate first please, and repeat the action',
        life: 10000
      })
      return
    }

    state.isDeleting = true

    const txsRequest = await axios.get(
      `${store.state.bff}/v1/tx-delete/${state.buildInfo.hash}/${store.state.env}/${state.appId}/${store.state.authState.account}/${state.buildInfo.client}`
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
      life: 10000
    })
    const txInfo = await Algosdk.waitForConfirmation(algod, txId, 10)
    toast.add({
      severity: 'success',
      detail: `App ${state.appId} has been deleted`,
      life: 10000
    })

    console.log('sent', txInfo)
    console.log('delete done')
    state.isDeleting = false
  } catch (e: any) {
    state.isSigningDeployTx = false
    state.isDeleting = false
    console.error(e)

    toast.add({
      severity: 'error',
      detail: 'Error during update: ' + (e.message ?? e),
      life: 10000
    })
  }
}
const configure = async () => {
  try {
    if (!store.state.authState.isAuthenticated) {
      toast.add({
        severity: 'info',
        detail: 'Authenticate first please, and repeat the action',
        life: 10000
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
      life: 10000
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
      life: 10000
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
watch(
  () => store.state.env,
  async () => {
    await loadFeeToken()
  }
)
const optin = async () => {
  try {
    state.isDeploying = true
    if (!store.state.authState.isAuthenticated) {
      toast.add({
        severity: 'info',
        detail: 'Authenticate first please, and repeat the action',
        life: 10000
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
    var client = new BiatecCronJobShortHashClient(
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
        sendParams: {
          fee: algokit.microAlgos(2000)
        },
        assets: [asset]
      }
    )
    console.log('transfer', transfer)
    state.isOpting = false
    toast.add({
      severity: 'success',
      detail: `Optin ${state.appId} to asset ${state.optinAsset} is successful`,
      life: 10000
    })
  } catch (e: any) {
    state.isOpting = false
    console.error(e)

    toast.add({
      severity: 'error',
      detail: 'Error opting: ' + (e.message ?? e),
      life: 10000
    })
  }
  reloadStateFromLocalstorage()
}

const fund = async () => {
  try {
    if (!store.state.authState.isAuthenticated) {
      toast.add({
        severity: 'info',
        detail: 'Authenticate first please, and repeat the action',
        life: 10000
      })
      store.state.forceAuth = true
      return
    }
    state.isFunding = true
    const signer = {
      addr: store.state.authState.account,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        const groupedEncoded = txnGroup.map((tx: Algosdk.Transaction) => tx.toByte())
        const signed = (await store.state.authComponent.sign(groupedEncoded)) as Uint8Array[]
        return signed
      }
    }

    const algod = new Algodv2(store.state.algodToken, store.state.algodHost, store.state.algodPort)
    const suggestedParams = await algod.getTransactionParams().do()
    var client = new BiatecTaskManagerClient(
      {
        id: store.state.appTaskPoolId,
        resolveBy: 'id',
        sender: signer
      },
      algod
    )
    const global = await client.getGlobalState()
    let deposit = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: state.gasAmount * 10 ** 6,
      from: signer.addr,
      suggestedParams,
      to: algosdk.getApplicationAddress(store.state.appTaskPoolId)
    })
    if (global.fa && global.fa.asNumber() > 0) {
      deposit = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        amount: state.gasAmount * 10 ** 6,
        from: signer.addr,
        suggestedParams,
        to: algosdk.getApplicationAddress(store.state.appTaskPoolId),
        assetIndex: global.fa.asNumber()
      })
    }

    const boxRef = getBoxReferenceApp(store.state.appTaskPoolId, state.appId)
    const transfer = await client.fundTask(
      {
        deposit: deposit,
        taskAppId: state.appId
      },
      {
        sendParams: {
          fee: algokit.microAlgos(1000)
        },
        boxes: [boxRef]
      }
    )
    console.log('transfer', transfer)
    state.isFunding = false
    toast.add({
      severity: 'success',
      detail: `Funding was successful`,
      life: 10000
    })
  } catch (e: any) {
    state.isFunding = false
    console.error(e)

    toast.add({
      severity: 'error',
      detail: 'Error funding: ' + (e.message ?? e),
      life: 10000
    })
  }
  reloadStateFromLocalstorage()
}

const copyLink = () => {
  const link = `${store.state.bff}${state.buildInfo.files[state.selectedFile]}`
  copy(link)

  toast.add({
    severity: 'info',
    detail: 'Link copied to clipboard: ' + link,
    life: 10000
  })
}
interface ITemplate {
  id: string
  name: string
  data: string
}
interface IId2Template {
  [key: string]: ITemplate[]
}
// a computed ref
const currentTemplates = computed(() => {
  if (!state.templates) return []
  if (!store.state.env) return []
  if (!(store.state.env in state.templates)) return []
  const templates = state.templates as IId2Template
  return templates[store.state.env]
})

const setTemplate = () => {
  const template = currentTemplates.value.find((t: ITemplate) => t.id == state.currentTemplate)
  console.log('template', template)
  if (template && template.data) {
    const workObj = JSON.parse(template.data)
    console.log('restoring work', workObj)
    Blockly.serialization.workspaces.load(workObj, workspace.value.workspace)
  }
}
</script>

<template>
  <PublicLayout>
    <ConfirmDialog />
    <div class="grid m-1" v-if="!state.selectedFile">
      <div class="col-12">
        <h2 class="m-2">Step 1: Start with a predefined template</h2>
        <div v-if="state.templates && store.state.env && store.state.env in state.templates">
          <DropDown
            :options="currentTemplates"
            v-model="state.currentTemplate"
            option-label="name"
            option-value="id"
            placeholder="Select template"
            class="m-1"
          ></DropDown>
          <Button class="m-1" @click="setTemplate">Set</Button>
        </div>
        <div v-else>There are no templates for selected network</div>
      </div>
      <div class="col-12">
        <h2 class="m-2">Step 2: Setup your scheduler</h2>
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
            >Step 3: Generate biatec scheduler code
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
            Step 4: Build smart contract
          </Button>
          <ProgressSpinner
            v-if="state.isBuilding"
            style="width: 2em; height: 2em"
            strokeWidth="10"
            class="m-2"
          />
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
            Step 5: Deploy to {{ store.state.envName }}
          </Button>
          <Button
            v-if="state.appId"
            @click="update()"
            class="m-2"
            :severity="state.appId ? 'secondary' : 'primary'"
            :disabled="state.isDeploying"
          >
            Step 5: Update {{ state.appId }} to {{ store.state.envName }}
          </Button>
          <ProgressSpinner
            v-if="state.isDeploying"
            style="width: 2em; height: 2em"
            strokeWidth="10"
            class="m-2"
          />

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
            Step 6: Configure
          </Button>
          <ProgressSpinner
            v-if="state.isBootsraping"
            style="width: 2em; height: 2em"
            strokeWidth="10"
            class="m-2"
          />

          <Message v-if="state.isSigningBootstrapTx" severity="info">
            Please check your wallet and sign deploy transaction
          </Message>
        </div>
        <div v-if="state.isBootstrapDone">
          <Message severity="info"> Contract is deployed </Message>
          <p>
            Use address <AlgorandAddress :address="Algosdk.getApplicationAddress(state.appId)" /> to
            deposit funds for scheduled task.
          </p>
        </div>
        <div v-if="state.isBootstrapDone">
          <InputNumber
            v-model="state.optinAsset"
            :min="0"
            placeholder="Asset id to opt in with escrow account"
            class="m-2"
          />
          <Button @click="optin" class="m-2" severity="secondary" :disabled="state.isOpting">
            Opt task {{ state.appId }} in to asset
          </Button>
          <ProgressSpinner
            v-if="state.isOpting"
            style="width: 2em; height: 2em"
            strokeWidth="10"
            class="m-2"
          />
        </div>
        <div v-if="state.isBootstrapDone">
          <p>
            Executors are paid in <a href="https://www.asa.gold" target="_blank">ASA.Gold</a> token.
            You must deposit the gold token to the task manager smart contract. If you are out of
            gold gas, the executors will not execute your task. Fee token id for network
            {{ store.state.env }} is {{ state.feeToken }}.
          </p>
          <InputNumber
            v-model="state.gasAmount"
            :min="0"
            :step="0.1"
            placeholder="Amount of asa.gold to deposit"
            class="m-2"
          />
          <Button @click="fund" class="m-2" severity="primary" :disabled="state.isFunding">
            Fund task for executors
          </Button>
          <ProgressSpinner
            v-if="state.isFunding"
            style="width: 2em; height: 2em"
            strokeWidth="10"
            class="m-2"
          />
        </div>
        <div v-if="state.isBootstrapDone">
          <Button
            @click="toConfirmDeleteTask"
            class="m-2"
            severity="danger"
            :disabled="state.isDeleting"
          >
            Delete task
          </Button>
          <ProgressSpinner
            v-if="state.isDeleting"
            style="width: 2em; height: 2em"
            strokeWidth="10"
            class="m-2"
          />
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
