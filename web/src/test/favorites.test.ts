import { beforeEach, describe, expect, it } from 'vitest'
import { favoriteId, useFavoritesStore } from '../store/useFavoritesStore'

function addWord(title: string) {
  useFavoritesStore.getState().add({
    id: favoriteId('word', title),
    kind: 'word',
    title,
    zh: '释义',
    color: 'yellow',
  })
}

describe('favorites store', () => {
  beforeEach(() => {
    useFavoritesStore.getState().reset()
  })

  it('normalizes ids so the same word cannot be saved twice', () => {
    expect(favoriteId('word', '  Scope   Creep ')).toBe('word:scope creep')
    addWord('Scope Creep')
    addWord('scope creep')
    expect(Object.keys(useFavoritesStore.getState().items)).toHaveLength(1)
  })

  it('toggles, recolors, and removes an item', () => {
    addWord('blocker')
    const id = favoriteId('word', 'blocker')
    expect(useFavoritesStore.getState().items[id].color).toBe('yellow')

    useFavoritesStore.getState().setColor(id, 'pink')
    expect(useFavoritesStore.getState().items[id].color).toBe('pink')

    useFavoritesStore.getState().toggle({
      id,
      kind: 'word',
      title: 'blocker',
      color: 'green',
    })
    expect(useFavoritesStore.getState().items[id]).toBeUndefined()
  })

  it('round-trips through export/import and ignores malformed items', () => {
    addWord('recuse')
    const exported = useFavoritesStore.getState().exportFavorites()
    useFavoritesStore.getState().reset()
    expect(Object.keys(useFavoritesStore.getState().items)).toHaveLength(0)

    useFavoritesStore.getState().importFavorites({
      schemaVersion: 1,
      items: {
        ...exported.items,
        broken: { title: 'missing id' } as never,
      },
    })
    expect(useFavoritesStore.getState().items['word:recuse']).toBeTruthy()
    expect(useFavoritesStore.getState().items.broken).toBeUndefined()
  })
})
