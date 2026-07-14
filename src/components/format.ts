/** 表示用の数値フォーマット(UI層専用のユーティリティ) */

/** コイン数: 整数に切り捨てて桁区切り。100万以上はコンパクト表記 */
export function formatCoins(value: number): string {
  const floored = Math.floor(value)
  if (floored >= 1_000_000) {
    return new Intl.NumberFormat('ja-JP', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(floored)
  }
  return floored.toLocaleString('ja-JP')
}

/** レート: 小数1桁まで表示 */
export function formatRate(value: number): string {
  return value.toLocaleString('ja-JP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

/** 確率: パーセント整数表示 */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

/** 経過時間: 「1時間23分」「45分」「30秒」 */
export function formatDuration(seconds: number): string {
  const s = Math.floor(seconds)
  if (s < 60) return `${s}秒`
  const minutes = Math.floor(s / 60)
  if (minutes < 60) return `${minutes}分`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours}時間${rest}分` : `${hours}時間`
}
