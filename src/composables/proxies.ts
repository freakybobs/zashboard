import { PROXY_TAB_TYPE } from '@/constant'
import { isHiddenGroup } from '@/helper'
import { configs } from '@/store/config'
import { GLOBAL, proxyGroupList, proxyMap, proxyProviederList } from '@/store/proxies'
import { displayGlobalByMode, manageHiddenGroup } from '@/store/settings'
import { isEmpty } from 'lodash'
import { computed, ref } from 'vue'

export const proxiesFilter = ref('')

const filterGroups = (all: string[]) => {
  if (manageHiddenGroup.value) {
    return all
  }

  return all.filter((name) => !isHiddenGroup(name))
}
const proxiesTabShow = ref(PROXY_TAB_TYPE.PROXIES)
const renderGroups = computed(() => {
  if (isEmpty(proxyMap.value)) {
    return []
  }

  if (proxiesTabShow.value === PROXY_TAB_TYPE.PROVIDER) {
    return proxyProviederList.value.map((group) => group.name)
  }

  if (displayGlobalByMode.value) {
    if (configs.value?.mode.toUpperCase() === GLOBAL) {
      return [GLOBAL]
    }

    return filterGroups(proxyGroupList.value)
  }

  return filterGroups([...proxyGroupList.value, GLOBAL])
})

export const useProxies = () => {
  return {
    proxiesTabShow,
    renderGroups,
  }
}
