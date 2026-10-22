import { createId, pickRandom, randomInt, shuffle } from './random'

describe('randomInt', () => {
  it('stays within min and max, including both ends', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
      const value = randomInt(3, 6)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(6)
      expect(Number.isInteger(value)).toBe(true)
      seen.add(value)
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6])
  })

  it('returns the edges for the lowest and highest random values', () => {
    expect(randomInt(1, 10, () => 0)).toBe(1)
    expect(randomInt(1, 10, () => 0.9999)).toBe(10)
  })

  it('rejects bad ranges', () => {
    expect(() => randomInt(5, 1)).toThrow()
    expect(() => randomInt(1.5, 3)).toThrow()
  })
})

describe('shuffle', () => {
  it('keeps every item and does not change the original', () => {
    const original = [1, 2, 3, 4, 5]
    const result = shuffle(original)
    expect(result).toHaveLength(5)
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5])
    expect(original).toEqual([1, 2, 3, 4, 5])
  })

  it('produces different orders over many runs', () => {
    const orders = new Set<string>()
    for (let i = 0; i < 200; i++) orders.add(shuffle([1, 2, 3, 4]).join(','))
    expect(orders.size).toBeGreaterThan(10)
  })
})

describe('pickRandom', () => {
  it('returns an item from the list', () => {
    expect(['a', 'b', 'c']).toContain(pickRandom(['a', 'b', 'c']))
  })

  it('throws on an empty list', () => {
    expect(() => pickRandom([])).toThrow()
  })
})

describe('createId', () => {
  it('creates unique ids with the given prefix', () => {
    const ids = new Set(Array.from({ length: 500 }, () => createId('q')))
    expect(ids.size).toBe(500)
    for (const id of ids) expect(id.startsWith('q_')).toBe(true)
  })
})
