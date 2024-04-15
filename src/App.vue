<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { Gradient } from 'whatamesh'
import { useAppStore } from './stores/app'
const store = useAppStore()

let gradient = new Gradient()
onMounted(() => {
  gradient.initGradient('#gradient-canvas')
})

watch(
  store.state,
  () => {
    setTimeout(() => {
      gradient.initGradient('#gradient-canvas')
    }, 200)
  },
  { deep: true }
)
</script>

<template>
  <canvas id="gradient-canvas"></canvas>
  <RouterView />
</template>
