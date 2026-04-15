import {
  ExternalLink,
  Edit2,
  Share2,
  Copy,
  FolderPlus as FolderPlusIcon,
  Trash2,
  Move,
  Lock,
  Pin
} from 'lucide-react'
import type { MenuItem } from '@/components/common/DropdownMenu'
import type { TabGroup } from '@/lib/types'
import type { TabGroupMenuActions } from '@/hooks/useTabGroupMenu'
import type { TFunction } from 'i18next'

interface TreeNodeMenuConfig {
  group: TabGroup
  isFolder: boolean
  isLocked: boolean
  menuActions: TabGroupMenuActions
  t: TFunction<'tabGroups', undefined>
}

/**
 * Build context menu items for tree node
 */
export function buildTreeNodeMenu({
  group,
  isFolder,
  isLocked,
  menuActions,
  t
}: TreeNodeMenuConfig): MenuItem[] {
  return [
    {
      label: t('menu.openInNewWindow'),
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => menuActions.onOpenInNewWindow(group),
      disabled: isFolder
    },
    {
      label: t('menu.openInCurrentWindow'),
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => menuActions.onOpenInCurrentWindow(group),
      disabled: isFolder
    },
    {
      label: t('menu.rename'),
      icon: <Edit2 className="w-4 h-4" />,
      onClick: () => menuActions.onRename(group),
      disabled: isLocked,
      divider: true
    },
    {
      label: t('menu.shareAsPage'),
      icon: <Share2 className="w-4 h-4" />,
      onClick: () => menuActions.onShare(group),
      disabled: isFolder
    },
    {
      label: t('menu.copyToClipboard'),
      icon: <Copy className="w-4 h-4" />,
      onClick: () => menuActions.onCopyToClipboard(group)
    },
    {
      label: t('menu.createFolderAbove'),
      icon: <FolderPlusIcon className="w-4 h-4" />,
      onClick: () => menuActions.onCreateFolderAbove(group),
      divider: true
    },
    {
      label: t('menu.createFolderInside'),
      icon: <FolderPlusIcon className="w-4 h-4" />,
      onClick: () => menuActions.onCreateFolderInside(group),
      disabled: !isFolder
    },
    {
      label: t('menu.createFolderBelow'),
      icon: <FolderPlusIcon className="w-4 h-4" />,
      onClick: () => menuActions.onCreateFolderBelow(group)
    },
    {
      label: t('menu.removeDuplicates'),
      icon: <Copy className="w-4 h-4" />,
      onClick: () => menuActions.onRemoveDuplicates(group),
      disabled: isFolder,
      divider: true
    },
    {
      label: t('menu.move'),
      icon: <Move className="w-4 h-4" />,
      onClick: () => menuActions.onMove(group),
      disabled: isLocked
    },
    {
      label: t('menu.pinToTop'),
      icon: <Pin className="w-4 h-4" />,
      onClick: () => menuActions.onPinToTop(group)
    },
    {
      label: isLocked ? t('menu.unlock') : t('menu.lock'),
      icon: <Lock className="w-4 h-4" />,
      onClick: () => menuActions.onLock(group)
    },
    {
      label: t('menu.moveToTrash'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => menuActions.onMoveToTrash(group),
      disabled: isLocked,
      danger: true,
      divider: true
    }
  ]
}
