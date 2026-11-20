<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, shallowRef, watch } from 'vue'
import {
  DESIGN_SYSTEM_VARIANTS,
  INK_COLORS,
  SHADCN_BASE_COLORS,
  useDesignSystem,
} from '@osmova/quasar-design-system'
import FluentReferenceSection from './FluentReferenceSection.vue'
import {
  COMPARE_PAGES,
  compareFrameUrl,
  compareHash,
  parseCompareSelection,
  type CompareKey,
  type CompareSide,
  type GalleryScheme,
  type GalleryTab,
  type ResolvedCompareSide,
} from '../gallery-url'

const ds = useDesignSystem()
const variants = Object.values(DESIGN_SYSTEM_VARIANTS)
const pages = COMPARE_PAGES
const schemes: { label: string, value: GalleryScheme }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]
const keys: CompareKey[] = ['a', 'b']

// Explicit picks live in the URL; anything unpicked follows the page the visitor is already on.
const selection = reactive(parseCompareSelection(typeof window === 'undefined' ? '' : window.location.hash))

const host = computed(() => ({
  variant: ds.variant.value,
  mode: ds.resolvedMode.value as GalleryScheme,
  ink: ds.inkColor.value,
  palette: ds.shadcnBaseColor.value,
}))

const sides = computed<Record<CompareKey, ResolvedCompareSide>>(() => {
  const a = selection.sides.a
  const b = selection.sides.b
  const variant = a.variant ?? host.value.variant
  return {
    a: { variant, mode: a.mode ?? host.value.mode, ink: a.ink ?? host.value.ink, palette: a.palette ?? host.value.palette },
    // Side B starts on a visibly different system instead of mirroring A.
    b: {
      variant: b.variant ?? (variant === 'glass' ? 'win' : 'glass'),
      mode: b.mode ?? host.value.mode,
      ink: b.ink ?? host.value.ink,
      palette: b.palette ?? host.value.palette,
    },
  }
})

const page = computed<GalleryTab>({
  get: () => selection.page ?? 'components',
  set: (value: GalleryTab) => {
    selection.page = value
    writeUrl()
  },
})

const reference = computed<boolean>({
  get: () => selection.reference,
  set: (value: boolean) => {
    selection.reference = value
    writeUrl()
  },
})

function pick(key: CompareKey, field: keyof CompareSide, value: string | null) {
  // The side selects only ever emit the enumerated values typed by CompareSide.
  ;(selection.sides[key] as Record<string, string | null>)[field] = value
  writeUrl()
}

function variantLabel(key: CompareKey): string {
  const name = sides.value[key].variant
  return variants.find(variant => variant.name === name)?.label ?? name
}

function caption(key: CompareKey): string {
  const side = sides.value[key]
  const detail = side.variant === 'ink' ? side.ink : side.variant === 'shadcn' ? side.palette : ''
  return [variantLabel(key), side.mode, detail].filter(Boolean).join(' · ')
}

function frameSrc(key: CompareKey): string {
  if (typeof window === 'undefined') return 'about:blank'
  return compareFrameUrl(
    { pathname: window.location.pathname, search: window.location.search },
    page.value,
    sides.value[key],
  )
}

// Captured once: the attribute never changes, so a frame cannot add host back/forward entries.
const initialSrc: Record<CompareKey, string> = { a: frameSrc('a'), b: frameSrc('b') }
const frames = shallowRef<Record<CompareKey, HTMLIFrameElement | null>>({ a: null, b: null })

function setFrame(key: CompareKey, element: Element | null) {
  frames.value[key] = element as HTMLIFrameElement | null
}

// Own writes use replaceState and never fire this; back/forward and pasted addresses do.
function onHashChange() {
  Object.assign(selection, parseCompareSelection(window.location.hash))
}

onMounted(() => window.addEventListener('hashchange', onHashChange))
onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange))

// Each frame navigates itself by replacement: a src attribute change would push an entry onto the
// joint session history and take the Back button away from the gallery.
watch(
  () => keys.map(key => frameSrc(key)),
  (urls) => {
    keys.forEach((key, index) => {
      const frame = frames.value[key]
      const url = urls[index]!
      if (!frame) return
      // Mirrored for tooling: the src attribute itself stays on the address the frame loaded with.
      frame.setAttribute('data-qds-frame-url', url)
      if (frame.contentWindow && frame.contentWindow.location.href !== url) {
        frame.contentWindow.location.replace(url)
      }
    })
  },
  { flush: 'post' },
)

