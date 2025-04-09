<script setup lang="ts">
import { XCircleIcon } from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useNotification } from './composables/notification'
import { FONTS } from './constant'
import { getBase64FromIndexedDB, isPreferredDark, LOCAL_IMAGE } from './helper/utils'
import {
  customBackgroundURL,
  dashboardTransparent,
  disablePullToRefresh,
  font,
  theme,
} from './store/settings'

const app = ref<HTMLElement>()
const { tipContent, tipShowModel, tipType } = useNotification()
const fontClassMap = {
  [FONTS.MI_SANS]: 'font-MiSans',
  [FONTS.SARASA_UI]: 'font-SarasaUI',
  [FONTS.PING_FANG]: 'font-PingFang',
  [FONTS.FIRA_SANS]: 'font-FiraSans',
  [FONTS.SYSTEM_UI]: 'font-SystemUI',
}
const fontClassName = computed(() => fontClassMap[font.value])
const date = dayjs().format('YYYY-MM-DD')

const backgroundInDB = ref('')
const getBackgroundInDB = async () => {
  backgroundInDB.value = (await getBase64FromIndexedDB()) || ''
}

watch(
  () => customBackgroundURL.value,
  () => {
    if (customBackgroundURL.value.includes(LOCAL_IMAGE)) {
      getBackgroundInDB()
    }
  },
  {
    immediate: true,
  },
)

const backgroundImage = computed(() => {
  if (!customBackgroundURL.value) {
    return ''
  }

  if (customBackgroundURL.value.includes(LOCAL_IMAGE)) {
    return `background-image: url('${backgroundInDB.value}');`
  }
  return `background-image: url('${customBackgroundURL.value}?v=${date}');`
})

const setThemeColor = () => {
  const themeColor = getComputedStyle(app.value!).getPropertyValue('background-color').trim()
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', themeColor)
  }
}

watch(isPreferredDark, setThemeColor)

watch(
  disablePullToRefresh,
  () => {
    if (disablePullToRefresh.value) {
      document.body.style.overscrollBehavior = 'none'
      document.documentElement.style.overscrollBehavior = 'none'
    } else {
      document.body.style.overscrollBehavior = ''
      document.documentElement.style.overscrollBehavior = ''
    }
  },
  {
    immediate: true,
  },
)

onMounted(() => {
  watch(
    theme,
    () => {
      document.body.setAttribute('data-theme', theme.value)
      setThemeColor()
    },
    {
      immediate: true,
    },
  )
})
</script>

<template>
  <div
    ref="app"
    id="app-content"
    :class="[
      'bg-base-100 flex h-dvh w-screen overflow-x-hidden',
      fontClassName,
      backgroundImage &&
        `custom-background-${dashboardTransparent} custom-background bg-cover bg-center`,
    ]"
    :style="backgroundImage"
  >
    <RouterView />
    <div
      class="toast-sm toast toast-end toast-top z-50 max-w-64 text-sm md:translate-y-8"
      v-if="tipShowModel"
    >
      <div
        class="breaks-all alert flex p-2 whitespace-normal"
        :class="tipType"
      >
        <a
          href="https://github.com/Zephyruso/zashboard/blob/main/README.md"
          target="_blank"
          class="flex-1"
        >
          {{ tipContent }}
        </a>
        <button
          class="btn btn-circle btn-ghost btn-xs"
          @click="tipShowModel = false"
        >
          <XCircleIcon class="w-4 cursor-pointer" />
        </button>
      </div>
    </div>
  </div>
</template>
