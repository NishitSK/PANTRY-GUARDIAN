'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, X } from 'lucide-react'
import { createPortal } from 'react-dom'

type RecipeDetail = {
  id: string
  title: string
  description: string
  instructions?: string | null
  ingredients: { name: string }[]
  imageSrc: string
  source: 'db' | 'curated'
  matchCount: number
  inventoryHits: number
  totalIngredients: number
}

function buildSteps(recipe: RecipeDetail) {
  if (recipe.instructions && recipe.instructions.trim()) {
    return recipe.instructions
      .split(/\n+/)
      .map((step) => step.trim())
      .filter(Boolean)
  }

  const ingredientNames = recipe.ingredients.map((ingredient) => ingredient.name)
  const firstGroup = ingredientNames.slice(0, 3).join(', ')
  const remainingCount = Math.max(ingredientNames.length - 3, 0)

  return [
    `Gather ${firstGroup}${remainingCount > 0 ? `, plus ${remainingCount} more ingredient${remainingCount === 1 ? '' : 's'}` : ''}.`,
    `Heat, mix, or assemble the ingredients until the recipe matches ${recipe.title.toLowerCase()}.`,
    'Taste, adjust seasoning if needed, and serve while the dish still feels fresh.',
  ]
}

export default function RecipeDetailButton({ recipe }: { recipe: RecipeDetail }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const steps = useMemo(() => buildSteps(recipe), [recipe])
  const matchPercent = Math.round((recipe.matchCount / Math.max(recipe.totalIngredients, 1)) * 100)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const previousOverflow = document.body.style.overflow
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, isMounted])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[#FFE66D] text-black transition-transform hover:-translate-y-0.5 hover:bg-black hover:text-white"
        aria-label={`Open details for ${recipe.title}`}
        title={`Open details for ${recipe.title}`}
      >
        <BookOpen className="h-4 w-4" />
      </button>

      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center px-2 py-3 sm:px-6 sm:py-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setIsOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.96 }}
                  className="relative h-[92vh] sm:h-[88vh] w-full max-w-[min(1120px,98vw)] overflow-hidden border-4 border-black bg-[#FFFDF7] shadow-[10px_10px_0_#000] sm:shadow-[14px_14px_0_#000]"
                >
                  <div className="grid h-full gap-0 lg:grid-cols-[1.18fr_0.82fr]">
                    <div className="relative min-h-[240px] border-b-4 border-black lg:min-h-0 lg:border-b-0 lg:border-r-4">
                      <img src={recipe.imageSrc} alt={recipe.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                      <div className="absolute left-4 top-4 border-2 border-black bg-[#FFE66D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-black">
                        Recipe details
                      </div>
                    </div>

                    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/55">
                            {recipe.source === 'db' ? 'Verified recipe' : 'Curated recipe'}
                          </p>
                          <h3 className="mt-2 font-noto-serif text-3xl leading-tight text-black sm:text-4xl">{recipe.title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="shrink-0 border-2 border-black bg-white p-2 text-black transition-colors hover:bg-black hover:text-white"
                          aria-label="Close recipe details"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mt-4 font-manrope text-sm leading-7 text-black/75">{recipe.description}</p>

                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="border-2 border-black bg-[#93E1A8] p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-black/60">Match</p>
                          <p className="mt-1 font-noto-serif text-2xl">{matchPercent}%</p>
                        </div>
                        <div className="border-2 border-black bg-[#FFF4CC] p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-black/60">In stock</p>
                          <p className="mt-1 font-noto-serif text-2xl">{recipe.inventoryHits}</p>
                        </div>
                        <div className="border-2 border-black bg-[#DDE8FF] p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-black/60">Total</p>
                          <p className="mt-1 font-noto-serif text-2xl">{recipe.totalIngredients}</p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-black/55">Ingredients</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {recipe.ingredients.map((ingredient) => (
                            <span key={ingredient.name} className="inline-flex min-h-11 items-center border-2 border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-black">
                              {ingredient.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 border-2 border-black bg-white p-4 sm:p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-black/55">How to make it</p>
                        <ol className="mt-3 space-y-3">
                          {steps.map((step, index) => (
                            <li key={index} className="flex gap-3 font-manrope text-sm leading-7 text-black/80">
                              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black bg-[#FFE66D] text-[10px] font-black">
                                {index + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