// Written only after an explicit pick: loading a link must never rewrite the address bar.
function writeUrl() {
  if (typeof window === 'undefined') return
  const next = compareHash(window.location.hash, {
    page: page.value,
    reference: reference.value,
    sides: { a: sides.value.a, b: sides.value.b },
  })
  if (window.location.hash !== next) {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${next}`)
  }
}
</script>

<template>
  <div class="compare-ab" data-test="qds-compare-ab">
    <p class="compare-ab__intro">
      The same gallery page rendered twice, once per variant. Pick any two of the seven variants, give each side its
      own scheme, and the address bar keeps the exact pair shareable.
    </p>

    <div class="compare-ab__bar">
      <q-select
        v-model="page"
        :options="pages"
        option-value="tab"
        option-label="label"
        emit-value
        map-options
        dense
        outlined
        behavior="menu"
        label="Page"
        aria-label="Compared page"
        class="compare-ab__field"
        data-test="qds-compare-page"
      >
        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps" :data-test="`qds-compare-page-option-${scope.opt.tab}`">
            <q-item-section>
              <q-item-label>{{ scope.opt.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-space />
      <q-checkbox
        v-model="reference"
        dense
        label="Reference: Fluent 2 web components"
        data-test="qds-compare-reference"
      />
    </div>

    <div class="compare-ab__grid">
      <section v-for="key in keys" :key="key" class="compare-ab__side" :data-compare-side="key">
        <header class="compare-ab__head">
          <span class="compare-ab__tag">{{ key.toUpperCase() }}</span>

          <q-select
            :model-value="sides[key].variant"
            :options="variants"
            option-value="name"
            option-label="label"
            emit-value
            map-options
            dense
            outlined
            behavior="menu"
            aria-label="Variant"
            class="compare-ab__field compare-ab__variant"
            :data-test="`qds-compare-variant-${key}`"
            @update:model-value="pick(key, 'variant', $event)"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps" :data-test="`qds-compare-variant-${key}-option-${scope.opt.name}`">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-btn-toggle
            :model-value="sides[key].mode"
            :options="schemes"
            dense
            unelevated
            no-caps
            toggle-size="sm"
            aria-label="Scheme"
            class="compare-ab__scheme"
            :data-test="`qds-compare-scheme-${key}`"
            @update:model-value="pick(key, 'mode', $event)"
          />

          <q-select
            v-if="sides[key].variant === 'ink'"
            :model-value="sides[key].ink"
            :options="INK_COLORS"
            option-value="name"
            option-label="label"
            emit-value
            map-options
            dense
            outlined
            behavior="menu"
            label="Ink colour"
            aria-label="Ink colour"
            class="compare-ab__field"
            :data-test="`qds-compare-ink-${key}`"
            @update:model-value="pick(key, 'ink', $event)"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps" :data-test="`qds-compare-ink-${key}-option-${scope.opt.name}`">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-if="sides[key].variant === 'shadcn'"
            :model-value="sides[key].palette"
            :options="SHADCN_BASE_COLORS"
            option-value="name"
            option-label="label"
            emit-value
            map-options
            dense
            outlined
            behavior="menu"
            label="Base palette"
            aria-label="Base palette"
            class="compare-ab__field"
            :data-test="`qds-compare-palette-${key}`"
            @update:model-value="pick(key, 'palette', $event)"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps" :data-test="`qds-compare-palette-${key}-option-${scope.opt.name}`">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </header>

        <iframe
          class="compare-ab__frame"
          :ref="element => setFrame(key, element as Element | null)"
          :src="initialSrc[key]"
          :title="`Side ${key.toUpperCase()}: ${caption(key)}`"
          :data-test="`qds-compare-frame-${key}`"
          :data-qds-frame-url="initialSrc[key]"
        />
      </section>
    </div>

    <FluentReferenceSection v-if="reference" class="compare-ab__reference" />
  </div>
</template>

<style scoped>
.compare-ab {
  display: flex;
  flex-direction: column;
  gap: var(--qds-space-md);
}

.compare-ab__intro {
  margin: 0;
  max-width: 60rem;
  color: var(--qds-text-muted);
}

.compare-ab__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--qds-space-sm);
}

.compare-ab__field {
  min-width: 8rem;
  max-width: 14rem;
}

.compare-ab__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--qds-space-md);
}

.compare-ab__side {
  display: flex;
  flex-direction: column;
  gap: var(--qds-space-sm);
  min-width: 0;
}

.compare-ab__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--qds-space-xs) var(--qds-space-sm);
}

.compare-ab__tag {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--qds-text-muted);
}

.compare-ab__scheme {
  flex: 0 0 auto;
}

.compare-ab__frame {
  width: 100%;
  height: clamp(420px, 68vh, 940px);
  min-width: 0;
  border: 1px solid var(--qds-border-subtle);
  border-radius: var(--qds-radius-md);
}

.compare-ab__reference {
  border-top: 1px solid var(--qds-border-subtle);
  padding-top: var(--qds-space-md);
}

@media (max-width: 899px) {
  .compare-ab__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .compare-ab__frame {
    height: 60vh;
  }
}
</style>
