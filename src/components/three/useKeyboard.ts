import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

/** 移動に使うキー(押下中のものをSetで保持する) */
const MOVEMENT_KEYS = new Set([
  'w',
  'a',
  's',
  'd',
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
])

/**
 * 押下中のキーを保持するフック。
 * 毎フレーム参照するためstateではなくrefで返す(再レンダリングを起こさない)。
 */
export function useKeyboard(): MutableRefObject<Set<string>> {
  const pressed = useRef(new Set<string>())

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (MOVEMENT_KEYS.has(key)) {
        e.preventDefault() // 矢印キーでページがスクロールするのを防ぐ
        pressed.current.add(key)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      pressed.current.delete(e.key.toLowerCase())
    }
    const onBlur = () => pressed.current.clear()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return pressed
}
