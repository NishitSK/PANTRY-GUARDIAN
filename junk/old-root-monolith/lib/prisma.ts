import connectDB from './mongodb'
import { Product } from '@/models'

type ProductSelect = {
  id?: boolean
  name?: boolean
  category?: boolean
}

type FindManyArgs = {
  select?: ProductSelect
}

function selectProductFields(product: any, select?: ProductSelect) {
  if (!select) {
    return {
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      baseShelfLifeDays: product.baseShelfLifeDays,
      roomTempShelfLifeDays: product.roomTempShelfLifeDays ?? null,
      fridgeShelfLifeDays: product.fridgeShelfLifeDays ?? null,
      freezerShelfLifeDays: product.freezerShelfLifeDays ?? null,
      storageNotes: product.storageNotes ?? null,
      defaultStorageMethodId: product.defaultStorageMethodId,
    }
  }

  const result: Record<string, unknown> = {}

  if (select.id) {
    result.id = product._id.toString()
  }
  if (select.name) {
    result.name = product.name
  }
  if (select.category) {
    result.category = product.category
  }

  return result
}

export const prisma = {
  product: {
    async findMany(args: FindManyArgs = {}) {
      await connectDB()
      const products = await Product.find().lean()
      return products.map((product: any) => selectProductFields(product, args.select))
    },
  },
}
