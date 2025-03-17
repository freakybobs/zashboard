import {
  disconnectByIdAPI,
  fetchProxiesAPI,
  fetchProxyGroupLatencyAPI,
  fetchProxyLatencyAPI,
  fetchProxyProviderAPI,
  isSingBox,
  selectProxyAPI,
} from '@/api'
import { useNotification } from '@/composables/notification'
import { IPV6_TEST_URL, NOT_CONNECTED, PROXY_TYPE, TEST_URL } from '@/constant'
import { isProxyGroup } from '@/helper'
import type { Proxy, ProxyProvider } from '@/types'
import { useStorage } from '@vueuse/core'
import { debounce, last } from 'lodash'
import pLimit from 'p-limit'
import { ref } from 'vue'
import { activeConnections } from './connections'
import {
  automaticDisconnection,
  independentLatencyTest,
  IPv6test,
  speedtestTimeout,
  speedtestUrl,
} from './settings'

export const GLOBAL = 'GLOBAL'
export const proxyGroupList = ref<string[]>([])
export const proxyMap = ref<Record<string, Proxy>>({})
export const IPv6Map = useStorage<Record<string, boolean>>('config/ipv6-map', {})
export const hiddenGroupMap = useStorage<Record<string, boolean>>('config/hidden-group-map', {})
export const proxyProviederList = ref<ProxyProvider[]>([])

export const getTestUrl = (groupName?: string) => {
  const defaultUrl = speedtestUrl.value || TEST_URL

  if (!groupName) {
    return defaultUrl
  }

  const proxyNode = proxyMap.value[groupName]

  if (independentLatencyTest.value && proxyNode.testUrl) {
    return proxyNode.testUrl
  }

  return defaultUrl
}

export const getLatencyByName = (proxyName: string, groupName?: string) => {
  const history = getHistoryByName(proxyName, groupName)

  return getLatencyFromHistory(history)
}

export const getHistoryByName = (proxyName: string, groupName?: string) => {
  if (independentLatencyTest.value && !isSingBox.value) {
    const proxyNode = proxyMap.value[proxyName]

    return proxyNode?.extra?.[getTestUrl(groupName)]?.history
  }

  const nowNode = proxyMap.value[getNowProxyNodeName(proxyName)]

  return nowNode?.history
}

export const getIPv6ByName = (proxyName: string) => {
  return IPv6Map.value[getNowProxyNodeName(proxyName)]
}

export const fetchProxies = async () => {
  const { data: proxyData } = await fetchProxiesAPI()
  const { data: providerData } = await fetchProxyProviderAPI()
  const sortIndex = proxyData.proxies[GLOBAL].all ?? []

  proxyMap.value = proxyData.proxies
  proxyGroupList.value = Object.values(proxyData.proxies)
    .filter((proxy) => proxy.all?.length && proxy.name !== GLOBAL)
    .sort((prev, next) => sortIndex.indexOf(prev.name) - sortIndex.indexOf(next.name))
    .map((proxy) => proxy.name)

  Object.entries(proxyData.proxies).map(([name, proxy]) => {
    if (IPv6test.value && getIPv6FromExtra(proxy)) {
      IPv6Map.value[name] = true
    }
    if (proxy.hidden && !(name in hiddenGroupMap.value)) {
      hiddenGroupMap.value[name] = true
    }
  })
  proxyProviederList.value = Object.values(providerData.providers).filter(
    (provider) => provider.name !== 'default' && provider.vehicleType !== 'Compatible',
  )
}

export const selectProxy = async (proxyGroup: string, name: string) => {
  await selectProxyAPI(proxyGroup, name)
  proxyMap.value[proxyGroup].now = name

  if (automaticDisconnection.value) {
    activeConnections.value
      .filter((c) => c.chains.includes(proxyGroup))
      .forEach((c) => disconnectByIdAPI(c.id))
  }
  fetchProxies()
}

