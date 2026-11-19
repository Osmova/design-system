import { computed, defineComponent, h, ref, useAttrs, type PropType, type StyleValue } from 'vue'
import { QBtn } from 'quasar'
import { QWindow as NativeQWindow, useQWindowResponsiveProps } from '@quasar/quasar-ui-qwindow'
import type {
  QWindow as NativeQWindowInstance,
  QWindowActionMenuItem,
  QWindowPosition,
  QWindowProps,
  QWindowResponsiveProps,
  QWindowResponsivePropsOptions,
} from '@quasar/quasar-ui-qwindow'
import {
  ppX,
  ppCornersIn,
  ppCornersOut,
  ppArrowsOut,
  ppMinus,
  ppPushPin,
} from 'quasar-extras-svg-icons/phosphor-icons-v2'

type NativeActionItem = QWindowActionMenuItem | 'separator'

export type OdsWindowProps = QWindowProps
export type OdsWindowActionMenuItem = QWindowActionMenuItem
export type OdsWindowPosition = QWindowPosition
export type OdsWindowResponsiveProps = QWindowResponsiveProps
export type OdsWindowResponsivePropsOptions = QWindowResponsivePropsOptions
export type OdsWindowInstance = NativeQWindowInstance

export interface OdsWindowTitlebarSlotScope {
  menuData: QWindowActionMenuItem[]
}

export interface OdsWindowDefaultSlotScope {
  zIndex: number
}

const actionIcons: Record<string, string> = {
  close: ppX,
  embedded: ppCornersIn,
  fullscreen: ppArrowsOut,
  maximize: ppCornersOut,
  minimize: ppMinus,
  pinned: ppPushPin,
}

// @quasar/quasar-ui-qwindow@3.0.0 exposes a `minimized` prop/action/method,
// but its internal action-state guard currently throws for the `minimize` action.
// ODS keeps minimized as a visual/consumer-controlled state and does not forward
// it into the native component until the peer bug is fixed upstream.
const unsupportedNativeActions = new Set(['minimize'])

function callListener(listener: unknown, ...args: unknown[]) {
  if (Array.isArray(listener)) {
    listener.forEach((entry) => callListener(entry, ...args))
    return
  }

  if (typeof listener === 'function') {
    listener(...args)
  }
}

function actionLabel(item: QWindowActionMenuItem) {
  return item.state === true ? item.off.label : item.on.label
}

function actionIcon(item: QWindowActionMenuItem): string | undefined {
  const key = item.key
  // Stateful actions: swap the icon to reflect the resulting state where meaningful.
  if (key === 'embedded') {
    return item.state === true ? ppCornersOut : ppCornersIn
  }
  if (key === 'maximize') {
    return item.state === true ? ppCornersIn : ppCornersOut
  }
  return actionIcons[key]
}

function runAction(item: QWindowActionMenuItem) {
  return item.state === true ? item.off.func() : item.on.func()
}

function stopPointer(evt: Event) {
  evt.stopPropagation()
}

const odsWindowProps = {
  actions: Array as PropType<string[]>,
  ariaLabel: String,
  ariaRole: String as PropType<QWindowProps['ariaRole']>,
  autoPin: Boolean,
  backgroundColor: String,
  borderStyle: String,
  borderWidth: String,
  color: String,
  contentClass: [String, Object, Array] as PropType<unknown>,
  contentStyle: [String, Object, Array] as PropType<StyleValue>,
  dense: Boolean,
  disabled: Boolean,
  embedded: Boolean,
  fullscreen: Boolean,
  gripperBackgroundColor: String,
  gripperBorderColor: String,
  headless: Boolean,
  height: [Number, String] as PropType<number | string>,
  hideGrippers: Boolean,
  hideToolbarDivider: Boolean,
  iconSet: Object as PropType<Record<string, unknown>>,
  maximized: Boolean,
  menuFunc: Function as PropType<(menuData: QWindowActionMenuItem[]) => void>,
  menuIcon: String,
  minimized: Boolean,
  modelValue: Boolean,
  noMenu: Boolean,
  noMove: Boolean,
  noResize: Boolean,
  pinned: Boolean,
  resizable: Array as PropType<string[]>,
  roundGrippers: Boolean,
  scrollWithWindow: Boolean,
  startX: [Number, String] as PropType<number | string>,
  startY: [Number, String] as PropType<number | string>,
  title: String,
  titlebarClass: [String, Object, Array] as PropType<unknown>,
  titlebarStyle: [String, Object, Array] as PropType<StyleValue>,
  width: [Number, String] as PropType<number | string>,
}

