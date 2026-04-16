'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Ingredient {
  id: string
  name: string
  emoji: string
  category: string
}

const ingredients: Ingredient[] = [
  { id: '1', name: 'Tomato', emoji: '🍅', category: 'vegetable' },
  { id: '2', name: 'Cheese', emoji: '🧀', category: 'dairy' },
  { id: '3', name: 'Bread', emoji: '🍞', category: 'grain' },
  { id: '4', name: 'Egg', emoji: '🥚', category: 'protein' },
  { id: '5', name: 'Chicken', emoji: '🍗', category: 'protein' },
  { id: '6', name: 'Rice', emoji: '🍚', category: 'grain' },
  { id: '7', name: 'Pasta', emoji: '🍝', category: 'grain' },
  { id: '8', name: 'Onion', emoji: '🧅', category: 'vegetable' },
  { id: '9', name: 'Garlic', emoji: '🧄', category: 'vegetable' },
  { id: '10', name: 'Pepper', emoji: '🌶️', category: 'spice' },
  { id: '11', name: 'Milk', emoji: '🥛', category: 'dairy' },
  { id: '12', name: 'Butter', emoji: '🧈', category: 'dairy' },
]

export default function RecipeGamePage() {
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([])
  const [recipeName, setRecipeName] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)

  const addIngredient = (ingredient: Ingredient) => {
    if (selectedIngredients.length < 6) {
      setSelectedIngredients([...selectedIngredients, ingredient])
    }
  }

  const removeIngredient = (id: string) => {
    setSelectedIngredients(selectedIngredients.filter(ing => ing.id !== id))
  }

  const createRecipe = () => {
    if (selectedIngredients.length === 0 || !recipeName) {
      alert('Please select at least one ingredient and name your recipe!')
      return
    }

    // Calculate score based on variety
    const categories = new Set(selectedIngredients.map(ing => ing.category))
    const varietyScore = categories.size * 20
    const ingredientScore = selectedIngredients.length * 10
    const totalScore = Math.min(varietyScore + ingredientScore, 100)
    
    setScore(totalScore)
    setShowResult(true)
  }

  const resetGame = () => {
    setSelectedIngredients([])
    setRecipeName('')
    setShowResult(false)
    setScore(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400">👨‍🍳 Recipe Creator Game</h1>
          <Link href="/" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Back to App
          </Link>
        </div>

        {!showResult ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Create Your Recipe!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select up to 6 ingredients and create an amazing recipe! Mix different categories for a higher score.
              </p>
              
              <input
                type="text"
                placeholder="Name your recipe..."
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="w-full p-3 border-2 border-purple-300 dark:border-purple-600 rounded-lg mb-4 focus:outline-none focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              />

              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Selected Ingredients ({selectedIngredients.length}/6):</h3>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-purple-50 dark:bg-gray-700 rounded-lg">
                  {selectedIngredients.map((ing) => (
                    <button
                      key={`selected-${ing.id}`}
                      onClick={() => removeIngredient(ing.id)}
                      className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                    >
                      <span>{ing.emoji}</span>
                      <span>{ing.name}</span>
                      <span className="text-xs">✕</span>
                    </button>
                  ))}
                  {selectedIngredients.length === 0 && (
                    <span className="text-gray-400 dark:text-gray-500 italic">Click ingredients below to add them...</span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Available Ingredients:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ingredients.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    onClick={() => addIngredient(ingredient)}
                    disabled={selectedIngredients.length >= 6}
                    className="p-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-3xl mb-1">{ingredient.emoji}</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{ingredient.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{ingredient.category}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={createRecipe}
                className="mt-6 w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
              >
                🎯 Create Recipe!
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-4 text-purple-600 dark:text-purple-400">
              {recipeName}
            </h2>
            <p className="text-xl mb-6 text-gray-600 dark:text-gray-400">Your recipe has been created!</p>
            
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg p-6 mb-6">
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">{score}</div>
              <div className="text-lg text-gray-700 dark:text-gray-300">Recipe Score</div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {score >= 80 && '🌟 Master Chef! Amazing variety!'}
                {score >= 60 && score < 80 && '😊 Great recipe! Nice mix of ingredients.'}
                {score >= 40 && score < 60 && '👍 Good start! Try adding more variety.'}
                {score < 40 && '🔥 Keep experimenting with different ingredients!'}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Your Recipe:</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedIngredients.map((ing) => (
                  <div key={`result-${ing.id}`} className="px-4 py-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                    <span className="text-2xl mr-2">{ing.emoji}</span>
                    <span className="text-gray-700 dark:text-gray-300">{ing.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={resetGame}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
            >
              🎮 Create Another Recipe
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>🎮 Easter Egg: You found the secret recipe game!</p>
          <p className="mt-1">Mix ingredients from different categories for a higher score!</p>
        </div>
      </div>
    </div>
  )
}
