const express = require('express');
const { prisma } = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const { name, city } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: req.user.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (city !== undefined) updateData.city = city;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        createdAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
