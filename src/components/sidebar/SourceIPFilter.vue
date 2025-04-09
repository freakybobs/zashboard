<template>
  <select
    v-if="!horizontal"
    class="join-item select select-sm"
    v-model="sourceIPFilter"
  >
    <option :value="null">{{ $t('allSourceIP') }}</option>
    <option
      v-for="opt in sourceIPOpts"
      :key="opt.value.join(',')"
      :value="opt.value"
    >
      {{ opt.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { getIPLabelFromMap } from '@/helper'
import { connections, sourceIPFilter } from '@/store/connections'
import { isEqual, uniq } from 'lodash'
import { computed, ref, watch } from 'vue'
defineProps<{
  horizontal?: boolean
}>()

const sourceIPs = computed(() => {
  return uniq(connections.value.map((conn) => conn.metadata.sourceIP)).sort()
})
const sourceIPOpts = ref<{ label: string; value: string[] }[]>([])

// do not use computed here for firefox
watch(
  sourceIPs,
  (value, oldValue) => {
    if (isEqual(value, oldValue)) return
    sourceIPOpts.value = []

    sourceIPs.value.forEach((ip) => {
      const label = getIPLabelFromMap(ip)
      const index = sourceIPOpts.value.findIndex((opt) => opt.label === label)

      if (index === -1) {
        sourceIPOpts.value.push({
          label,
          value: [ip],
        })
      } else {
        sourceIPOpts.value[index].value.push(ip)
      }
    })

    if (sourceIPFilter.value !== null) {
      const currentLabel = getIPLabelFromMap(sourceIPFilter.value[0])
      const current = sourceIPOpts.value.find((opt) => opt.label === currentLabel)

      if (!current) {
        sourceIPOpts.value.unshift({
          label: currentLabel,
          value: sourceIPFilter.value,
        })
      } else if (!isEqual(current.value, sourceIPFilter.value)) {
        sourceIPFilter.value = current.value
      }
    }
  },
  {
    immediate: true,
  },
)
</script>
