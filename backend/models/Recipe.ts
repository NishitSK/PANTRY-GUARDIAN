import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRecipeIngredient {
    name: string
}

export interface IRecipe extends Document {
    title: string
    description: string
    instructions?: string
    ingredients: IRecipeIngredient[]
    createdAt: Date
    updatedAt: Date
}

const RecipeIngredientSchema = new Schema<IRecipeIngredient>(
    {
        name: {
            type: String,
            required: true,
        },
    },
    {
        _id: false, // Don't create separate IDs for embedded documents
    }
)

const RecipeSchema = new Schema<IRecipe>(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        instructions: {
            type: String,
        },
        ingredients: {
            type: [RecipeIngredientSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
)

const Recipe: Model<IRecipe> =
    mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema)

export default Recipe
