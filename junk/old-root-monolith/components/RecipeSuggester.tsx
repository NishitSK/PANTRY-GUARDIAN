'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, X, Utensils, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/shadcn-button'

interface Product {
  name: string
  category: string
}

interface InventoryItem {
  id: string
  product: Product
}

interface DBRecipe {
  id: string
  title: string
  description: string
  instructions: string | null
  ingredients: { name: string }[]
}

interface RecipeSuggesterProps {
  items: InventoryItem[]
  dbRecipes: DBRecipe[]
}

interface Recipe {
  title: string
  description: string
  ingredients: string[]
  matchCount: number
  source?: 'ai' | 'db'
}

export default function RecipeSuggester({ items, dbRecipes }: RecipeSuggesterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Initialize selection when items change
  useEffect(() => {
    setSelectedIds(new Set(items.map(i => i.id)))
  }, [items])

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const generateRecipes = (): Recipe[] => {
    const activeItems = items.filter(i => selectedIds.has(i.id))
    if (activeItems.length === 0) return []

    const itemNames = activeItems.map(i => i.product.name)
    const categories = new Set(activeItems.map(i => i.product.category.toLowerCase()))
    const hasVeg = Array.from(categories).some(c => c.includes('veg') || c.includes('produce'))
    const hasFruit = Array.from(categories).some(c => c.includes('fruit'))
    const hasMeat = Array.from(categories).some(c => c.includes('meat') || c.includes('poultry') || c.includes('fish'))
    const hasDairy = Array.from(categories).some(c => c.includes('dairy') || c.includes('cheese') || c.includes('milk'))
    
    const recipes: Recipe[] = []

    // --- DB Recipes Matching ---
    const dbSuggestions = dbRecipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name)
      
      // Count matches
      const matches = recipeIngredients.filter(rIng => {
        const rIngLower = rIng.toLowerCase()
        return activeItems.some(item => {
          const iName = item.product.name.toLowerCase()
          // Simple fuzzy match: check if one string contains the other
          return iName.includes(rIngLower) || rIngLower.includes(iName)
        })
      })
      
      return {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipeIngredients,
        matchCount: matches.length,
        totalIngredients: recipeIngredients.length,
        source: 'db' as const
      }
    }).filter(r => {
      // 50% match rule
      return r.totalIngredients > 0 && (r.matchCount / r.totalIngredients) >= 0.5
    })

    recipes.push(...dbSuggestions)

    // --- Fallback AI/Algorithmic Recipes ---
    // Only add these if we don't have many DB matches, or mix them in?
    // Let's mix them in but prioritize DB matches if they are good.

    // 1. Stir Fry (Very versatile)
    if (hasVeg || hasMeat) {
      recipes.push({
        title: "Rescue Stir-Fry",
        description: "Quickly sauté your expiring veggies and proteins with soy sauce, garlic, and ginger. Serve over rice or noodles.",
        ingredients: activeItems.filter(i => {
            const c = i.product.category.toLowerCase()
            return c.includes('veg') || c.includes('meat') || c.includes('poultry')
        }).map(i => i.product.name),
        matchCount: 0, // Calculated later
        source: 'ai'
      })
    }

    // 2. Soup/Stew
    if (hasVeg) {
      recipes.push({
        title: "Everything-Must-Go Soup",
        description: "Simmer your vegetables in broth. Add beans, lentils, or pasta for a hearty meal that freezes well.",
        ingredients: activeItems.filter(i => i.product.category.toLowerCase().includes('veg')).map(i => i.product.name),
        matchCount: 0,
        source: 'ai'
      })
    }

    // 3. Frittata/Omelette
    if (hasVeg || hasDairy || hasMeat) {
       recipes.push({
        title: "Kitchen Sink Frittata",
        description: "Whisk some eggs (or chickpea flour) and bake with your chopped expiring ingredients for a simple, protein-packed meal.",
        ingredients: activeItems.filter(i => {
             const c = i.product.category.toLowerCase()
             return c.includes('veg') || c.includes('meat') || c.includes('dairy') || c.includes('cheese')
        }).map(i => i.product.name),
        matchCount: 0,
        source: 'ai'
      })
    }

    // 4. Fruit Salad/Smoothie
    if (hasFruit) {
      recipes.push({
        title: "Sunset Smoothie / Salad",
        description: "Blend your ripe fruits with yogurt or juice, or chop them up for a fresh fruit salad.",
        ingredients: activeItems.filter(i => i.product.category.toLowerCase().includes('fruit')).map(i => i.product.name),
        matchCount: 0,
        source: 'ai'
      })
    }

    // 5. Generic "Bowl"
    recipes.push({
      title: "The 'Pantry Guardian' Bowl",
      description: "Roast or cook your expiring items and serve them over a grain base (quinoa, rice, couscous) with your favorite dressing.",
      ingredients: itemNames.slice(0, 5), // Just take top 5
      matchCount: 0,
      source: 'ai'
    })

    // Calculate match counts for AI recipes (how many expiring items are used)
    // And sort everything
    return recipes.map(r => {
      if (r.source === 'ai') {
        return { ...r, matchCount: r.ingredients.length }
      }
      return r
    })
    .filter(r => r.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5) // Return top 5
  }

  const recipes = generateRecipes()

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
      >
        <ChefHat className="mr-2 h-4 w-4" />
        Suggest Recipes
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-background rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Recipe Ideas
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Select ingredients to include ({selectedIds.size} selected)
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Ingredient Selection */}
              <div className="px-6 py-4 border-b border-border bg-background/50 overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {items.map(item => {
                    const isSelected = selectedIds.has(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`
                          inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                          ${isSelected 
                            ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20' 
                            : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                          }
                        `}
                      >
                        {isSelected && <Check className="w-3 h-3 mr-1.5" />}
                        {item.product.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto">
                {recipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
                    <p className="text-muted-foreground">
                      Try selecting different ingredients to see suggestions.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {recipes.map((recipe, idx) => (
                      <div 
                        key={idx} 
                        className="group relative bg-card hover:bg-accent/50 border border-border rounded-lg p-5 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-col">
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                              {recipe.title}
                              {recipe.source === 'db' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  Verified
                                </span>
                              )}
                            </h3>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap ml-2">
                            Uses {recipe.matchCount} items
                          </span>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                          {recipe.description}
                        </p>

                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Using these ingredients:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {recipe.ingredients.map((ing, i) => (
                              <span 
                                key={i}
                                className="inline-flex items-center px-2 py-1 rounded-md bg-background border border-border text-xs font-medium"
                              >
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-muted/30 shrink-0 text-center text-xs text-muted-foreground">
                These are AI-generated suggestions based on your inventory. Always check food quality before cooking.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
