import { useCallback, useRef, useState } from 'react'
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from 'react'
import { ZERO_MOVE, stickVectorFromDrag } from './movement'
import type { MoveVector } from './movement'

/** スティックの可動半径(px)。CSSの .touch-stick サイズと対応させる */
const STICK_RADIUS = 52

interface VirtualStickProps {
  /** 毎フレーム参照される移動ベクトル。ここへ直接書き込む(再レンダリングを避ける) */
  moveRef: MutableRefObject<MoveVector>
}

/** 画面左下のバーチャルスティック。ドラッグ量に応じた可変速で移動する */
export function VirtualStick({ moveRef }: VirtualStickProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const pointerId = useRef<number | null>(null)
  // つまみの見た目だけstateで持つ(移動計算はrefで完結する)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  const updateFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current
      if (!base) return
      const rect = base.getBoundingClientRect()
      const dx = clientX - (rect.left + rect.width / 2)
      const dy = clientY - (rect.top + rect.height / 2)
      const vector = stickVectorFromDrag(dx, dy, STICK_RADIUS)
      moveRef.current = vector
      setKnob({ x: vector.x * STICK_RADIUS, y: vector.z * STICK_RADIUS })
    },
    [moveRef],
  )

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointerId.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromEvent(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return
    updateFromEvent(e.clientX, e.clientY)
  }

  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return
    pointerId.current = null
    moveRef.current = ZERO_MOVE
    setKnob({ x: 0, y: 0 })
  }

  return (
    <div
      ref={baseRef}
      className="touch-stick"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      aria-label="移動スティック"
    >
      <div
        className="touch-stick__knob"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  )
}

interface ActionButtonProps {
  label: string
  sublabel?: string
  enabled: boolean
  onPress: () => void
}

/** 画面右下のアクションボタン(Eキー相当)。近接対象があるときだけ表示する */
export function TouchActionButton({
  label,
  sublabel,
  enabled,
  onPress,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`touch-action ${enabled ? 'touch-action--ready' : ''}`}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onPress()
      }}
    >
      <span className="touch-action__label">{label}</span>
      {sublabel && <span className="touch-action__sub">{sublabel}</span>}
    </button>
  )
}
