import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToastStore } from '@/stores/toastStore';
import { BOOKMARKS_QUERY_KEY } from '@/hooks/useBookmarks';

export interface Snapshot {
  id: string;
  version: number;
  file_size: number;
  snapshot_title: string;
  created_at: string;
  view_url: string; // 签名 URL
}

export const SNAPSHOTS_QUERY_KEY = 'snapshots';

export function useSnapshots(bookmarkId: string) {
  const { t } = useTranslation('bookmarks');
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  
  const [pendingDelete, setPendingDelete] = useState<{ snapshotId: string; version: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: snapshots = [], isLoading, refetch } = useQuery({
    queryKey: [SNAPSHOTS_QUERY_KEY, bookmarkId],
    queryFn: async () => {
      const response = await apiClient.get<{ snapshots: Snapshot[]; total: number }>(
        `/bookmarks/${bookmarkId}/snapshots`
      );
      // API 返回格式: { data: { snapshots: [...], total: ... } }
      // 注意：apiClient.get 已经剥离了一层 data，所以这里 response.data 是 API 返回的 payload
      return response.data?.snapshots || [];
    },
    enabled: false, // 只有在打开弹窗时才触发
  });

  const deleteMutation = useMutation({
    mutationFn: (snapshotId: string) => 
      apiClient.delete(`/bookmarks/${bookmarkId}/snapshots/${snapshotId}`),
    onSuccess: (_, snapshotId) => {
      // 乐观更新本地缓存
      queryClient.setQueryData([SNAPSHOTS_QUERY_KEY, bookmarkId], (old: Snapshot[] | undefined) => 
        old ? old.filter(s => s.id !== snapshotId) : []
      );
      
      // 刷新书签列表（更新快照计数）
      queryClient.invalidateQueries({ queryKey: [BOOKMARKS_QUERY_KEY] });
      
      addToast('success', t('snapshot.deleteSuccess'));
    },
    onError: (error) => {
      console.error('Failed to delete snapshot:', error);
      addToast('error', t('snapshot.deleteFailed'));
    },
    onSettled: () => {
      setPendingDelete(null);
    }
  });

  const handleRequestDelete = (snapshotId: string, version: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDelete({ snapshotId, version });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      setShowDeleteConfirm(false);
      return;
    }

    const { snapshotId } = pendingDelete;
    setShowDeleteConfirm(false);
    try {
      await deleteMutation.mutateAsync(snapshotId);
    } catch {
      // error already handled by onError callback
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPendingDelete(null);
  };

  return {
    snapshots,
    isLoading,
    deletingId: deleteMutation.isPending ? pendingDelete?.snapshotId || null : null,
    pendingDelete,
    showDeleteConfirm,
    loadSnapshots: refetch,
    handleRequestDelete,
    handleConfirmDelete,
    cancelDelete,
  };
}
