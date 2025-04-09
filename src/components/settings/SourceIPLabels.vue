<template>
  <div class="flex items-center gap-2">
    {{ $t('sourceIPLabels') }}
    <template v-if="sourceIPLabelList.length"> ({{ sourceIPLabelList.length }}) </template>
    <button
      v-if="sourceIPLabelList.length"
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
  <div class="flex flex-col gap-2 p-1 pr-0">
    <Draggable
      v-if="dialogVisible"
      class="flex flex-1 flex-col gap-2"
      v-model="sourceIPLabelList"
      group="list"
      :animation="150"
      :handle="'.drag-handle'"
      :item-key="'uuid'"
      @start="disableSwipe = true"
      @end="disableSwipe = false"
    >
      <template #item="{ element: { id, key, label } }">
        <div
          :key="id"
          class="flex items-center gap-2"
        >
          <ChevronUpDownIcon class="drag-handle h-4 w-4 shrink-0 cursor-grab" />
          <TextInput
            class="w-36 max-w-64 flex-1"
            :modelValue="key"
            :menus="sourceList"
            @change="(e) => handlerLabelKeyChange(id, 'key', e)"
          />
          <ArrowRightCircleIcon class="h-4 w-4 shrink-0" />
          <TextInput
            class="w-28 sm:w-40"
            :modelValue="label"
            @change="(e) => handlerLabelKeyChange(id, 'label', e)"
          />
          <button
            class="btn btn-circle btn-ghost btn-sm"
            @click="() => handlerLabelRemove(id)"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </template>
    </Draggable>

    <div class="flex w-full items-center gap-2">
      <TagIcon class="h-4 w-4 shrink-0" />
      <TextInput
        class="w-36 max-w-64 flex-1"
        :menus="sourceList"
        v-model="newLabelForIP.key"
        placeholder="IP | eui64 | /Regex"
      />
      <ArrowRightCircleIcon class="h-4 w-4 shrink-0" />
      <TextInput
        class="w-28 sm:w-40"
        v-model="newLabelForIP.label"
        :placeholder="$t('label')"
        @keypress.enter="handlerLabelAdd"
      />
      <button
        class="btn btn-circle btn-sm"
        @click="handlerLabelAdd"
      >
        <PlusIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { disableSwipe } from '@/composables/swipe'
import { connections } from '@/store/connections'
import { sourceIPLabelList } from '@/store/settings'
import {
  ArrowRightCircleIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { uniq } from 'lodash'
import { v4 as uuid } from 'uuid'
import { computed, reactive, ref } from 'vue'
import Draggable from 'vuedraggable'
import TextInput from '../common/TextInput.vue'

const dialogVisible = ref(false)
const sourceList = computed(() => {
  return uniq(connections.value.map((conn) => conn.metadata.sourceIP))
    .filter(Boolean)
    .filter((ip) => !sourceIPLabelList.value.find((item) => item.key === ip))
    .sort()
})

const newLabelForIP = reactive({
  key: '',
  label: '',
})

const handlerLabelAdd = () => {
  if (!newLabelForIP.key || !newLabelForIP.label) {
    return
  }

  dialogVisible.value = true
  sourceIPLabelList.value.push({
    key: newLabelForIP.key,
    label: newLabelForIP.label,
    id: uuid(),
  })

  newLabelForIP.key = ''
  newLabelForIP.label = ''
}

const handlerLabelRemove = (id: string) => {
  sourceIPLabelList.value.splice(
    sourceIPLabelList.value.findIndex((item) => item.id === id),
    1,
  )
}

const handlerLabelKeyChange = (id: string, path: 'key' | 'label', value: string) => {
  const key = value
  const source = sourceIPLabelList.value.find((item) => item.id === id)

  if (source) {
    source[path] = key
  }
}
</script>
