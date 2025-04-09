<template>
  <div class="flex items-center gap-2">
    {{ $t('customIcon') }}
    <template v-if="iconReflectList.length"> ({{ iconReflectList.length }}) </template>
    <button
      v-if="iconReflectList.length"
      class="btn btn-sm btn-circle"
      @click="dialogVisible = !dialogVisible"
    >
      <ChevronUpIcon
        v-if="dialogVisible"
        class="h-4 w-4"
      />
      <ChevronDownIcon
        v-else
        class="h-4 w-4"
      />
    </button>
  </div>
  <div class="flex flex-col gap-2">
    <template v-if="dialogVisible">
      <div
        v-for="iconReflect in iconReflectList"
        :key="iconReflect.uuid"
        class="flex items-center gap-2"
      >
        <TextInput
          class="w-32"
          v-model="iconReflect.name"
          placeholder="Name"
        />
        <ArrowRightCircleIcon class="h-4 w-4 shrink-0" />
        <TextInput
          v-model="iconReflect.icon"
          placeholder="Icon URL"
        />
        <button
          class="btn btn-sm btn-circle"
          @click="removeIconReflect(iconReflect.uuid)"
        >
          <TrashIcon class="h-4 w-4 shrink-0" />
        </button>
      </div>
    </template>
    <div class="flex items-center gap-2">
      <TextInput
        class="w-32"
        v-model="newIconReflect.name"
        placeholder="Name"
        :menus="
          proxyGroupList.filter((group) => !iconReflectList.some((item) => item.name === group))
        "
      />
      <ArrowRightCircleIcon class="h-4 w-4 shrink-0" />
      <TextInput
        v-model="newIconReflect.icon"
        placeholder="Icon URL"
      />
      <button
        class="btn btn-sm btn-circle"
        @click="addIconReflect"
      >
        <PlusIcon class="h-4 w-4 shrink-0" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { proxyGroupList } from '@/store/proxies'
import { iconReflectList } from '@/store/settings'
import {
  ArrowRightCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { v4 as uuid } from 'uuid'
import { reactive, ref } from 'vue'
import TextInput from '../common/TextInput.vue'

const dialogVisible = ref(false)
const newIconReflect = reactive({
  name: '',
  icon: '',
})

const addIconReflect = () => {
  if (!newIconReflect.name || !newIconReflect.icon) return
  dialogVisible.value = true
  iconReflectList.value.push({ ...newIconReflect, uuid: uuid() })
  newIconReflect.name = ''
  newIconReflect.icon = ''
}

const removeIconReflect = (uuid: string) => {
  const index = iconReflectList.value.findIndex((item) => item.uuid === uuid)
  iconReflectList.value.splice(index, 1)
}
</script>