const latencyTestForSingle = async (proxyName: string, url: string, timeout: number) => {
  const now = getNowProxyNodeName(proxyName)

  if (IPv6test.value) {
    try {
      const { data: ipv6LatencyResult } = await fetchProxyLatencyAPI(now, IPV6_TEST_URL, 2000)

      IPv6Map.value[now] = ipv6LatencyResult.delay > NOT_CONNECTED
    } catch {
      IPv6Map.value[now] = false
    }
  }

  await fetchProxyLatencyAPI(independentLatencyTest.value ? proxyName : now, url, timeout)
}

export const proxyLatencyTest = async (
  proxyName: string,
  url = speedtestUrl.value,
  timeout = speedtestTimeout.value,
) => {
  await latencyTestForSingle(proxyName, url, timeout)
  await fetchProxies()
}

const fetchProxiesDebounced = debounce(fetchProxies, 800)
const proxyLatencyTestDebounced = async (
  proxyName: string,
  url = speedtestUrl.value,
  timeout = speedtestTimeout.value,
) => {
  await latencyTestForSingle(proxyName, url, timeout)
  await fetchProxiesDebounced()
}

const limiter = pLimit(5)

export const proxyGroupLatencyTest = async (proxyGroupName: string) => {
  const proxyNode = proxyMap.value[proxyGroupName]
  const all = proxyNode.all ?? []
  const url = getTestUrl(proxyGroupName)

  if (
    [PROXY_TYPE.Selector, PROXY_TYPE.LoadBalance].includes(
      proxyNode.type.toLowerCase() as PROXY_TYPE,
    )
  ) {
    let testDone = 0

    return await Promise.all(
      all.map((name) =>
        limiter(async () => {
          await proxyLatencyTestDebounced(name, url, Math.min(3000, speedtestTimeout.value))
          testDone++
          latencyTip(testDone, all.length)
        }),
      ),
    )
  }

  const timeout = Math.max(5000, speedtestTimeout.value)

  if (IPv6test.value) {
    try {
      const { data: ipv6LatencyResult } = await fetchProxyGroupLatencyAPI(
        proxyGroupName,
        IPV6_TEST_URL,
        timeout,
      )

      all?.forEach((name) => {
        IPv6Map.value[getNowProxyNodeName(name)] = ipv6LatencyResult[name] > NOT_CONNECTED
      })
    } catch {
      all?.forEach((name) => {
        IPv6Map.value[getNowProxyNodeName(name)] = false
      })
    }
  }
  await fetchProxyGroupLatencyAPI(proxyGroupName, url, timeout)
  await fetchProxies()
}

export const allProxiesLatencyTest = async () => {
  const proxyNode = Object.keys(proxyMap.value).filter((proxy) => !isProxyGroup(proxy))
  let testDone = 0

  return await Promise.all(
    proxyNode.map((name) =>
      limiter(async () => {
        await proxyLatencyTestDebounced(
          name,
          speedtestUrl.value,
          Math.min(3000, speedtestTimeout.value),
        )
        testDone++
        latencyTip(testDone, proxyNode.length)
      }),
    ),
  )
}

const getLatencyFromHistory = (history: Proxy['history']) => {
  return last(history)?.delay ?? NOT_CONNECTED
}

const getIPv6FromExtra = (proxy: Proxy) => {
  const ipv6History = proxy.extra?.[IPV6_TEST_URL]?.history

  return (last(ipv6History)?.delay ?? NOT_CONNECTED) > NOT_CONNECTED
}

export const getNowProxyNodeName = (name: string) => {
  let node = proxyMap.value[name]

  if (!name || !node) {
    return name
  }

  while (node.now && node.now !== node.name) {
    const nextNode = proxyMap.value[node.now]

    if (!nextNode) {
      return node.name
    }

    node = nextNode
  }

  return node.name
}

const { showNotification } = useNotification()
const latencyTip = (finished: number, total: number) => {
  const isFinished = finished === total

  showNotification({
    content: 'testFinishedTip',
    params: {
      number: `${finished}/${total}`,
    },
    type: isFinished ? 'alert-success' : 'alert-warning',
    timeout: isFinished ? 2000 : 0,
  })
}
