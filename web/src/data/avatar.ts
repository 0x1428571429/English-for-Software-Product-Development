import type { AvatarAccessory, AvatarConfig, AvatarEyes, AvatarFace, AvatarOutfit } from './story'

export interface AvatarPartOptions {
  face: AvatarFace[]
  eyes: AvatarEyes[]
  outfit: AvatarOutfit[]
  accessory: AvatarAccessory[]
}

export const AVATAR_PARTS: AvatarPartOptions = {
  face: ['oval', 'round', 'square'],
  eyes: ['dot', 'sharp', 'soft'],
  outfit: ['shirt', 'blazer', 'hoodie', 'tee', 'turtleneck'],
  accessory: ['none', 'glasses', 'headphones', 'earrings', 'lanyard'],
}

export const DEFAULT_AVATAR: AvatarConfig = {
  face: 'oval',
  eyes: 'dot',
  outfit: 'shirt',
  accessory: 'none',
}

/** Compose a look from a base preset plus any part overrides. */
export function composeAvatar(
  base: AvatarConfig = DEFAULT_AVATAR,
  patch: Partial<AvatarConfig> = {},
): AvatarConfig {
  return { ...base, ...patch }
}

export function avatarSignature(config: AvatarConfig): string {
  return [config.face, config.eyes, config.outfit, config.accessory].join('/')
}
