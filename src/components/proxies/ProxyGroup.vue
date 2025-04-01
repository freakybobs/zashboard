<template>
  <CollapseCard :name="proxyGroup.name">
    <template v-slot:title>
      <div
        class="relative flex items-center gap-2"
        @contextmenu.prevent.stop="handlerLatencyTest"
      >
        <div class="flex flex-1 items-center gap-1">
          <ProxyName
            :name="proxyGroup.name"
            size="large"
          />
          <span class="text-base-content/60 text-xs">
            : {{ proxyGroup.type }} ({{ proxiesCount }})
          </span>
          <button
            v-if="manageHiddenGroup"
            class="btn btn-circle btn-xs z-10 ml-1"
            @click.stop="handlerGroupToggle"
          >
            <EyeIcon
              v-if="!hiddenGroup"
              class="h-3 w-3"
            />
            <EyeSlashIcon
              v-else
              class="h-3 w-3"
            />
          </button>
        </div>
        <LatencyTag
          :class="twMerge('bg-base-200/50 z-10 hover:shadow-sm')"
          :loading="isLatencyTesting"
          :name="proxyGroup.now"
          :group-name="proxyGroup.name"
          @click.stop="handlerLatencyTest"
        />
      </div>
      <div
        class="text-base-content/80 mt-[2px] flex items-center gap-2"
        @contextmenu.prevent.stop="handlerLatencyTest"
      >
        <div class="flex flex-1 items-center gap-1 text-sm">
          <template v-if="proxyGroup.now">
            <LockClosedIcon
              class="h-4 w-4 shrink-0"
              v-if="proxyGroup.fixed === proxyGroup.now"
              @mouseenter="tipForFixed"
            />
            <ArrowRightCircleIcon
              class="h-4 w-4 shrink-0"
              v-else
            />
            <ProxyName
              :name="proxyGroup.now"
              @mouseenter="tipForNow"
            />
          </template>
          <template v-else-if="proxyGroup.type.toLowerCase() === PROXY_TYPE.LoadBalance">
            <CheckCircleIcon class="h-4 w-4 shrink-0" />
            {{ $t('loadBalance') }}
          </template>
        </div>
        <div class="min-w-12 shrink-0 text-right text-xs">
          {{ prettyBytesHelper(downloadTotal) }}/s
        </div>
      </div>
    </template>
    <template v-slot:preview>
      <ProxyPreview
        :nodes="renderProxies"
        :now="proxyGroup.now"
        :groupName="proxyGroup.name"
        @nodeclick="handlerProxySelect($event)"
      />
    </template>
    <template v-slot:content="{ showFullContent }">
      <ProxyNodeGrid>
        <ProxyNodeCard
          v-for="node in showFullContent
            ? renderProxies
            : renderProxies.slice(0, twoColumnProxyGroup ? 48 : 96)"
          :key="node"
          :name="node"
          :group-name="proxyGroup.name"
          :active="node === proxyGroup.now"
          @click="handlerProxySelect(node)"
        />
      </ProxyNodeGrid>
    </template>
  </CollapseCard>
</template>

<script setup lang="ts">
import { useRenderProxies } from '@/composables/renderProxies'
import { PROXY_TYPE } from '@/constant'
import { isHiddenGroup, prettyBytesHelper } from '@/helper'
import { useTooltip } from '@/helper/tooltip'
import { activeConnections } from '@/store/connections'
import {
  fetchProxies,
  getNowProxyNodeName,
  hiddenGroupMap,
  proxyGroupLatencyTest,
  proxyMap,
  selectProxy,
} from '@/store/proxies'
import { manageHiddenGroup, twoColumnProxyGroup } from '@/store/settings'
import {
  ArrowRightCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from '@heroicons/vue/24/outline'
import { twMerge } from 'tailwind-merge'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CollapseCard from '../common/CollapseCard.vue'
import LatencyTag from './LatencyTag.vue'
import ProxyName from './ProxyName.vue'
import ProxyNodeCard from './ProxyNodeCard.vue'
import ProxyNodeGrid from './ProxyNodeGrid.vue'
import ProxyPreview from './ProxyPreview.vue'

const props = defineProps<{
  name: string
}>()
const proxyGroup = computed(() => proxyMap.value[props.name])
const allProxies = computed(() => proxyGroup.value.all ?? [])
const { proxiesCount, renderProxies } = useRenderProxies(allProxies, props.name)
const isLatencyTesting = ref(false)
const handlerLatencyTest = async () => {
  if (isLatencyTesting.value) return

  isLatencyTesting.value = true
  try {
    await proxyGroupLatencyTest(props.name)
    isLatencyTesting.value = false
  } catch {
    isLatencyTesting.value = false
  }
}
const downloadTotal = computed(() => {
  const speed = activeConnections.value
    .filter((conn) => conn.chains.includes(props.name))
    .reduce((total, conn) => total + conn.downloadSpeed, 0)

  return speed
})

const hiddenGroup = computed({
  get: () => isHiddenGroup(props.name),
  set: (value: boolean) => {
    hiddenGroupMap.value[props.name] = value
  },
})

const handlerGroupToggle = () => {
  hiddenGroup.value = !hiddenGroup.value
}

const { showTip } = useTooltip()
const tipForNow = (e: Event) => {
  const nowNode = getNowProxyNodeName(props.name)
  if (!nowNode || nowNode === proxyGroup.value.now) return

  showTip(e, nowNode, {
    delay: [500, 0],
  })
}

const { t } = useI18n()
const tipForFixed = (e: Event) => {
  showTip(e, t('tipForFixed'), {
    delay: [500, 0],
  })
}

const handlerProxySelect = async (name: string) => {
  if (proxyGroup.value.type.toLowerCase() === PROXY_TYPE.LoadBalance) return

  if (proxyGroup.value.now === name) {
    await fetchProxies()
    if (proxyGroup.value.now === name) return
  }

  selectProxy(props.name, name)
}
</script>
