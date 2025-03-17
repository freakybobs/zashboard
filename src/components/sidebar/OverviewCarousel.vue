<template>
  <div
    class="card carousel carousel-vertical hover:scrollbar-thin h-28 shrink-0 overflow-x-hidden text-sm"
  >
    <SpeedCharts class="carousel-item box-border" />
    <MemoryCharts class="carousel-item box-border" />
    <ConnectionsCharts class="carousel-item box-border" />
  </div>
</template>

<script setup lang="ts">
import ConnectionsCharts from '@/components/overview/ConnectionsCharts.vue'
import MemoryCharts from '@/components/overview/MemoryCharts.vue'
import SpeedCharts from '@/components/overview/SpeedCharts.vue'
</script>
