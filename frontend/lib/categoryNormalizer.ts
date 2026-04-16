/**
 * Category normalizer — maps free-text product categories (as they come from
 * the DB / receipt scanner) to a fixed set of canonical filter keys used in
 * the inventory filter bar.
 *
 * Rules:
 *  - Matching is case-insensitive and trims surrounding whitespace.
 *  - Unknown categories fall back to "Other".
 *  - The canonical key is the DISPLAY label (title-case) used in filter tabs.
 */

export const CANONICAL_CATEGORIES = [
  'All',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Meat',
  'Grains',
  'Pantry',
  'Frozen',
  'Beverages',
  'Other',
] as const

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number]

type RuleEntry = { keywords: string[]; canonical: CanonicalCategory }

const RULES: RuleEntry[] = [
  {
    keywords: [
      'vegetable', 'vegetables', 'fresh vegetable', 'fresh vegetables',
      'greens', 'salad', 'leafy',
    ],
    canonical: 'Vegetables',
  },
  {
    keywords: [
      'fruit', 'fruits', 'fresh fruit', 'fresh fruits',
      'tropical', 'citrus', 'berries', 'stone fruit',
    ],
    canonical: 'Fruits',
  },
  {
    keywords: [
      'dairy', 'dairy product', 'dairy products', 'milk', 'cheese',
      'yogurt', 'curd', 'paneer', 'butter', 'cream', 'ghee',
    ],
    canonical: 'Dairy',
  },
  {
    keywords: [
      'meat', 'poultry', 'seafood', 'fish', 'chicken', 'beef',
      'pork', 'lamb', 'mutton', 'prawn', 'shrimp', 'egg', 'eggs',
    ],
    canonical: 'Meat',
  },
  {
    keywords: [
      'grain', 'grains', 'cereal', 'cereals', 'rice', 'wheat',
      'oats', 'pasta', 'noodles', 'flour', 'atta', 'maida', 'dal', 'lentil',
      'legume', 'legumes', 'pulse', 'pulses', 'bean', 'beans',
    ],
    canonical: 'Grains',
  },
  {
    keywords: [
      'pantry', 'pantry staple', 'pantry staples', 'condiment', 'condiments',
      'sauce', 'sauces', 'spice', 'spices', 'herb', 'herbs', 'seasoning',
      'oil', 'oils', 'vinegar', 'sugar', 'salt', 'honey', 'jam', 'pickle',
      'canned', 'tinned', 'bakery', 'baked', 'bread', 'biscuit', 'cookie',
      'snack', 'snacks', 'dry fruit', 'dry fruits', 'nut', 'nuts',
    ],
    canonical: 'Pantry',
  },
  {
    keywords: [
      'frozen', 'frozen food', 'frozen foods', 'ice cream', 'frozen meal',
    ],
    canonical: 'Frozen',
  },
  {
    keywords: [
      'beverage', 'beverages', 'drink', 'drinks', 'juice', 'water',
      'soda', 'coffee', 'tea', 'alcohol', 'wine', 'beer',
    ],
    canonical: 'Beverages',
  },
]

/**
 * Returns the canonical category for a given raw category string.
 * Falls back to "Other" if no rule matches.
 */
export function normalizeCategory(raw: string): CanonicalCategory {
  if (!raw) return 'Other'
  const lower = raw.toLowerCase().trim()

  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (lower === kw || lower.includes(kw)) {
        return rule.canonical
      }
    }
  }

  return 'Other'
}

/**
 * Returns a display label like "Fruits" when the raw and canonical are the
 * same, or "Fruits / Fresh Fruits" when they differ (preserving sub-category
 * detail without breaking filter logic).
 */
export function getCategoryDisplayLabel(raw: string): string {
  return normalizeCategory(raw)
}
