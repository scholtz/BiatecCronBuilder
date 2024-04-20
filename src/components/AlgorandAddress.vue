<script setup lang="ts">
import copy from 'copy-to-clipboard'
import { useAppStore } from '../stores/app'
const props = defineProps({
  address: String
})
const store = useAppStore()
</script>
<template>
  <span v-if="props.address?.length == 58">
    <span
      title="'Address: ' + props.address + ' Tap to copy.'"
      v-tooltip="'Address: ' + props.address + ' Tap to copy.'"
      @click="copy(props.address)"
      class="mx-1"
    >
      {{ props.address.substring(0, 4) }}..{{ props.address.substring(props.address.length - 4) }}
    </span>
    <span>
      <a :href="`${store.state.explorer}/${props.address}`" target="_blank">
        <i class="pi pi-external-link" style="font-size: 1rem"></i>
      </a>
    </span>
  </span>

  <div v-else>
    {{ props.address }}
  </div>
</template>
