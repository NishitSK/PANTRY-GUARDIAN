import { addDays } from 'date-fns'

type Inputs = {
  baseShelfLifeDays: number
  roomTempShelfLifeDays?: number | null
  fridgeShelfLifeDays?: number | null
  freezerShelfLifeDays?: number | null
  storageMethodName: string
  tempMinC: number
  tempMaxC: number
  humidityPreferred: number
  tempC: number
  humidity: number
  purchasedAt: Date
  openedAt?: Date | null
}

export function predict(inputs: Inputs) {
  const { 
    baseShelfLifeDays, 
    roomTempShelfLifeDays, 
    fridgeShelfLifeDays, 
    freezerShelfLifeDays,
    storageMethodName,
    tempMinC, 
    tempMaxC, 
    humidityPreferred, 
    tempC, 
    humidity, 
    purchasedAt, 
    openedAt 
  } = inputs
  
  let days = baseShelfLifeDays
  const methodLower = storageMethodName.toLowerCase()
  
  if (methodLower.includes('room') && roomTempShelfLifeDays) {
    days = roomTempShelfLifeDays
  } else if (methodLower.includes('fridge') && fridgeShelfLifeDays) {
    days = fridgeShelfLifeDays
  } else if (methodLower.includes('freezer') && freezerShelfLifeDays) {
    days = freezerShelfLifeDays
  }
  let penalty = 0

  if (tempC < tempMinC) {
    const diff = tempMinC - tempC
    penalty += Math.min(0.5, 0.03 * diff)
  } else if (tempC > tempMaxC) {
    const diff = tempC - tempMaxC
    penalty += Math.min(0.5, 0.03 * diff)
  }

  const humidityDiff = Math.abs(humidity - humidityPreferred)
  penalty += Math.min(0.2, 0.003 * humidityDiff)

  if (openedAt) penalty += 0.25

  const effective = Math.max(0, days * (1 - penalty))
  const predictedExpiry = addDays(purchasedAt, Math.round(effective))

  let confidence = 0.8 - penalty
  confidence = Math.max(0.5, Math.min(0.9, confidence))

  return { predictedExpiry, confidence, modelVersion: 'rb-1.1' }
}
