import { describe, expect, it } from 'vitest'
import { classifyTypingKey, typingSoundFile } from './sound'

describe('typing sound', () => {
  it('maps letters, numbers and punctuation to a normal key', () => {
    expect(classifyTypingKey('a')).toBe('key')
    expect(classifyTypingKey('Z')).toBe('key')
    expect(classifyTypingKey('7')).toBe('key')
    expect(classifyTypingKey(',')).toBe('key')
  })

  it('maps space, enter and backspace to their own samples', () => {
    expect(classifyTypingKey(' ')).toBe('space')
    expect(classifyTypingKey('Enter')).toBe('enter')
    expect(classifyTypingKey('Backspace')).toBe('backspace')
  })

  it('ignores modifiers and navigation keys', () => {
    expect(classifyTypingKey('Shift')).toBeNull()
    expect(classifyTypingKey('Control')).toBeNull()
    expect(classifyTypingKey('ArrowLeft')).toBeNull()
    expect(classifyTypingKey('Escape')).toBeNull()
    expect(classifyTypingKey('Tab')).toBeNull()
  })

  it('returns different files for press and release', () => {
    expect(typingSoundFile('key', 'down')).toBe('key_press.wav')
    expect(typingSoundFile('key', 'up')).toBe('key_release.wav')
    expect(typingSoundFile('space', 'down')).toBe('space_press.wav')
    expect(typingSoundFile('enter', 'up')).toBe('enter_release.wav')
  })

  it('falls back to the normal release for backspace', () => {
    expect(typingSoundFile('backspace', 'down')).toBe('backspace_press.wav')
    expect(typingSoundFile('backspace', 'up')).toBe('key_release.wav')
  })
})
