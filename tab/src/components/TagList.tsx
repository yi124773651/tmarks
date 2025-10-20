import type { TagSuggestion } from '@/types';

interface TagListProps {
  tags: TagSuggestion[];
  selectedTags: string[];
  onToggle: (tagName: string) => void;
}

export function TagList({ tags, selectedTags, onToggle }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag.name);
        const isNew = tag.isNew;

        const baseClasses = 'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95';

        const stateClasses = (() => {
          if (isSelected) {
            return isNew
              ? 'border border-amber-300/50 bg-amber-400/25 text-amber-100 shadow-inner shadow-amber-500/20'
              : 'border border-emerald-300/40 bg-emerald-400/25 text-emerald-100 shadow-inner shadow-emerald-500/20';
          }

          return isNew
            ? 'border border-blue-300/50 bg-blue-500/15 text-blue-100 hover:bg-blue-500/20'
            : 'border border-white/10 bg-white/8 text-white/70 hover:bg-white/15';
        })();

        return (
          <button
            key={tag.name}
            onClick={() => onToggle(tag.name)}
            className={`${baseClasses} ${stateClasses}`}
          >
            <span className="truncate max-w-[110px]">{tag.name}</span>
            {isNew && (
              <span className={`ml-1 text-[10px] uppercase tracking-wide ${isSelected ? 'text-amber-100/90' : 'text-blue-100/90'}`}>
                new
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
