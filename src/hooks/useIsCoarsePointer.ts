import { useEffect, useState } from 'react'

/**
 * 主入力がタッチ(指)かどうか。
 * タッチ用UI(スティック・アクションボタン)の表示判定にのみ使い、
 * キーボード操作はどの環境でも常に有効なままにする。
 */
export function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => matchCoarse())

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(pointer: coarse)')
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return coarse
}

function matchCoarse(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(pointer: coarse)').matches
}
