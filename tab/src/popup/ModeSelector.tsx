/**
 * Mode Selector Component
 * Allows user to choose between Bookmark mode and Tab Collection mode
 */

interface ModeSelectorProps {
  onSelectBookmark: () => void;
  onSelectTabCollection: () => void;
  onOpenOptions: () => void;
}

export function ModeSelector({ onSelectBookmark, onSelectTabCollection, onOpenOptions }: ModeSelectorProps) {
  return (
    <div className="relative h-[80vh] min-h-[580px] w-[380px] overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),transparent_70%)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(165,180,252,0.25),transparent_65%)] opacity-80" />
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl" />

      <div className="relative flex h-full flex-col">
        {/* Main Content */}
        <main className="flex-1 space-y-3 overflow-y-auto px-5 pt-5 pb-4">
          {/* Bookmark Mode */}
          <button
            onClick={onSelectBookmark}
            className="group w-full rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-purple-500/15 p-4 text-left shadow-lg shadow-blue-900/20 backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:border-blue-400/30 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/40 transition-transform duration-200 group-hover:scale-110">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-white">保存书签</h2>
                <p className="mt-0.5 text-xs text-white/70">
                  为当前页面生成 AI 标签并保存到书签库
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-white/60">
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5">AI 推荐</span>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5">智能标签</span>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5">云端同步</span>
                </div>
              </div>
              <svg className="h-5 w-5 text-white/40 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Tab Collection Mode */}
          <button
            onClick={onSelectTabCollection}
            className="group w-full rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 p-4 text-left shadow-lg shadow-emerald-900/20 backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/40 transition-transform duration-200 group-hover:scale-110">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-white">收纳标签页</h2>
                <p className="mt-0.5 text-xs text-white/70">
                  一键收纳当前窗口所有标签页，释放内存
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-white/60">
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5">批量收纳</span>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5">一键恢复</span>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5">节省内存</span>
                </div>
              </div>
              <svg className="h-5 w-5 text-white/40 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Tips */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-3.5 shadow-inner shadow-indigo-500/10 backdrop-blur-xl">
            <h3 className="text-xs font-semibold text-white">💡 小贴士</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[10px] leading-relaxed text-white/70">
              <li>保存书签：适合收藏重要网页，支持 AI 智能标签</li>
              <li>收纳标签页：适合临时保存大量标签页，类似 OneTab</li>
              <li>两种模式的数据都会同步到云端书签服务</li>
            </ul>
          </section>
        </main>

        {/* Footer */}
        <footer className="px-5 pb-4">
          <button
            onClick={onOpenOptions}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            打开设置
          </button>
        </footer>
      </div>
    </div>
  );
}

