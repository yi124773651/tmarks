import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { TagList } from '@/components/TagList';
import { PageInfoCard } from '@/components/PageInfoCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { SuccessMessage } from '@/components/SuccessMessage';
import { ModeSelector } from './ModeSelector';
import { TabCollectionView } from './TabCollectionView';

type ViewMode = 'selector' | 'bookmark' | 'tabCollection';

export function Popup() {
  const {
    currentPage,
    recommendedTags,
    existingTags,
    selectedTags,
    isLoading,
    isSaving,
    isRecommending,
    error,
    successMessage,
    config,
    loadConfig,
    loadExistingTags,
    extractPageInfo,
    recommendTags,
    saveBookmark,
    setError,
    toggleTag,
    addCustomTag,
    setCurrentPage,
    includeThumbnail,
    setIncludeThumbnail,
    isPublic,
    setIsPublic,
    lastRecommendationSource,
    lastSaveDurationMs
  } = useAppStore();

  const [customTagInput, setCustomTagInput] = useState('');
  const [titleOverride, setTitleOverride] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('selector');

  useEffect(() => {
    setTitleOverride(currentPage?.title ?? '');
  }, [currentPage?.title]);

  // Load config and existing tags first
  useEffect(() => {
    loadConfig();
    loadExistingTags();
  }, []);

  // Check if configured
  const isConfigured = Boolean(
    config &&
    config.aiConfig.apiKeys[config.aiConfig.provider] &&
    config.bookmarkSite.apiKey
  );

  // Initialize after config is loaded (only for bookmark mode)
  useEffect(() => {
    if (!config || initialized || viewMode !== 'bookmark') return;

    const init = async () => {
      if (!isConfigured) {
        setInitialized(true);
        return;
      }

      try {
        // Extract page info
        await extractPageInfo();

        // Get AI recommendations
        await recommendTags();

        setInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setInitialized(true);
      }
    };

    init();
  }, [config, viewMode]);

  const handleSave = async () => {
    if (selectedTags.length === 0) {
      setError('请至少选择一个标签');
      return;
    }

    await saveBookmark();
  };

  const handleAddCustomTag = () => {
    const tagName = customTagInput.trim();
    if (tagName) {
      addCustomTag(tagName);
      setCustomTagInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCustomTag();
    }
  };

  const handleApplyTitleOverride = () => {
    const trimmed = titleOverride.trim();
    if (!trimmed || !currentPage) {
      return;
    }
    setCurrentPage({ ...currentPage, title: trimmed });
    setTitleOverride(trimmed);
  };

  const handleToggleThumbnail = () => {
    if (!currentPage?.thumbnail) {
      setIncludeThumbnail(false);
      return;
    }

    setIncludeThumbnail(!includeThumbnail);
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleSelectBookmark = () => {
    setViewMode('bookmark');
    setInitialized(false); // Reset to trigger initialization
  };

  const handleSelectTabCollection = () => {
    setViewMode('tabCollection');
  };

  const handleBackToSelector = () => {
    setViewMode('selector');
  };

  // Show mode selector first
  if (viewMode === 'selector') {
    return (
      <ModeSelector
        onSelectBookmark={handleSelectBookmark}
        onSelectTabCollection={handleSelectTabCollection}
        onOpenOptions={openOptions}
      />
    );
  }

  // Show tab collection view
  if (viewMode === 'tabCollection') {
    if (!config) {
      return <div>Loading...</div>;
    }
    return (
      <TabCollectionView
        config={config.bookmarkSite}
        onBack={handleBackToSelector}
      />
    );
  }

  // Show configuration prompt if not configured (bookmark mode)
  if (initialized && !isConfigured) {
    return (
      <div className="relative h-[80vh] min-h-[580px] w-[380px] overflow-hidden rounded-2xl bg-slate-950 text-slate-100 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),transparent_70%)] opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(165,180,252,0.25),transparent_65%)] opacity-80" />
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl" />
        <div className="relative flex h-full flex-col">
          <header className="px-6 pt-8 pb-6">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl shadow-blue-900/20 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/40">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Onboarding</p>
                  <h1 className="text-2xl font-semibold text-white">欢迎使用 AI 书签助手</h1>
                  <p className="text-sm text-white/70">完成基础配置，即可为任意网页生成智能标签与分类建议。</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-5 overflow-y-auto px-6 pb-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-indigo-500/10 backdrop-blur-xl">
              <h2 className="text-sm font-semibold text-white">必备信息</h2>
              <p className="mt-1 text-xs text-white/60">准备以下三项配置，助手即可立即开始工作：</p>
              <ol className="mt-4 space-y-3 text-xs text-white/75">
                <li className="flex gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-blue-500/30 text-[11px] font-semibold text-blue-100">1</span>
                  <div>
                    <p className="font-semibold text-white">AI 服务 API Key</p>
                    <p className="mt-1 text-[11px] text-white/60">用于生成智能标签的模型凭证，支持多个主流服务商。</p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-blue-500/30 text-[11px] font-semibold text-blue-100">2</span>
                  <div>
                    <p className="font-semibold text-white">书签站点 API 地址</p>
                    <p className="mt-1 text-[11px] text-white/60">指向你的书签服务端点，默认为 TMarks 官方地址。</p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-blue-500/30 text-[11px] font-semibold text-blue-100">3</span>
                  <div>
                    <p className="font-semibold text-white">书签站点 API Key</p>
                    <p className="mt-1 text-[11px] text-white/60">用于同步与保存书签数据，请在服务端控制台生成密钥。</p>
                  </div>
                </li>
              </ol>
            </section>

            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-5 shadow-lg shadow-blue-900/20 backdrop-blur-xl">
              <h2 className="text-sm font-semibold text-white">小贴士</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[11px] text-white/70">
                <li>可在设置页保存多个 API 与模型组合，一键切换场景。</li>
                <li>支持自定义 Prompt，满足不同标签风格或语言需求。</li>
                <li>配置完成后，助手会自动抓取当前标签页并生成推荐。</li>
              </ul>
            </section>
          </main>

          <footer className="px-6 pb-6">
            <button
              onClick={openOptions}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              前往设置
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[80vh] min-h-[620px] w-[380px] overflow-hidden rounded-2xl bg-slate-950 text-slate-100 shadow-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl" />

      <div className="relative flex h-full flex-col">
        <div className="pointer-events-none absolute top-4 left-0 right-0 z-30 px-4 space-y-2">
          {error && (
            <div className="pointer-events-auto">
              <ErrorMessage
                message={error}
                onDismiss={() => setError(null)}
                onRetry={!isLoading && lastRecommendationSource === 'fallback' ? recommendTags : undefined}
              />
            </div>
          )}
          {successMessage && (
            <div className="pointer-events-auto">
              <SuccessMessage message={successMessage} />
            </div>
          )}
        </div>

        <header className="relative px-3 pt-2.5 pb-2">
          <div className="absolute inset-0 rounded-b-3xl bg-gradient-to-br from-blue-600/90 via-indigo-600/85 to-purple-600/90 shadow-[0_25px_55px_rgba(79,70,229,0.35)]" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleBackToSelector}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition-all duration-200 hover:bg-white/15 active:scale-95"
                title="返回"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xl shadow-lg shadow-indigo-500/40">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[10px] font-semibold leading-none tracking-[0.28em] text-white">AI 标签助手</p>
              </div>
            </div>
            <button
              onClick={openOptions}
              className="relative flex h-7 w-7 items-center justify-center rounded-lg text-white transition-all duration-200 hover:bg-white/15 active:scale-95"
              title="打开设置"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <div className="relative mt-2 flex flex-nowrap items-center gap-1.5 text-[9.5px] text-white/70">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-white/85">
              推荐 {recommendedTags.length}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-0.5 text-white/80">
              已选择 {selectedTags.length}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-white/75">
              标签库 {existingTags.length}
            </span>
            <div className="ml-auto flex gap-1.5">
              <button
                onClick={() => window.close()}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/75 transition-all duration-200 hover:bg-white/20 active:scale-95"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || selectedTags.length === 0}
                className="rounded-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-4 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-1">
                    <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    保存中
                  </span>
                ) : (
                  '保存书签'
                )}
              </button>
            </div>
          </div>

        </header>

        <main className="relative flex-1 space-y-3 overflow-y-auto px-4 pb-5 pt-4">
          {isRecommending && (
            <section className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-inner shadow-indigo-500/10 backdrop-blur-xl">
              <LoadingSpinner />
              <p>AI 正在分析当前页面，请稍候...</p>
            </section>
          )}

          {selectedTags.length > 0 && (
            <section className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 shadow-lg shadow-blue-900/20 backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">已选择标签</p>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white/80">
                  {selectedTags.length}
                </span>
              </div>
              <p className="mb-2 text-[11px] text-white/60">点击标签可取消选择。</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    title="点击移除标签"
                className="inline-flex items-center rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm shadow-blue-500/20 transition-all duration-200 hover:bg-white/80 active:scale-95"
                  >
                    <span className="truncate max-w-[120px]">{tag}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {currentPage && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-indigo-500/10 backdrop-blur-xl">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white">可见性</p>
                  <p className="text-[10px] text-white/60">选择保存后的访问权限</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-0.5 text-xs text-white shadow-inner shadow-white/10">
                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      aria-pressed={!isPublic}
                      className={`rounded-lg px-3 py-1 font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60 ${
                        !isPublic
                          ? 'bg-slate-900/80 text-white shadow-lg shadow-slate-900/40'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      隐私
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      aria-pressed={isPublic}
                      className={`rounded-lg px-3 py-1 font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60 ${
                        isPublic
                          ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-700/40'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      公开
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleThumbnail}
                    disabled={!currentPage.thumbnail}
                    className={`rounded-lg border px-3 py-1 text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60 ${
                      includeThumbnail
                        ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                        : 'border-amber-400/60 bg-amber-500/20 text-amber-100 shadow-inner shadow-amber-500/20'
                    } ${!currentPage.thumbnail ? 'cursor-not-allowed opacity-40' : ''}`}
                  >
                    {includeThumbnail ? '忽略封面图' : '恢复封面图'}
                  </button>
                </div>
              </div>
              <div className="mb-3 space-y-2">
                <p className="text-xs font-medium text-white/80">快速覆写标题</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={titleOverride}
                    onChange={(e) => setTitleOverride(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyTitleOverride();
                      }
                    }}
                    placeholder="输入自定义标题后回车或点击应用"
                    className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-300/60 backdrop-blur"
                  />
                  <button
                    onClick={handleApplyTitleOverride}
                    disabled={!titleOverride.trim() || !currentPage}
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                  >
                    应用
                  </button>
                </div>
              </div>
              <PageInfoCard
                title={currentPage.title}
                url={currentPage.url}
                description={currentPage.description}
                thumbnail={includeThumbnail ? currentPage.thumbnail : undefined}
              />
            </section>
          )}

          {recommendedTags.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-blue-900/15 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                    AI 推荐
                  </h2>
                  <p className="mt-1 text-xs text-blue-100/80">根据页面内容实时生成，点击可快速选择。</p>
                </div>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white/80">
                  {recommendedTags.length}
                </span>
              </div>
              <TagList tags={recommendedTags} selectedTags={selectedTags} onToggle={toggleTag} />
            </section>
          )}

          {existingTags.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-900/30 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <svg className="h-4 w-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    标签库
                  </h2>
                  <p className="mt-1 text-xs text-white/60">与你的历史标签数据同步，点选即可加入。</p>
                </div>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white/70">
                  {existingTags.length}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <div className="flex flex-wrap gap-1.5">
                  {existingTags
                    .sort((a, b) => b.count - a.count)
                    .map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.name)}
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ${
                            isSelected
                              ? 'border border-emerald-300/40 bg-emerald-400/25 text-emerald-100 shadow-inner shadow-emerald-500/20'
                              : 'border border-white/10 bg-white/8 text-white/70 hover:bg-white/15'
                          }`}
                        >
                          <span
                            className="mr-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: tag.color || '#34d399' }}
                          />
                          <span className="truncate max-w-[110px]">{tag.name}</span>
                          {tag.count > 0 && (
                            <span className="ml-1 text-[10px] opacity-60">({tag.count})</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-blue-500/15 p-4 shadow-lg shadow-purple-900/20 backdrop-blur-xl">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <svg className="h-4 w-4 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              自定义标签
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入标签名并回车添加"
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-300/50 backdrop-blur-lg"
              />
              <button
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
              >
                添加
              </button>
            </div>
          </section>

          {lastSaveDurationMs !== null && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70 shadow-inner shadow-white/10 backdrop-blur-xl">
              最近一次保存耗时 {(lastSaveDurationMs / 1000).toFixed(2)}s
            </section>
          )}
        </main>

      </div>
    </div>
  );
}
