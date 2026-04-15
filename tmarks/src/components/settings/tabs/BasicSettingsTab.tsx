/**
 * 基础设置标签页
 * 包含账户信息、安全设置、语言设置
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Mail, Calendar, Shield, Lock, Eye, EyeOff, Globe } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { apiClient } from '@/lib/api-client'
import { useLanguage } from '@/hooks/useLanguage'
import { SettingsSection, SettingsItem, SettingsDivider } from '../SettingsSection'

export function BasicSettingsTab() {
  const { t, i18n } = useTranslation('settings')
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage()

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('error', t('basic.password.fillAllFields'))
      return
    }

    if (newPassword !== confirmPassword) {
      addToast('error', t('basic.password.mismatch'))
      return
    }

    if (newPassword.length < 6) {
      addToast('error', t('basic.password.tooShort'))
      return
    }

    setIsChangingPassword(true)
    try {
      await apiClient.post('/v1/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })

      addToast('success', t('basic.password.changeSuccess'))
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      const message = error instanceof Error ? error.message : t('basic.password.changeFailed')
      addToast('error', message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('basic.unknown')
    try {
      return new Date(dateString).toLocaleDateString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* 账户信息 */}
      <SettingsSection icon={User} title={t('basic.accountInfo.title')} description={t('basic.accountInfo.description')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsItem icon={User} title={t('basic.username')} description={user?.username || t('basic.notSet')} />
          {user?.email && <SettingsItem icon={Mail} title={t('basic.email')} description={user.email} />}
          <SettingsItem icon={Calendar} title={t('basic.registeredAt')} description={formatDate(user?.created_at)} />
          <SettingsItem
            icon={Shield}
            title={t('basic.role')}
            description={user?.role === 'admin' ? t('basic.roleAdmin') : t('basic.roleUser')}
          />
        </div>
      </SettingsSection>

      <SettingsDivider />

      {/* 安全设置 */}
      <SettingsSection icon={Lock} title={t('basic.security.title')} description={t('basic.security.description')}>
        {!showPasswordForm ? (
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t('basic.password.change')}</div>
                <div className="text-xs text-muted-foreground">{t('basic.security.description')}</div>
              </div>
              <button onClick={() => setShowPasswordForm(true)} className="btn btn-primary btn-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {t('basic.password.change')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 p-4 rounded-lg bg-card border border-border">
            <div className="grid sm:grid-cols-2 gap-4">
              <PasswordInput
                label={t('basic.password.current')}
                placeholder={t('basic.password.currentPlaceholder')}
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrentPassword}
                onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
              />
              <PasswordInput
                label={t('basic.password.new')}
                placeholder={t('basic.password.newPlaceholder')}
                value={newPassword}
                onChange={setNewPassword}
                show={showNewPassword}
                onToggleShow={() => setShowNewPassword(!showNewPassword)}
                minLength={6}
              />
            </div>
            <PasswordInput
              label={t('basic.password.confirm')}
              placeholder={t('basic.password.confirmPlaceholder')}
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="btn btn-ghost flex-1"
                disabled={isChangingPassword}
              >
                {t('basic.password.cancel')}
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={isChangingPassword}>
                {isChangingPassword ? t('basic.password.changing') : t('basic.password.submit')}
              </button>
            </div>
          </form>
        )}
      </SettingsSection>

      <SettingsDivider />

      {/* 语言设置 */}
      <SettingsSection icon={Globe} title={t('language.title')} description={t('language.description')}>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{t('language.label')}</div>
              <div className="text-xs text-muted-foreground">{t('language.hint')}</div>
            </div>
            <select
              value={currentLanguage}
              onChange={(e) => changeLanguage(e.target.value as typeof currentLanguage)}
              className="input w-40"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}

// 密码输入组件
function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggleShow,
  minLength,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggleShow: () => void
  minLength?: number
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input w-full pr-10"
          placeholder={placeholder}
          required
          minLength={minLength}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
