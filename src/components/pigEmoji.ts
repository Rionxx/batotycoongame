/** 豚の見た目(絵文字)のマッピング。描画方法の差し替え時はこのファイルごと入れ替える */
import type { PigRarity, PigSpeciesId } from '../types/game'

export const PIG_EMOJI: Record<PigSpeciesId, string> = {
  pinky: '🐷',
  spotty: '🐖',
  muddy: '🐗',
  curly: '🌀',
  sleepy: '😴',
  hungry: '🍎',
  silver: '🥈',
  shadow: '🌑',
  flower: '🌸',
  ninja: '🥷',
  golden: '👑',
  king: '💎',
}

export const RARITY_LABEL: Record<PigRarity, string> = {
  common: 'コモン',
  rare: 'レア',
  epic: 'エピック',
}
