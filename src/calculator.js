export const TONS_PER_CUBIC_YARD = 1.4
export const PLANNING_ALLOWANCE = 0.1

export const startingDepths = {
  Driveway: 4,
  Walkway: 3,
  Patio: 4,
  'Landscape Bed': 3,
  Other: ''
}

export function parseDimension(value, label) {
  if (value === '' || value === null || value === undefined) {
    return { error: `Enter a ${label.toLowerCase()}.` }
  }
  const number = Number(value)
  if (!Number.isFinite(number)) return { error: `${label} must be a number.` }
  if (number <= 0) return { error: `${label} must be greater than zero.` }
  return { value: number }
}

export function calculateGravel({ length, width, depth }) {
  const parsedLength = parseDimension(length, 'Length')
  const parsedWidth = parseDimension(width, 'Width')
  const parsedDepth = parseDimension(depth, 'Depth')
  const errors = [parsedLength.error, parsedWidth.error, parsedDepth.error].filter(Boolean)

  if (errors.length) return { errors }

  const cubicFeet = parsedLength.value * parsedWidth.value * (parsedDepth.value / 12)
  const cubicYards = cubicFeet / 27
  const recommendedCubicYards = cubicYards * (1 + PLANNING_ALLOWANCE)
  const estimatedTons = cubicYards * TONS_PER_CUBIC_YARD
  const recommendedTons = estimatedTons * (1 + PLANNING_ALLOWANCE)

  return { cubicFeet, cubicYards, recommendedCubicYards, estimatedTons, recommendedTons, errors: [] }
}

export function formatNumber(value, digits = 1) {
  return Number(value).toFixed(digits)
}

export function createCopyText({ length, width, depth, result }) {
  return [
    'Gravel estimate',
    `Area: ${length} ft × ${width} ft`,
    `Depth: ${depth} in`,
    `Calculated quantity: ${formatNumber(result.cubicYards)} cubic yards`,
    `Recommended order: ${formatNumber(result.recommendedCubicYards)} cubic yards`,
    `Estimated weight: ${formatNumber(result.estimatedTons)} tons`,
    `Recommended order: ${formatNumber(result.recommendedTons)} tons`,
    'Planning assumption: 1.4 tons/yd³ + 10% planning allowance'
  ].join('\n')
}
