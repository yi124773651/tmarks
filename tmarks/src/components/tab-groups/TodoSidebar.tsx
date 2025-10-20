import { useState } from 'react'
import type { TabGroup, TabGroupItem } from '@/lib/types'
import { ExternalLink, Trash2, Check, CheckCircle2, Circle, ListTodo, MoreVertical, Edit2, FolderInput, Archive } from 'lucide-react'
import { tabGroupsService } from '@/services/tab-groups'
import { useToastStore } from '@/stores/toastStore'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { DropdownMenu } from '@/components/common/DropdownMenu'

interface TodoSidebarProps {
  tabGroups: TabGroup[]
  onUpdate: () => void
}

export function TodoSidebar({ tabGroups, onUpdate }: TodoSidebarProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const { success, error: showError } = useToastStore()

  // 收集所有TODO项
  const todoItems: Array<{ item: TabGroupItem; groupId: string; groupTitle: string }> = []
  
  tabGroups.forEach((group) => {
    group.items?.forEach((item) => {
      if (item.is_todo) {
        todoItems.push({
          item,
          groupId: group.id,
          groupTitle: group.title,
        })
      }
    })
  })

  // 按创建时间排序（最新的在前）
  const sortedTodos = todoItems.sort((a, b) => 
    new Date(b.item.created_at || 0).getTime() - new Date(a.item.created_at || 0).getTime()
  )

  const handleToggleTodo = async (itemId: string, currentStatus: number) => {
    setProcessingId(itemId)
    try {
      await tabGroupsService.updateTabGroupItem(itemId, {
        is_todo: currentStatus ? 0 : 1,
      })
      success(currentStatus ? '已取消待办' : '已标记为待办')
      onUpdate()
    } catch (err) {
      console.error('Failed to toggle todo:', err)
      showError('操作失败，请重试')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('确定要删除这个标签页吗？')) return

    setProcessingId(itemId)
    try {
      await tabGroupsService.deleteTabGroupItem(itemId)
      success('标签页已删除')
      onUpdate()
    } catch (err) {
      console.error('Failed to delete item:', err)
      showError('删除失败，请重试')
    } finally {
      setProcessingId(null)
    }
  }

  const handleOpenTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleOpenInCurrentTab = (url: string) => {
    window.location.href = url
  }

  const handleOpenInIncognito = (_url: string) => {
    // Note: Opening in incognito mode is not directly supported in web browsers
    // This would need to be implemented via browser extension
    showError('隐身模式打开需要浏览器扩展支持')
  }

  const handleRename = (item: TabGroupItem) => {
    setEditingItemId(item.id)
    setEditingTitle(item.title)
  }

  const handleSaveRename = async (itemId: string) => {
    if (!editingTitle.trim()) {
      showError('标题不能为空')
      return
    }

    setProcessingId(itemId)
    try {
      await tabGroupsService.updateTabGroupItem(itemId, {
        title: editingTitle.trim(),
      })
      success('重命名成功')
      setEditingItemId(null)
      setEditingTitle('')
      onUpdate()
    } catch (err) {
      console.error('Failed to rename item:', err)
      showError('重命名失败，请重试')
    } finally {
      setProcessingId(null)
    }
  }

  const handleMove = (_itemId: string) => {
    // TODO: Implement move to another group functionality
    showError('移动功能即将推出')
  }

  const handleArchive = (_itemId: string) => {
    // TODO: Implement archive functionality
    showError('归档功能即将推出')
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 overflow-y-auto shadow-sm flex flex-col">
      {/* 标题栏 */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold text-white">待办事项</h2>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Circle className="w-3 h-3 text-purple-200" />
            <span className="text-xs text-purple-100">
              {sortedTodos.length} 个待办
            </span>
          </div>
          {sortedTodos.length > 0 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-purple-200" />
              <span className="text-xs text-purple-100">
                待完成
              </span>
            </div>
          )}
        </div>
      </div>

      {/* TODO列表 */}
      <div className="p-4 space-y-3">
        {sortedTodos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-10 h-10 text-purple-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">暂无待办事项</p>
            <p className="text-gray-400 text-xs mt-2">
              在标签页上点击"待办"按钮添加
            </p>
          </div>
        ) : (
          sortedTodos.map(({ item, groupTitle }) => {
            const relativeTime = item.created_at
              ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: zhCN })
              : ''

            return (
              <div
                key={item.id}
                className="group bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-200"
              >
                {/* 标题和操作 */}
                <div className="flex items-start gap-3">
                  {/* 复选框 */}
                  <button
                    onClick={() => handleToggleTodo(item.id, item.is_todo || 0)}
                    disabled={processingId === item.id}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                      processingId === item.id
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-110 hover:border-purple-500'
                    } ${
                      item.is_todo
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100'
                        : 'border-gray-300 hover:bg-purple-50'
                    }`}
                  >
                    {item.is_todo && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </button>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveRename(item.id)
                            } else if (e.key === 'Escape') {
                              setEditingItemId(null)
                              setEditingTitle('')
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(item.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingItemId(null)
                            setEditingTitle('')
                          }}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                        {item.title}
                      </h3>
                    )}

                    {/* 来源标签 */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
                        <Circle className="w-2 h-2 fill-current" />
                        {groupTitle}
                      </span>
                      {relativeTime && (
                        <span className="text-xs text-gray-400">
                          {relativeTime}
                        </span>
                      )}
                    </div>

                    {/* URL */}
                    {item.url && (
                      <div className="flex items-center gap-1 mt-2">
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500 truncate">
                          {new URL(item.url).hostname}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 三个点菜单 */}
                  <DropdownMenu
                    trigger={
                      <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    }
                    items={[
                      {
                        label: '在新窗口中打开',
                        icon: <ExternalLink className="w-4 h-4" />,
                        onClick: () => handleOpenTab(item.url),
                      },
                      {
                        label: '在此窗口中打开',
                        icon: <ExternalLink className="w-4 h-4" />,
                        onClick: () => handleOpenInCurrentTab(item.url),
                      },
                      {
                        label: '在新的隐身窗口中打开',
                        icon: <ExternalLink className="w-4 h-4" />,
                        onClick: () => handleOpenInIncognito(item.url),
                      },
                      {
                        label: '重命名',
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => handleRename(item),
                      },
                      {
                        label: item.is_todo ? '取消任务标记' : '标记为已完成任务',
                        icon: <CheckCircle2 className="w-4 h-4" />,
                        onClick: () => handleToggleTodo(item.id, item.is_todo || 0),
                      },
                      {
                        label: '移动到其他分组',
                        icon: <FolderInput className="w-4 h-4" />,
                        onClick: () => handleMove(item.id),
                      },
                      {
                        label: '标记为已归档',
                        icon: <Archive className="w-4 h-4" />,
                        onClick: () => handleArchive(item.id),
                      },
                      {
                        label: '移至回收站',
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: () => handleDelete(item.id),
                        danger: true,
                      },
                    ]}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

