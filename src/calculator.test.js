import { describe, expect, it } from 'vitest'
import { calculateGravel, createCopyText, formatNumber } from './calculator'

describe('calculateGravel', () => {
  it('calculates the known 30 × 10 ft × 4 in reference case', () => {
    const result = calculateGravel({ length: '30', width: '10', depth: '4' })
    expect(result.cubicFeet).toBeCloseTo(100)
    expect(result.cubicYards).toBeCloseTo(3.7037037)
    expect(result.recommendedCubicYards).toBeCloseTo(4.0740741)
    expect(result.estimatedTons).toBeCloseTo(5.1851851)
    expect(result.recommendedTons).toBeCloseTo(5.7037037)
  })
  it('accepts fractional depth', () => { expect(calculateGravel({ length: 12, width: 12, depth: 2.5 }).cubicFeet).toBeCloseTo(30) })
  it.each([['0', '10', '4'], ['10', '-1', '4'], ['', '10', '4'], ['ten', '10', '4']])('rejects invalid dimensions', (length, width, depth) => { expect(calculateGravel({ length, width, depth }).errors.length).toBeGreaterThan(0) })
  it('applies the 10 percent allowance', () => { const result = calculateGravel({ length: 27, width: 12, depth: 12 }); expect(result.recommendedCubicYards).toBeCloseTo(result.cubicYards * 1.1); expect(result.recommendedTons).toBeCloseTo(result.estimatedTons * 1.1) })
  it('retains internal precision for rounding by the UI', () => { expect(calculateGravel({ length: 30, width: 10, depth: 4 }).recommendedTons).toBeCloseTo(5.7037037) })
  it('rounds the displayed purchase quantity to one decimal place', () => { expect(formatNumber(5.7037037)).toBe('5.7') })
})
describe('createCopyText', () => {
  it('creates a clean supplier-ready summary', () => { const result = calculateGravel({ length: 30, width: 10, depth: 4 }); expect(createCopyText({ length: 30, width: 10, depth: 4, result })).toBe('Gravel estimate\nArea: 30 ft × 10 ft\nDepth: 4 in\nCalculated quantity: 3.7 cubic yards\nRecommended order: 4.1 cubic yards\nEstimated weight: 5.2 tons\nRecommended order: 5.7 tons\nPlanning assumption: 1.4 tons/yd³ + 10% planning allowance') })
})
