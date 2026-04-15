/**
 * 浏览器扩展设置标签页
 * 简化版本：下载、安装指南、权限说明
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Download, Info, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { InfoBox } from '../InfoBox'
import { SettingsSection, SettingsDivider } from '../SettingsSection'
import { siGooglechrome, siBrave, siOpera, siQq } from 'simple-icons'

type BrowserType = 'chrome' | 'edge' | 'opera' | 'brave' | '360' | 'qq' | 'sogou'

export function BrowserSettingsTab() {
  const { t } = useTranslation('settings')
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [showFaq, setShowFaq] = useState(false)

  const handleDownload = (_browser: BrowserType) => {
    void _browser
    const link = document.createElement('a')
    link.href = `/extensions/tmarks-extension-chrome.zip`
    link.download = 'tmarks-extension-chrome.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const BrowserIcon = ({ browser, className }: { browser: string; className?: string }) => {
    const baseClass = className || 'w-8 h-8'

    const getIconData = () => {
      switch (browser) {
        case 'chrome': return siGooglechrome
        case 'brave': return siBrave
        case 'opera': return siOpera
        case 'qq': return siQq
        default: return null
      }
    }

    const iconData = getIconData()

    if (!iconData) {
      if (browser === 'edge') {
        return (
          <svg className={`${baseClass} text-[#0078D4]`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.5 12c0-4.7-3.8-8.5-8.5-8.5S3.5 7.3 3.5 12c0 4.1 2.9 7.5 6.8 8.3.5.1 1 .2 1.5.2 4.7 0 8.5-3.8 8.5-8.5h.2zm-8.5 7c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z"/>
          </svg>
        )
      }
      return (
        <div className={`${baseClass} rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground`}>
          {browser.charAt(0).toUpperCase()}
        </div>
      )
    }

    return (
      <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor" style={{ color: `#${iconData.hex}` }}>
        <path d={iconData.path} />
      </svg>
    )
  }

  const browsers = [
    { id: 'chrome', name: 'Chrome' },
    { id: 'edge', name: 'Edge' },
    { id: 'brave', name: 'Brave' },
    { id: 'opera', name: 'Opera' },
    { id: '360', name: '360' },
    { id: 'qq', name: 'QQ' },
    { id: 'sogou', name: 'Sogou' },
  ]

  return (
    <div className="space-y-6">
      {/* 下载扩展 */}
      <SettingsSection icon={Download} title={t('browser.download.title')} description={t('browser.download.description')}>
        <div className="grid grid-cols-4 gap-2">
          {browsers.map((browser) => (
            <button
              key={browser.id}
              onClick={() => handleDownload(browser.id as BrowserType)}
              className="p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all text-center group"
            >
              <div className="mx-auto mb-1 flex justify-center">
                <BrowserIcon browser={browser.id} className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="text-xs font-medium truncate">{browser.name}</div>
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsDivider />

      {/* 权限说明 */}
      <SettingsSection icon={Shield} title={t('browser.permissions.title')} description={t('browser.permissions.description')}>
        <div className="grid sm:grid-cols-3 gap-3">
          {['bookmarks', 'tabs', 'storage'].map((perm) => (
            <div key={perm} className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">{t(`browser.permissions.${perm}.title`)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t(`browser.permissions.${perm}.description`)}</p>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsDivider />

      {/* 安装指南 - 可折叠 */}
      <button
        onClick={() => setShowInstallGuide(!showInstallGuide)}
        className="w-full flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">{t('browser.install.title')}</span>
        </div>
        {showInstallGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {showInstallGuide && (
        <div className="space-y-2 pl-4">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{step}</span>
              </div>
              <div>
                <div className="text-sm font-medium">{t(`browser.install.step${step}Title`)}</div>
                <div className="text-xs text-muted-foreground">{t(`browser.install.step${step}Desc`)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAQ - 可折叠 */}
      <button
        onClick={() => setShowFaq(!showFaq)}
        className="w-full flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">{t('browser.faq.title')}</span>
        </div>
        {showFaq ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {showFaq && (
        <div className="space-y-2 pl-4">
          {['iconNotFound', 'howToGetApiKey', 'supportedBrowsers'].map((faq) => (
            <div key={faq} className="p-3 rounded-lg bg-muted/30">
              <div className="text-sm font-medium mb-1">{t(`browser.faq.${faq}`)}</div>
              <div className="text-xs text-muted-foreground">{t(`browser.faq.${faq}Answer`)}</div>
            </div>
          ))}
        </div>
      )}

      <SettingsDivider />

      <InfoBox icon={Info} title={t('browser.infoBox.title')} variant="info">
        <ul className="space-y-1 text-xs">
          <li>• {t('browser.infoBox.tip1')}</li>
          <li>• {t('browser.infoBox.tip2')}</li>
        </ul>
      </InfoBox>
    </div>
  )
}
