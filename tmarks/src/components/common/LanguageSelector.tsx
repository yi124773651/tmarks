import { useLanguage } from '@/hooks/useLanguage'
import { Globe } from 'lucide-react'

interface LanguageSelectorProps {
  className?: string
  showLabel?: boolean
}

export function LanguageSelector({ className = '', showLabel = true }: LanguageSelectorProps) {
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && <Globe className="w-4 h-4 text-muted-foreground" />}
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value as typeof currentLanguage)}
        className="input py-1.5 px-3 text-sm min-w-[120px]"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  )
}
