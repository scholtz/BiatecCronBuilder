<script setup lang="ts">
import Blockly from 'blockly'
import { onMounted, ref, shallowRef } from 'vue'

const props = defineProps(['options'])
const blocklyToolbox = ref()
const blocklyDiv = ref()
const workspace = shallowRef()

defineExpose({ workspace })

onMounted(() => {
  const options = props.options || {}
  if (!options.toolbox) {
    options.toolbox = blocklyToolbox.value
  }
  workspace.value = Blockly.inject(blocklyDiv.value, options)
})
</script>

<template>
  <div>
    <div class="blocklyDiv w-full" ref="blocklyDiv"></div>
    <xml ref="blocklyToolbox" style="display: none">
      <slot></slot>
    </xml>
  </div>
</template>

<style>
.blocklyDiv {
  height: 30vh;
  text-align: left;
}
.blocklyToolboxDiv {
  background-color: var(--surface-ground);
}
</style>
