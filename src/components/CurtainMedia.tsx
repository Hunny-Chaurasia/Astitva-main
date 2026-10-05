import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const settingKey = 'astitva-curtains-enabled'
const settingEvent = 'astitva-curtains-updated'

function getCurtainsEnabled() {
  try {
    return localStorage.getItem(settingKey) !== 'false'
  } catch {
    return true
  }
}

export function CurtainMedia({ children, className = '', label, enableCurtain = false }: { children: ReactNode; className?: string; label: string; enableCurtain?: boolean }) {
  const [enabled, setEnabled] = useState(getCurtainsEnabled)
  const [opened, setOpened] = useState(false)
  const isProfilePhoto = /profile photo/i.test(label)

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail
      setEnabled(detail)
    }
    window.addEventListener(settingEvent, update)
    return () => window.removeEventListener(settingEvent, update)
  }, [])

  return <span className={`curtain-media ${className}`}>
    {children}
    {enabled && enableCurtain && !isProfilePhoto && <span
      className={`curtain-media__cover${opened ? ' curtain-media__cover--open' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Open curtain to view ${label}`}
      onClick={event => { event.stopPropagation(); setOpened(true) }}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          setOpened(true)
        }
      }}
    >
      <span className="curtain-media__panel curtain-media__panel--left" />
      <span className="curtain-media__panel curtain-media__panel--right" />
      {!opened && <span className="curtain-media__prompt">Tap to open</span>}
    </span>}
  </span>
}

export function CurtainToggle({ notify }: { notify: (message: string) => void }) {
  const [enabled, setEnabled] = useState(getCurtainsEnabled)

  useEffect(() => {
    const update = (event: Event) => setEnabled((event as CustomEvent<boolean>).detail)
    window.addEventListener(settingEvent, update)
    return () => window.removeEventListener(settingEvent, update)
  }, [])

  const toggle = () => {
    const next = !enabled
    try {
      localStorage.setItem(settingKey, String(next))
    } catch {
      notify('Curtain preference could not be saved. Check available browser storage and try again.')
      return
    }
    setEnabled(next)
    window.dispatchEvent(new CustomEvent(settingEvent, { detail: next }))
  }

  return <button
    type="button"
    onClick={toggle}
    aria-pressed={!enabled}
    aria-label={enabled ? 'Remove curtains from eligible posts' : 'Show curtains on eligible posts'}
    title={enabled ? 'Remove curtains from eligible posts' : 'Show curtains on eligible posts'}
    className="curtain-toggle rounded-full px-2.5 py-2 text-xs font-semibold"
  >
    {enabled ? 'Curtains on' : 'Curtains off'}
  </button>
}
