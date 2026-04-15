import { create } from 'zustand'

export type DialogType = 'info' | 'warning' | 'error' | 'success'

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  type: DialogType
  confirmText?: string
  cancelText?: string
  resolve?: (result: boolean) => void
}

interface AlertDialogState {
  isOpen: boolean
  title: string
  message: string
  type: DialogType
  confirmText?: string
  resolve?: () => void
}

interface DialogState {
  confirmDialog: ConfirmDialogState | null
  alertDialog: AlertDialogState | null

  confirm: (params: {
    title?: string
    message: string
    type?: DialogType
    confirmText?: string
    cancelText?: string
  }) => Promise<boolean>

  alert: (params: {
    title?: string
    message: string
    type?: DialogType
    confirmText?: string
  }) => Promise<void>

  closeConfirm: (result: boolean) => void
  closeAlert: () => void

  info: (message: string, title?: string) => Promise<void>
  warning: (message: string, title?: string) => Promise<void>
  error: (message: string, title?: string) => Promise<void>
  success: (message: string, title?: string) => Promise<void>
}

export const useDialogStore = create<DialogState>((set, get) => ({
  confirmDialog: null,
  alertDialog: null,

  confirm: async ({
    title,
    message,
    type = 'warning',
    confirmText,
    cancelText,
  }) => {
    const existing = get().confirmDialog
    if (existing?.isOpen) {
      existing.resolve?.(false)
    }

    return await new Promise<boolean>((resolve) => {
      set({
        confirmDialog: {
          isOpen: true,
          title: title || '',
          message,
          type,
          confirmText,
          cancelText,
          resolve,
        },
      })
    })
  },

  alert: async ({ title, message, type = 'info', confirmText }) => {
    const existing = get().alertDialog
    if (existing?.isOpen) {
      existing.resolve?.()
    }

    return await new Promise<void>((resolve) => {
      set({
        alertDialog: {
          isOpen: true,
          title: title || '',
          message,
          type,
          confirmText,
          resolve,
        },
      })
    })
  },

  closeConfirm: (result) => {
    const current = get().confirmDialog
    current?.resolve?.(result)
    set({ confirmDialog: null })
  },

  closeAlert: () => {
    const current = get().alertDialog
    current?.resolve?.()
    set({ alertDialog: null })
  },

  info: async (message, title) => {
    return await get().alert({ title, message, type: 'info' })
  },

  warning: async (message, title) => {
    return await get().alert({ title, message, type: 'warning' })
  },

  error: async (message, title) => {
    return await get().alert({ title, message, type: 'error' })
  },

  success: async (message, title) => {
    return await get().alert({ title, message, type: 'success' })
  },
}))
