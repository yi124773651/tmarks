/**
 * Tab Collection View Component
 * Displays current window tabs and allows user to select which tabs to collect
 */

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { SuccessMessage } from '@/components/SuccessMessage';
import { getCurrentWindowTabs, collectCurrentWindowTabs, closeTabs } from '@/lib/services/tab-collection';
import type { BookmarkSiteConfig } from '@/types';

interface TabCollectionViewProps {
  config: BookmarkSiteConfig;
  onBack: () => void;
}

interface TabInfo {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

export function TabCollectionView({ config, onBack }: TabCollectionViewProps) {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [selectedTabIds, setSelectedTabIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [collectedTabIds, setCollectedTabIds] = useState<number[]>([]);

  useEffect(() => {
    loadTabs();
  }, []);

  const loadTabs = async () => {
    try {
      setIsLoading(true);
      const allTabs = await getCurrentWindowTabs();

      // Filter out chrome:// and extension pages
      const validTabs = allTabs
        .filter((tab) => tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'))
        .map((tab) => ({
          id: tab.id!,
          title: tab.title || 'Untitled',
          url: tab.url!,
          favIconUrl: tab.favIconUrl,
        }));

      setTabs(validTabs);

      // Select all by default
      setSelectedTabIds(new Set(validTabs.map((tab) => tab.id)));
    } catch (err) {
      console.error('Failed to load tabs:', err);
      setError('加载标签页失败');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTab = (tabId: number) => {
    const newSelected = new Set(selectedTabIds);
    if (newSelected.has(tabId)) {
      newSelected.delete(tabId);
    } else {
      newSelected.add(tabId);
    }
    setSelectedTabIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedTabIds.size === tabs.length) {
      setSelectedTabIds(new Set());
    } else {
      setSelectedTabIds(new Set(tabs.map((tab) => tab.id)));
    }
  };

  const handleCollect = async () => {
    if (selectedTabIds.size === 0) {
      setError('请至少选择一个标签页');
      return;
    }

    setIsCollecting(true);
    setError(null);

    try {
      // Collect tabs
      const result = await collectCurrentWindowTabs(config);

      if (result.success) {
        setSuccessMessage(result.message || '收纳成功');
        setCollectedTabIds(Array.from(selectedTabIds));
        setShowCloseConfirm(true);
      } else {
        setError(result.error || '收纳失败');
      }
    } catch (err) {
      console.error('Failed to collect tabs:', err);
      setError(err instanceof Error ? err.message : '收纳失败');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleCloseTabs = async () => {
    try {
      await closeTabs(collectedTabIds);
      window.close();
    } catch (err) {
      console.error('Failed to close tabs:', err);
      setError('关闭标签页失败');
    }
  };

  const handleKeepTabs = () => {
    setShowCloseConfirm(false);
    setCollectedTabIds([]);
    // Optionally close the popup
    window.close();
  };

  return (
    <div className="relative h-[80vh] min-h-[620px] w-[380px] overflow-hidden rounded-2xl bg-slate-950 text-slate-100 shadow-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(20,184,166,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl" />

      <div className="relative flex h-full flex-col">
        {/* Error/Success Messages */}
        <div className="pointer-events-none absolute top-4 left-0 right-0 z-30 px-4 space-y-2">
          {error && (
            <div className="pointer-events-auto">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}
          {successMessage && (
            <div className="pointer-events-auto">
              <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage(null)} />
            </div>
          )}
        </div>

        {/* Header - Fixed */}
        <header className="relative flex-shrink-0 px-3 pt-2.5 pb-2">
          <div className="absolute inset-0 rounded-b-3xl bg-gradient-to-br from-emerald-600/90 via-teal-600/85 to-cyan-600/90 shadow-[0_25px_55px_rgba(16,185,129,0.35)]" />
          <div className="relative flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition-all duration-200 hover:bg-white/15 active:scale-95"
              title="返回"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xl shadow-lg shadow-emerald-500/40">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[10px] font-semibold leading-none tracking-[0.28em] text-white">收纳标签页</p>
              </div>
            </div>
          </div>

          <div className="relative mt-2 flex flex-nowrap items-center gap-1.5 text-[9.5px] text-white/70">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-white/85">
              共 {tabs.length} 个
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-0.5 text-white/80">
              已选 {selectedTabIds.size} 个
            </span>
            <div className="ml-auto flex gap-1.5">
              <button
                onClick={onBack}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/75 transition-all duration-200 hover:bg-white/20 active:scale-95"
              >
                取消
              </button>
              <button
                onClick={handleCollect}
                disabled={isCollecting || selectedTabIds.size === 0}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
              >
                {isCollecting ? (
                  <span className="flex items-center justify-center gap-1">
                    <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    收纳中
                  </span>
                ) : (
                  '收纳选中的'
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative flex-1 space-y-3 overflow-y-auto px-4 pb-5 pt-4">
          {showCloseConfirm && (
            <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/20 p-4 shadow-lg shadow-emerald-900/30 backdrop-blur-xl">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/30">
                  <svg className="h-5 w-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">收纳成功</h3>
                  <p className="mt-1 text-xs text-white/70">
                    已成功收纳 {collectedTabIds.length} 个标签页。是否关闭这些标签页？
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleKeepTabs}
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
                >
                  保留标签页
                </button>
                <button
                  onClick={handleCloseTabs}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-95"
                >
                  关闭标签页
                </button>
              </div>
            </section>
          )}

          {isLoading ? (
            <section className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-inner shadow-emerald-500/10 backdrop-blur-xl">
              <LoadingSpinner />
              <p>正在加载标签页...</p>
            </section>
          ) : (
            <>
              {/* Select All Button */}
              <section className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
                <button
                  onClick={toggleAll}
                  className="flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
                >
                  <span>{selectedTabIds.size === tabs.length ? '取消全选' : '全选'}</span>
                  <span className="text-xs text-white/60">
                    {selectedTabIds.size} / {tabs.length}
                  </span>
                </button>
              </section>

              {/* Tab List */}
              <section className="space-y-2">
                {tabs.map((tab) => {
                  const isSelected = selectedTabIds.has(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => toggleTab(tab.id)}
                      className={`group w-full rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.98] ${
                        isSelected
                          ? 'border-emerald-400/40 bg-emerald-500/20 shadow-lg shadow-emerald-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500'
                            : 'border-white/30 bg-white/10'
                        }`}>
                          {isSelected && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {tab.favIconUrl && (
                          <img src={tab.favIconUrl} alt="" className="h-5 w-5 rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-white">{tab.title}</p>
                          <p className="truncate text-xs text-white/60">{tab.url}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

