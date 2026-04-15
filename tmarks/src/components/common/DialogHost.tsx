import { useDialogStore } from '@/stores/dialogStore'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AlertDialog } from '@/components/common/AlertDialog'

export function DialogHost() {
  const confirmDialog = useDialogStore((s) => s.confirmDialog)
  const alertDialog = useDialogStore((s) => s.alertDialog)
  const closeConfirm = useDialogStore((s) => s.closeConfirm)
  const closeAlert = useDialogStore((s) => s.closeAlert)

  return (
    <>
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onConfirm={() => closeConfirm(true)}
          onCancel={() => closeConfirm(false)}
        />
      )}

      {alertDialog && (
        <AlertDialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
          confirmText={alertDialog.confirmText}
          onConfirm={closeAlert}
        />
      )}
    </>
  )
}
