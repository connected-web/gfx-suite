import { inject, provide, reactive } from 'vue'

export interface ToastState {
  visible: boolean
  message: string
}

export interface ToasterController {
  toast: ToastState
  showToast: (message: string, durationMs?: number) => void
  hideToast: () => void
}

const TOASTER_KEY = Symbol('toaster-controller')

export function createToasterController (): ToasterController {
  const toast = reactive<ToastState>({
    visible: false,
    message: ''
  })

  let hideTimeout: number | undefined

  function hideToast (): void {
    if (hideTimeout !== undefined) {
      window.clearTimeout(hideTimeout)
      hideTimeout = undefined
    }
    toast.visible = false
  }

  function showToast (message: string, durationMs = 2200): void {
    if (hideTimeout !== undefined) {
      window.clearTimeout(hideTimeout)
      hideTimeout = undefined
    }
    toast.message = message
    toast.visible = true
    hideTimeout = window.setTimeout(() => {
      toast.visible = false
      hideTimeout = undefined
    }, durationMs)
  }

  return {
    toast,
    showToast,
    hideToast
  }
}

export function provideToaster (): ToasterController {
  const controller = createToasterController()
  provide(TOASTER_KEY, controller)
  return controller
}

export function useToaster (): ToasterController {
  const controller = inject<ToasterController | undefined>(TOASTER_KEY, undefined)
  if (controller === undefined) {
    throw new Error('Toaster controller was not provided')
  }
  return controller
}