export const OdsWindow = defineComponent({
  name: 'OdsWindow',
  inheritAttrs: false,
  props: odsWindowProps,
  setup(props, { slots, expose }) {
    const attrs = useAttrs()
    const windowRef = ref<NativeQWindowInstance | null>(null)
    const selected = ref(false)

    const odsClasses = computed(() => ({
      'ods-window--active': selected.value,
      'ods-window--dense': props.dense,
      'ods-window--disabled': props.disabled,
      'ods-window--embedded': props.embedded,
      'ods-window--floating': props.embedded !== true,
      'ods-window--fullscreen': props.fullscreen,
      'ods-window--headless': props.headless,
      'ods-window--maximized': props.maximized,
      'ods-window--minimized': props.minimized,
      'ods-window--pinned': props.pinned,
    }))

    function exposeBooleanMethod(method: keyof NativeQWindowInstance) {
      const candidate = windowRef.value?.[method]
      return typeof candidate === 'function' ? Boolean(candidate.call(windowRef.value)) : false
    }

    expose({
      show: () => exposeBooleanMethod('show'),
      hide: () => exposeBooleanMethod('hide'),
      embed: () => exposeBooleanMethod('embed'),
      float: () => exposeBooleanMethod('float'),
      toggleEmbedded: () => exposeBooleanMethod('toggleEmbedded'),
      pin: () => exposeBooleanMethod('pin'),
      unpin: () => exposeBooleanMethod('unpin'),
      togglePinned: () => exposeBooleanMethod('togglePinned'),
      maximize: () => exposeBooleanMethod('maximize'),
      restore: () => exposeBooleanMethod('restore'),
      toggleMaximized: () => exposeBooleanMethod('toggleMaximized'),
      enterFullscreen: () => exposeBooleanMethod('enterFullscreen'),
      leaveFullscreen: () => exposeBooleanMethod('leaveFullscreen'),
      toggleFullscreen: () => exposeBooleanMethod('toggleFullscreen'),
      getPosition: () => windowRef.value?.getPosition(),
    })

    function renderAction(item: NativeActionItem) {
      if (item === 'separator') {
        return null
      }

      const label = actionLabel(item)
      const icon = actionIcon(item)

      return h(QBtn, {
        key: item.key,
        'aria-label': label,
        class: ['ods-window__action', `ods-window__action--${item.key}`],
        dense: true,
        flat: true,
        round: true,
        size: props.dense ? 'sm' : 'md',
        title: label,
        icon: icon,
        onClick: (evt: Event) => {
          evt.stopPropagation()
          runAction(item)
        },
        onMousedown: stopPointer,
        onTouchstart: stopPointer,
      })
    }

    function renderFallbackAction(key: string, label: string, handler: () => boolean | undefined) {
      const icon = actionIcons[key]

      return h(QBtn, {
        key: `fallback-${key}`,
        'aria-label': label,
        class: ['ods-window__action', `ods-window__action--${key}`],
        dense: true,
        flat: true,
        round: true,
        size: props.dense ? 'sm' : 'md',
        title: label,
        icon: icon,
        onClick: (evt: Event) => {
          evt.stopPropagation()
          handler()
        },
        onMousedown: stopPointer,
        onTouchstart: stopPointer,
      }, icon ? undefined : () => label.slice(0, 1))
    }

    function renderTitlebar(scope: OdsWindowTitlebarSlotScope) {
      if (slots.titlebar) {
        return slots.titlebar(scope)
      }

      const actions = scope.menuData.map(renderAction).filter(Boolean)
      const hasCloseAction = scope.menuData.some((item) => item.key === 'close')
      if (hasCloseAction !== true && props.actions?.includes('close') === true) {
        actions.push(renderFallbackAction('close', 'Close', () => windowRef.value?.hide()))
      }

      return h('div', { class: 'ods-window__chrome' }, [
        h('div', { class: 'ods-window__title' }, slots.title ? slots.title() : props.title),
        h('div', { class: 'ods-window__actions' }, actions),
      ])
    }

    function renderDefault(scope: OdsWindowDefaultSlotScope) {
      return h('div', { class: 'ods-window__body' }, slots.default?.(scope))
    }

    return () => {
      const {
        class: inheritedClass,
        style: inheritedStyle,
        onSelected,
        ...forwardAttrs
      } = attrs

      const {
        actions,
        minimized: _minimized,
        ...nativeProps
      } = props

      const nativeActions = actions?.filter((action) => unsupportedNativeActions.has(action) !== true)

      return h(NativeQWindow, {
        ...forwardAttrs,
        ...nativeProps,
        ref: windowRef,
        actions: nativeActions,
        backgroundColor: props.backgroundColor ?? 'var(--ods-card-bg)',
        borderStyle: props.borderStyle ?? 'solid',
        borderWidth: props.borderWidth ?? 'var(--ods-border-width-control)',
        color: props.color ?? 'var(--ods-text)',
        contentClass: ['ods-window', odsClasses.value, props.contentClass, inheritedClass],
        contentStyle: [props.contentStyle, inheritedStyle],
        gripperBackgroundColor: props.gripperBackgroundColor ?? 'var(--ods-surface-0)',
        gripperBorderColor: props.gripperBorderColor ?? 'var(--ods-border)',
        titlebarClass: ['ods-window__titlebar', props.titlebarClass],
        onSelected: (value: boolean) => {
          selected.value = value
          callListener(onSelected, value)
        },
      }, {
        default: renderDefault,
        titlebar: renderTitlebar,
      })
    }
  },
})

export { useQWindowResponsiveProps }

export default OdsWindow
