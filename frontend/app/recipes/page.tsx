import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ComponentType } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import RecipeDetailButton from '@/components/RecipeDetailButton'
import connectDB from '@/lib/mongodb'
import { getInventoryFromBackendApi } from '@/lib/serverInventory'
import { auth, currentUser } from '@clerk/nextjs/server'
import { InventoryItem, Recipe, User } from '@/models'
import {
	Apple,
	Banana,
	Carrot,
	Check,
	ChefHat,
	Drumstick,
	EggFried,
	Fish,
	Flame,
	LeafyGreen,
	Milk,
	Soup,
	Sandwich,
	Wheat,
	ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RecipeIngredient = {
	name: string
}

type RecipeCard = {
	id: string
	title: string
	description: string
	instructions?: string | null
	ingredients: RecipeIngredient[]
	source: 'db' | 'curated'
	imagePrompt?: string
}

type InventoryProduct = {
	name: string
	category: string
}

type InventoryRecord = {
	id: string
	productId: InventoryProduct | string
}

type IngredientMatch = {
	name: string
	icon: ComponentType<{ className?: string }>
	inInventory: boolean
}

const CURATED_RECIPES: RecipeCard[] = [
	{
		id: 'curated-tomato-pasta',
		title: 'Classic Tomato Pasta',
		description: 'A sharp, practical pasta built around tomatoes, garlic, basil, and pantry staples.',
		ingredients: [
			{ name: 'Pasta' },
			{ name: 'Tomatoes' },
			{ name: 'Garlic' },
			{ name: 'Basil' },
			{ name: 'Olive Oil' },
			{ name: 'Salt' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of a classic tomato pasta on a heavy ceramic plate, red sauce, basil, garlic, natural light, high contrast, tactile, off-white background',
	},
	{
		id: 'curated-veg-stir-fry',
		title: 'Vegetable Stir Fry',
		description: 'A fast, high-heat recipe that clears out vegetables before they lose texture.',
		ingredients: [
			{ name: 'Rice' },
			{ name: 'Carrots' },
			{ name: 'Broccoli' },
			{ name: 'Bell Pepper' },
			{ name: 'Soy Sauce' },
			{ name: 'Ginger' },
			{ name: 'Garlic' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of a vegetable stir fry in a black steel pan, broccoli, carrots, peppers, ginger steam, bold shadows, warm kitchen light',
	},
	{
		id: 'curated-banana-pancakes',
		title: 'Banana Pancakes',
		description: 'A soft breakfast rescue for bananas that are getting too ripe to sit around.',
		ingredients: [
			{ name: 'Bananas' },
			{ name: 'Flour' },
			{ name: 'Eggs' },
			{ name: 'Milk' },
			{ name: 'Butter' },
			{ name: 'Maple Syrup' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of banana pancakes stacked on a chipped white plate, sliced bananas, maple syrup, butter, soft window light, textured tabletop',
	},
	{
		id: 'curated-frittata',
		title: 'Kitchen Sink Frittata',
		description: 'Eggs, greens, and leftovers baked into a clean, compact meal with strong shelf-life logic.',
		ingredients: [
			{ name: 'Eggs' },
			{ name: 'Milk' },
			{ name: 'Spinach' },
			{ name: 'Cheddar Cheese' },
			{ name: 'Onion' },
			{ name: 'Herbs' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of a rustic frittata cut into wedges, eggs, greens, cheese, onion, cast iron pan, hard shadows, minimalist plating',
	},
	{
		id: 'curated-salad-bowl',
		title: 'Pantry Guardian Bowl',
		description: 'A grain bowl built around whatever is freshest in your fridge and pantry.',
		ingredients: [
			{ name: 'Rice' },
			{ name: 'Tomatoes' },
			{ name: 'Lettuce' },
			{ name: 'Carrots' },
			{ name: 'Olive Oil' },
			{ name: 'Lemon' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of a grain bowl with tomatoes, lettuce, carrots, rice and lemon dressing, bold color blocks, matte ceramic bowl, overhead shot',
	},
	{
		id: 'curated-soup',
		title: 'Everything-Must-Go Soup',
		description: 'A broth-forward cleanup recipe for produce that needs attention immediately.',
		ingredients: [
			{ name: 'Broccoli' },
			{ name: 'Carrots' },
			{ name: 'Onion' },
			{ name: 'Garlic' },
			{ name: 'Vegetable Stock' },
			{ name: 'Bread' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of a vegetable soup in a deep black bowl, carrots, broccoli, bread on the side, steam, moody contrast, rustic table',
	},
	{
		id: 'curated-potato-chips',
		title: 'Potato Chips',
		description: 'A bare-minimum snack that only needs one potato and a hot oven or fryer.',
		ingredients: [
			{ name: 'Potato' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of homemade potato chips on a rough plate, thin crisp slices, salt dust, sharp shadows, minimal composition, tactile surface',
	},
	{
		id: 'curated-baked-potato',
		title: 'Baked Potato',
		description: 'The simplest dinner on the page: one potato, heat, and a fork.',
		ingredients: [
			{ name: 'Potato' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of a baked potato split open on a matte ceramic plate, steam, rugged skin, sparse garnish, hard light, off-white background',
	},
	{
		id: 'curated-apple-slices',
		title: 'Apple Slices',
		description: 'A single-fruit snack for apples that are still crisp enough to serve raw.',
		ingredients: [
			{ name: 'Apple' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of sliced apples arranged on a plain plate, clean negative space, natural texture, bold shadows, minimalist snack styling',
	},
	{
		id: 'curated-boiled-eggs',
		title: 'Boiled Eggs',
		description: 'A protein reset made from a single pantry staple and almost no effort.',
		ingredients: [
			{ name: 'Eggs' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of boiled eggs in a simple tray, peeled shells nearby, stark shadows, clean white surface, utilitarian plating',
	},
	{
		id: 'curated-noodle-bowl',
		title: 'Miso Noodle Rescue',
		description: 'A savory bowl for clearing out vegetables, noodles, and any softening greens fast.',
		ingredients: [
			{ name: 'Noodles' },
			{ name: 'Miso' },
			{ name: 'Carrots' },
			{ name: 'Spinach' },
			{ name: 'Eggs' },
			{ name: 'Sesame Oil' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of a miso noodle bowl, eggs, spinach, carrots, sesame oil, dark lacquer bowl, dramatic steam, high contrast',
	},
	{
		id: 'curated-potato-hash',
		title: 'Crispy Potato Hash',
		description: 'A skillet-heavy dinner that turns potatoes, onions, and leftovers into a sharp, fast meal.',
		ingredients: [
			{ name: 'Potatoes' },
			{ name: 'Onion' },
			{ name: 'Eggs' },
			{ name: 'Herbs' },
			{ name: 'Salt' },
			{ name: 'Pepper' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of crispy potato hash in a cast iron skillet, fried eggs, onions, herbs, crunchy textures, no-fuss plating',
	},
	{
		id: 'curated-apple-toast',
		title: 'Apple Cinnamon Toast',
		description: 'A quick breakfast for using apples before they soften too much.',
		ingredients: [
			{ name: 'Apples' },
			{ name: 'Bread' },
			{ name: 'Butter' },
			{ name: 'Cinnamon' },
			{ name: 'Honey' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of apple cinnamon toast, sliced apples, butter, honey drizzle, rustic bread, off-white ceramic plate, warm light',
	},
	{
		id: 'curated-palak-paneer-skillet',
		title: 'Palak Paneer Skillet',
		description: 'A fast stovetop paneer and spinach dish for using palak, paneer, chilli, and haldi before quality drops.',
		ingredients: [
			{ name: 'Palak' },
			{ name: 'Paneer' },
			{ name: 'Onion' },
			{ name: 'Garlic' },
			{ name: 'Haldi' },
			{ name: 'Chilli' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of palak paneer in a black skillet, spinach gravy, paneer cubes, strong contrast, textured tabletop',
	},
	{
		id: 'curated-atta-roti-honey',
		title: 'Atta Roti with Honey',
		description: 'A minimal sweet-savory plate using atta dough and honey when pantry choices are limited.',
		ingredients: [
			{ name: 'Atta' },
			{ name: 'Water' },
			{ name: 'Salt' },
			{ name: 'Honey' },
			{ name: 'Ghee' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of hot atta roti with a honey drizzle and ghee, matte plate, hard side light',
	},
	{
		id: 'curated-coconut-chilli-chutney',
		title: 'Coconut Chilli Chutney',
		description: 'A quick grinder chutney to use nariyal and green chilli while fresh and aromatic.',
		ingredients: [
			{ name: 'Nariyal' },
			{ name: 'Green Chilli' },
			{ name: 'Salt' },
			{ name: 'Lemon' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of coconut chilli chutney in a simple steel bowl, coarse texture, minimal setup',
	},
	{
		id: 'curated-jeera-basmati-rice',
		title: 'Jeera Basmati Rice',
		description: 'A pantry-side rice recipe to use basmati and jeera with low prep and stable shelf ingredients.',
		ingredients: [
			{ name: 'Basmati Rice' },
			{ name: 'Jeera' },
			{ name: 'Ghee' },
			{ name: 'Salt' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of jeera basmati rice in a dark bowl, cumin tempering, high contrast, clean composition',
	},
	{
		id: 'curated-honey-apple-bowl',
		title: 'Honey Apple Bowl',
		description: 'A no-cook prep bowl for apples and honey when you need a quick low-effort recipe.',
		ingredients: [
			{ name: 'Apples' },
			{ name: 'Honey' },
			{ name: 'Cinnamon' },
		],
		source: 'curated',
		imagePrompt: 'editorial brutalist food photography of a sliced apple bowl with honey and cinnamon, matte ceramic, soft natural light',
	},
]

const normalizeText = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()

const ingredientIconMap: Array<{ test: RegExp; icon: ComponentType<{ className?: string }> }> = [
	{ test: /banana|plantain/, icon: Banana },
	{ test: /apple|pear|orange|grape|berry|fruit|tomato|lemon|lime/, icon: Apple },
	{ test: /carrot|broccoli|pepper|onion|lettuce|spinach|palak|kale|basil|parsley|herb|vegetable|coriander|mint|pudina/, icon: LeafyGreen },
	{ test: /milk|cream|butter|yogurt|cheese|paneer|curd|dahi|ghee/, icon: Milk },
	{ test: /egg/, icon: EggFried },
	{ test: /fish|salmon|tuna|seafood/, icon: Fish },
	{ test: /chicken|beef|pork|bacon|turkey|meat/, icon: Drumstick },
	{ test: /rice|basmati|pasta|bread|flour|atta|maida|wheat|oat|grain|noodle/, icon: Wheat },
	{ test: /soup|broth|stew/, icon: Soup },
	{ test: /sandwich|toast|wrap/, icon: Sandwich },
	{ test: /oil|sauce|spice|salt|ginger|garlic|chilli|chili|haldi|turmeric|jeera|cumin|honey/, icon: Flame },
]

const LOCAL_RECIPE_IMAGES: Record<string, string> = {
	'curated-tomato-pasta': '/recipe-images/classictomatopasta.png',
	'curated-veg-stir-fry': '/recipe-images/vegetablestirfry.png',
	'curated-banana-pancakes': '/recipe-images/bananapancakes.png',
	'curated-frittata': '/recipe-images/kitchenfrittata.png',
	'curated-salad-bowl': '/recipe-images/pantryguardianbowl.png',
	'curated-soup': '/recipe-images/everythingsoup.png',
	'curated-potato-chips': '/recipe-images/potatochip.png',
	'curated-baked-potato': '/recipe-images/bakedpotato.png',
	'curated-boiled-eggs': '/recipe-images/boiledeggs.png',
	'curated-noodle-bowl': '/recipe-images/misosoup.png',
	'curated-potato-hash': '/recipe-images/crispypotatohash.png',
	'curated-crispy-potato-hash': '/recipe-images/crispypotatohash.png',
	'curated-apple-slices': '/recipe-images/appleslices.png',
	'curated-apple-toast': '/recipe-images/applecinnamontoast.png',
	'curated-palak-paneer-skillet': '/recipe-images/palakpanner.png',
	'curated-atta-roti-honey': '/recipe-images/rootihoney.png',
	'curated-coconut-chilli-chutney': '/recipe-images/chillycoconutchutney.png',
	'curated-jeera-basmati-rice': '/recipe-images/jeerabasmatirice.png',
	'curated-honey-apple-bowl': '/recipe-images/honeyedapple.png',
}

const RECIPE_IMAGE_ALIASES: Record<string, string> = {
	[normalizeText('Classic Tomato Pasta')]: '/recipe-images/classictomatopasta.png',
	[normalizeText('Vegetable Stir Fry')]: '/recipe-images/vegetablestirfry.png',
	[normalizeText('Banana Pancakes')]: '/recipe-images/bananapancakes.png',
	[normalizeText('Kitchen Sink Frittata')]: '/recipe-images/kitchenfrittata.png',
	[normalizeText('Pantry Guardian Bowl')]: '/recipe-images/pantryguardianbowl.png',
	[normalizeText('Everything-Must-Go Soup')]: '/recipe-images/everythingsoup.png',
	[normalizeText('Potato Chips')]: '/recipe-images/potatochip.png',
	[normalizeText('Baked Potato')]: '/recipe-images/bakedpotato.png',
	[normalizeText('Apple Slices')]: '/recipe-images/appleslices.png',
	[normalizeText('Boiled Eggs')]: '/recipe-images/boiledeggs.png',
	[normalizeText('Miso Noodle Rescue')]: '/recipe-images/misosoup.png',
	[normalizeText('Crispy Potato Hash')]: '/recipe-images/crispypotatohash.png',
	[normalizeText('Crispy Potato Hash Recipe')]: '/recipe-images/crispypotatohash.png',
	[normalizeText('Apple Cinnamon Toast')]: '/recipe-images/applecinnamontoast.png',
	[normalizeText('Palak Paneer Skillet')]: '/recipe-images/palakpanner.png',
	[normalizeText('Atta Roti with Honey')]: '/recipe-images/rootihoney.png',
	[normalizeText('Coconut Chilli Chutney')]: '/recipe-images/chillycoconutchutney.png',
	[normalizeText('Jeera Basmati Rice')]: '/recipe-images/jeerabasmatirice.png',
	[normalizeText('Honey Apple Bowl')]: '/recipe-images/honeyedapple.png',
}

const pickIngredientIcon = (ingredientName: string) => {
	const match = ingredientIconMap.find((entry) => entry.test.test(ingredientName))
	return match?.icon || ChefHat
}

const getRecipeImageSrc = (recipe: RecipeCard) => LOCAL_RECIPE_IMAGES[recipe.id] || RECIPE_IMAGE_ALIASES[normalizeText(recipe.title)]

const recipeMatchCount = (recipe: RecipeCard, inventoryNames: string[]) => {
	const recipeIngredients = recipe.ingredients.map((ingredient) => normalizeText(ingredient.name))
	return recipeIngredients.filter((ingredientName) =>
		inventoryNames.some((inventoryName) => inventoryName.includes(ingredientName) || ingredientName.includes(inventoryName))
	).length
}

const recipeIngredientMatches = (recipe: RecipeCard, inventoryNames: string[]) =>
	recipe.ingredients.map((ingredient) => {
		const ingredientName = normalizeText(ingredient.name)
		const inInventory = inventoryNames.some((inventoryName) =>
			inventoryName.includes(ingredientName) || ingredientName.includes(inventoryName)
		)

		return {
			name: ingredient.name,
			icon: pickIngredientIcon(ingredient.name),
			inInventory,
		}
	})

async function getOrCreateDbUser() {
	const { userId } = await auth()
	if (!userId) return null

	const clerkUser = await currentUser()
	const email = clerkUser?.emailAddresses?.[0]?.emailAddress
	if (!email) return null

	let user = await User.findOne({ email })
	if (!user) {
		user = await User.create({
			email,
			name: clerkUser?.fullName || clerkUser?.firstName || undefined,
			image: clerkUser?.imageUrl,
		})
	}

	return user
}

export default async function RecipesPage() {
	const { userId } = await auth()
	if (!userId) redirect('/auth/login')

	const clerkUser = await currentUser()
	const email = clerkUser?.emailAddresses?.[0]?.emailAddress
	if (!email) redirect('/auth/login')

	let inventoryRecords: InventoryRecord[] = []
	let dbRecipes: RecipeCard[] = []

	try {
		const apiItems = await getInventoryFromBackendApi()
		if (apiItems) {
			inventoryRecords = apiItems.map((item: any) => ({
				id: String(item._id || item.id),
				productId: item.productId as InventoryProduct,
			}))
		}
	} catch (error) {
		console.warn('Recipes inventory API load skipped:', error)
	}

	try {
		await connectDB()
		const uri = process.env.MONGODB_URI || ''
		console.log(`[DB Diagnostic] Recipes connecting to: ${uri.substring(0, 15)}...`)
		const dbUser = await getOrCreateDbUser()

		if (dbUser && inventoryRecords.length === 0) {
			const inventoryItems = await InventoryItem.find({ userId: dbUser._id.toString() })
				.populate('productId')
				.lean()

			inventoryRecords = inventoryItems.map((item) => ({
				id: item._id.toString(),
				productId: item.productId as unknown as InventoryProduct,
			}))
		}

		const records = await Recipe.find().lean()
		dbRecipes = records.map((recipe) => ({
			id: recipe._id.toString(),
			title: recipe.title,
			description: recipe.description,
			instructions: recipe.instructions || null,
			ingredients: recipe.ingredients.map((ingredient) => ({ name: ingredient.name })),
			source: 'db' as const,
		}))
	} catch (error) {
		console.warn('Recipes page data load skipped:', error)
	}

	const recipeSource = dbRecipes.length > 0 ? [...dbRecipes, ...CURATED_RECIPES] : CURATED_RECIPES
	const uniqueRecipes = recipeSource.filter(
		(recipe, index, self) => index === self.findIndex((entry) => entry.title.toLowerCase() === recipe.title.toLowerCase())
	)

	const inventoryNames = inventoryRecords
		.map((item) => {
			const product = item.productId
			return normalizeText(typeof product === 'string' ? product : product.name)
		})
		.filter(Boolean)

	const scoredRecipes = uniqueRecipes
		.map((recipe) => {
			const matchCount = recipeMatchCount(recipe, inventoryNames)
			const matchedIngredients = recipeIngredientMatches(recipe, inventoryNames)
			const matchRatio = recipe.ingredients.length > 0 ? matchCount / recipe.ingredients.length : 0

			return {
				...recipe,
				matchCount,
				matchRatio,
				matchedIngredients,
				inventoryHits: matchedIngredients.filter((ingredient) => ingredient.inInventory).length,
				totalIngredients: recipe.ingredients.length,
			}
		})
		.sort((left, right) => {
			if (right.matchCount !== left.matchCount) return right.matchCount - left.matchCount
			if (right.totalIngredients !== left.totalIngredients) return right.totalIngredients - left.totalIngredients
			return left.title.localeCompare(right.title)
		})

	const recommendedRecipes = scoredRecipes.filter((recipe) => recipe.matchRatio > 0.75)
	const remainingRecipes = scoredRecipes.filter((recipe) => recipe.matchRatio <= 0.75)

	const highlightedCount = recommendedRecipes.length > 0 ? recommendedRecipes[0].matchCount : 0

	const toDetailRecipe = (recipe: (typeof scoredRecipes)[number]) => ({
		id: recipe.id,
		title: recipe.title,
		description: recipe.description,
		instructions: recipe.instructions || null,
		ingredients: recipe.ingredients,
		imageSrc: getRecipeImageSrc(recipe),
		source: recipe.source,
		matchCount: recipe.matchCount,
		inventoryHits: recipe.inventoryHits,
		totalIngredients: recipe.totalIngredients,
	})

	return (
		<DashboardLayout>
			<main className="min-h-screen bg-[#F6F1E7] text-black">
				<div className="mx-auto max-w-[1440px] overflow-x-hidden px-0 py-4 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
					<header className="border-4 border-black bg-white p-4 shadow-[12px_12px_0_#000] sm:p-6 lg:p-8">
						<div className="flex flex-wrap items-center gap-3">
							<span className="border-2 border-black bg-[#FFE66D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em]">
								Recipe Gallery
							</span>
							<span className="border-2 border-black bg-[#DDF5E3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em]">
								Inventory Aware
							</span>
						</div>
						<div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
							<div>
								<h1 className="break-words font-noto-serif text-4xl sm:text-5xl leading-[0.92] lg:text-7xl">
									Recipe Gallery
								</h1>
								<p className="mt-4 max-w-3xl font-manrope text-base sm:text-lg leading-7 sm:leading-8 text-black/75">
									Recommended recipes rise to the top when they match what is already in your pantry.
									The rest stay visible below with clear ingredient markers, so you can see what is ready
									to cook and what still needs a few missing items.
								</p>
							</div>

							<div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
								<div className="border-2 border-black bg-[#93E1A8] p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/70">Recommended</p>
									<p className="mt-2 font-noto-serif text-4xl">{recommendedRecipes.length}</p>
									<p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-black/70">Matches your stock</p>
								</div>
								<div className="border-2 border-black bg-[#FFF4CC] p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/70">Inventory</p>
									<p className="mt-2 font-noto-serif text-4xl">{inventoryRecords.length}</p>
									<p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-black/70">Items scanned</p>
								</div>
								<div className="border-2 border-black bg-[#DDE8FF] p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/70">Top match</p>
									<p className="mt-2 font-noto-serif text-4xl">{highlightedCount || '0'}</p>
									<p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-black/70">Ingredients in sync</p>
								</div>
								<div className="border-2 border-black bg-black p-4 text-white">
									<p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Total recipes</p>
									<p className="mt-2 font-noto-serif text-4xl">{scoredRecipes.length}</p>
									<p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/60">Gallery entries</p>
								</div>
							</div>
						</div>
					</header>

					<section className="mt-8 max-w-full overflow-hidden border-4 border-black bg-[#FFFDF7] p-4 shadow-[12px_12px_0_#000] sm:p-6 lg:p-8">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="text-[10px] font-black uppercase tracking-[0.32em] text-black/60">Recommended recipes</p>
								<h2 className="mt-2 font-noto-serif text-3xl lg:text-4xl">Best matches for your inventory</h2>
							</div>
							<div className="border-2 border-black bg-[#FFE66D] px-3 py-2 text-[10px] font-black uppercase tracking-[0.26em]">
								Above 75% match only
							</div>
						</div>

						{recommendedRecipes.length === 0 ? (
							<div className="mt-6 border-2 border-black bg-[#F6F1E7] p-5">
								<p className="font-manrope text-base leading-7 text-black/75">
									No recipe is above the 75% inventory match threshold yet. Add a few more matching items and the recommended section will populate.
								</p>
							</div>
						) : (
							<div className="mt-6 grid gap-6 lg:grid-cols-2">
								{recommendedRecipes.map((recipe) => (
									<article
										key={recipe.id}
										className="group min-w-0 flex flex-col overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0_#000] transition-transform duration-200 hover:-translate-y-1"
									>
										<div className="relative aspect-[16/10] overflow-hidden border-b-4 border-black bg-[#F6F1E7]">
											<Image
												src={getRecipeImageSrc(recipe)}
												alt={recipe.title}
												fill
												sizes="(max-width: 768px) 100vw, 50vw"
												className="object-cover transition-transform duration-500 group-hover:scale-105"
												unoptimized
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />
										</div>
										<div className="flex flex-col gap-3 border-b-4 border-black bg-[#DDF5E3] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
											<div className="min-w-0">
												<p className="text-[10px] font-black uppercase tracking-[0.28em] text-black/60">{recipe.source === 'db' ? 'Verified recipe' : 'Curated recipe'}</p>
												<div className="mt-2 flex items-start gap-2">
													<h3 className="min-w-0 flex-1 break-words font-noto-serif text-2xl sm:text-3xl leading-tight">{recipe.title}</h3>
													<RecipeDetailButton recipe={toDetailRecipe(recipe)} />
												</div>
											</div>
											<div className="border-2 border-black bg-black px-3 py-2 text-center text-white">
												<p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">Match</p>
												<p className="mt-1 font-noto-serif text-3xl">{recipe.matchCount}</p>
											</div>
										</div>

										<div className="min-w-0 p-4 sm:p-5">
											<p className="font-manrope text-sm sm:text-base leading-7 text-black/75">{recipe.description}</p>

											<div className="mt-5 flex flex-wrap gap-2">
												{recipe.matchedIngredients.map((ingredient) => {
													const Icon = ingredient.icon
													return (
														<span
															key={ingredient.name}
															className={`inline-flex items-center gap-2 border-2 border-black px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${ingredient.inInventory ? 'bg-[#93E1A8]' : 'bg-white'}`}
														>
															<Icon className="h-4 w-4" />
															<span className="break-words">{ingredient.name}</span>
															{ingredient.inInventory && <Check className="h-4 w-4" />}
														</span>
													)
												})}
											</div>

											<div className="mt-5 flex flex-wrap items-center gap-3">
												<Link
													href="/inventory"
													className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white transition-transform hover:-translate-y-0.5"
												>
													Check pantry
													<ArrowRight className="h-4 w-4" />
												</Link>
												<span className="border-2 border-black bg-[#FFF4CC] px-3 py-2 text-[10px] font-black uppercase tracking-[0.26em]">
													{recipe.inventoryHits} ingredients already in stock
												</span>
											</div>
										</div>
									</article>
								))}
							</div>
						)}
					</section>

					<section className="mt-10 max-w-full overflow-hidden border-4 border-black bg-black p-4 text-white shadow-[12px_12px_0_#93E1A8] sm:p-6 lg:p-8">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/60">Other recipes</p>
								<h2 className="mt-2 font-noto-serif text-3xl lg:text-4xl">The rest of the gallery</h2>
							</div>
							<div className="border-2 border-white bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-black">
								Still worth opening
							</div>
						</div>

						{remainingRecipes.length === 0 ? (
							<div className="mt-6 border-2 border-white/30 bg-white/5 p-5 text-white/80">
								Every recipe already overlaps with your inventory. The gallery is fully aligned today.
							</div>
						) : (
							<div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
								{remainingRecipes.map((recipe) => (
									<article key={recipe.id} className="min-w-0 border-2 border-white/20 bg-white/5 p-4 sm:p-5 transition-transform hover:-translate-y-1">
										<div className="relative mb-4 aspect-[16/10] overflow-hidden border border-white/20 bg-white/5">
											<Image
													src={getRecipeImageSrc(recipe)}
												alt={recipe.title}
												fill
												sizes="(max-width: 768px) 100vw, 33vw"
												className="object-cover opacity-90 transition-transform duration-500 hover:scale-105"
												unoptimized
											/>
										</div>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">{recipe.source === 'db' ? 'Saved recipe' : 'Curated recipe'}</p>
												<div className="mt-2 flex items-start gap-2">
													<h3 className="min-w-0 flex-1 break-words font-noto-serif text-2xl leading-tight text-white">{recipe.title}</h3>
													<RecipeDetailButton recipe={toDetailRecipe(recipe)} />
												</div>
											</div>
											<span className="border border-white/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
												{recipe.ingredients.length} items
											</span>
										</div>

										<p className="mt-4 text-sm leading-7 text-white/70">{recipe.description}</p>

										<div className="mt-5 flex flex-wrap gap-2">
											{recipe.matchedIngredients.map((ingredient) => {
												const Icon = ingredient.icon
												return (
													<span
														key={ingredient.name}
														className={`inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${ingredient.inInventory ? 'bg-[#93E1A8] text-black' : 'bg-transparent text-white/75'}`}
													>
														<Icon className="h-4 w-4" />
														<span className="break-words">{ingredient.name}</span>
														{ingredient.inInventory ? <Check className="h-4 w-4" /> : <span className="text-white/40">Need</span>}
													</span>
												)
											})}
										</div>
									</article>
								))}
							</div>
						)}
					</section>
				</div>
			</main>
		</DashboardLayout>
	)
}

