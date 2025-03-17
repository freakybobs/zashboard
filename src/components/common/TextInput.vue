<template>
  <div class="relative">
    <XMarkIcon
      v-if="beforeClose && clearable"
      class="absolute top-2 right-2 z-10 h-4 w-3 cursor-pointer hover:scale-125"
      @click="clearInput"
    />
    <input
      v-model="inputValue"
      type="text"
      :class="['input input-sm join-item w-full', { 'pr-6': clearable }]"
      :placeholder="placeholder || ''"
      :name="name || ''"
      :autocomplete="autocomplete || ''"
      @click="handlerSearchInputClick"
      @input="(emits('input', inputValue || ''), hideTip())"
      @change="emits('change', inputValue || '')"
    />
    <XMarkIcon
      v-if="!beforeClose && clearable"
      class="absolute top-2 right-2 z-10 h-4 w-3 cursor-pointer hover:scale-125"
      @click="clearInput"
    />
  </div>
</template>

<script lang="ts" setup>
import { useTooltip } from '@/helper/tooltip'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const emits = defineEmits<{
  (e: 'input', value: string): void
  (e: 'change', value: string): void
}>()

const props = defineProps<{
  placeholder?: string
  beforeClose?: boolean
  name?: string
  autocomplete?: string
  clearable?: boolean
  menus?: string[]
}>()

const inputValue = defineModel<string>()
const clearInput = () => {
  inputValue.value = ''
}

const { showTip, hideTip } = useTooltip()

const handlerSearchInputClick = (e: Event) => {
  if (!props.menus?.length) {
    return
  }
  const menus = document.createElement('div')

  for (const item of props.menus) {
    const itemDiv = document.createElement('div')

    itemDiv.className = 'cursor-pointer p-1 transition-transform hover:scale-105 hover:text-primary'

    itemDiv.textContent = item
    itemDiv.addEventListener('click', () => {
      inputValue.value = item
      hideTip()
    })
    menus.appendChild(itemDiv)
  }

  showTip(e, menus, {
    theme: 'base',
    placement: 'bottom-start',
    trigger: 'click',
    interactive: true,
    arrow: false,
  })
}
</script>
