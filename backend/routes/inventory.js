const express = require('express');
const { prisma } = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all inventory items
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.user.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const items = await prisma.inventoryItem.findMany({
      where: { userId: user.id },
      include: {
        product: true,
        storageMethod: true,
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    res.json(items);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add inventory item
router.post('/', verifyToken, async (req, res) => {
  try {
    const { productId, storageMethodId, quantity, purchaseDate } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: req.user.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validation
    if (!productId || !storageMethodId || !quantity || !purchaseDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const storageMethod = await prisma.storageMethod.findUnique({
      where: { id: storageMethodId }
    });

    if (!storageMethod) {
      return res.status(404).json({ error: 'Storage method not found' });
    }

    // Get weather data
    let weatherSnapshot = null;
    if (user.city && process.env.WEATHER_API_KEY) {
      try {
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(user.city)}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          weatherSnapshot = await prisma.weatherSnapshot.create({
            data: {
              city: user.city,
              tempC: weatherData.main.temp,
              humidity: weatherData.main.humidity,
              description: weatherData.weather[0].description
            }
          });
        }
      } catch (weatherError) {
        console.error('Weather fetch error:', weatherError);
      }
    }

    // Create inventory item
    const newItem = await prisma.inventoryItem.create({
      data: {
        userId: user.id,
        productId,
        storageMethodId,
        quantity: parseInt(quantity),
        purchaseDate: new Date(purchaseDate),
        currentFreshnessScore: 5
      },
      include: {
        product: true,
        storageMethod: true
      }
    });

    // Get shelf life for prediction
    const categoryStorage = await prisma.categoryStorageLife.findFirst({
      where: {
        categoryId: product.categoryId,
        storageMethodId
      }
    });

    let shelfLifeDays = product.defaultShelfLifeDays || 7;
    if (categoryStorage) {
      shelfLifeDays = categoryStorage.shelfLifeDays;
    }

    // Create initial prediction
    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);

    await prisma.prediction.create({
      data: {
        inventoryItemId: newItem.id,
        predictedExpiryDate: expiryDate,
        confidenceScore: 0.85,
        modelVersion: '1.0',
        weatherSnapshotId: weatherSnapshot?.id
      }
    });

    // Fetch complete item with predictions
    const completeItem = await prisma.inventoryItem.findUnique({
      where: { id: newItem.id },
      include: {
        product: true,
        storageMethod: true,
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    res.status(201).json(completeItem);
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// Update inventory item
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, currentFreshnessScore } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: req.user.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id }
    });

    if (!item || item.userId !== user.id) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (currentFreshnessScore !== undefined) {
      updateData.currentFreshnessScore = parseInt(currentFreshnessScore);
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        storageMethod: true,
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete inventory item
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { email: req.user.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id }
    });

    if (!item || item.userId !== user.id) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
