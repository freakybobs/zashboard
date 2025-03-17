<template>
  <div :class="`collapse ${showCollapse ? 'collapse-open' : 'collapse-close'}`">
    <div
      class="collapse-title cursor-pointer pr-4 select-none"
      @click="showCollapse = !showCollapse"
    >
      <slot name="title"></slot>
      <slot
        v-if="showPreview"
        name="preview"
      ></slot>
    </div>
    <div
      class="collapse-content flex flex-col gap-2 max-sm:px-2"
      @transitionstart="handlerTransitionStart"
      @transitionend="handlerTransitionEnd"
    >
      <slot
        v-if="showContent"
        name="content"
      ></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collapsedBus } from '@/composables/bus'
import { collapseGroupMap } from '@/store/settings'
import { computed, nextTick, onUnmounted, ref } from 'vue'

const props = defineProps<{
  name: string
}>()

const showCollapse = computed({
  get() {
    return collapseGroupMap.value[props.name]
  },
  set(value) {
    if (value) {
      showPreview.value = false
      showContent.value = true
      nextTick(() => {
        collapseGroupMap.value[props.name] = true
      })
    } else {
      collapseGroupMap.value[props.name] = false
    }
  },
})

const showContent = ref(showCollapse.value)
const showPreview = ref(!showCollapse.value)
const handlerTransitionStart = () => {
  if (!showCollapse.value) {
    setTimeout(() => {
      showPreview.value = !showCollapse.value
    }, 50)
  }
}
const handlerTransitionEnd = () => {
  if (!showCollapse.value) {
    showContent.value = false
  }
}

const busHandler = ({ open }: { open: boolean }) => {
  showCollapse.value = open
}

collapsedBus.on(busHandler)

onUnmounted(() => {
  collapsedBus.off(busHandler)
})
</script>
