<template>
  <div class="card w-full gap-2 p-2 text-sm">
    <div class="flex flex-1 items-center gap-2">
      <span>{{ index }}.</span>
      <span class="text-info">{{ ruleProvider.name }}</span>
      <span class="badge badge-sm bg-base-200">
        {{ ruleProvider.ruleCount }}
      </span>
    </div>
    <div class="text-base-content/80 flex h-4 items-center gap-2 text-xs">
      <span>{{ ruleProvider.behavior }}</span>
      <span>{{ ruleProvider.vehicleType }}</span>
      <span>{{ $t('updated') }} {{ fromNow(ruleProvider.updatedAt) }}</span>
      <button
        v-if="ruleProvider.vehicleType !== 'Inline'"
        :class="twMerge('btn btn-circle btn-xs', isUpdating ? 'animate-spin' : '')"
        @click="updateRuleProviderClickHandler"
      >
        <ArrowPathIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { updateRuleProviderAPI } from '@/api'
import { fromNow } from '@/helper'
import { fetchRules } from '@/store/rules'
import type { RuleProvider } from '@/types'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { twMerge } from 'tailwind-merge'
import { ref } from 'vue'
const isUpdating = ref(false)
const props = defineProps<{
  ruleProvider: RuleProvider
  index: number
}>()

const updateRuleProviderClickHandler = async () => {
  if (isUpdating.value) return

  isUpdating.value = true
  await updateRuleProviderAPI(props.ruleProvider.name)
  fetchRules()
  isUpdating.value = false
}
</script>
