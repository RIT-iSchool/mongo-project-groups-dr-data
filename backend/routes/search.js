// juan task 2 and chris task 3

const express = require('express');
const router = express.Router();
const { getDB } = require('../db/connection');

// TASK 3: Geospatial Search Endpoint - Search endpoint with geospatial query
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { lat, lng, radius } = req.query;
    let query = {};

    if (lat && lng) {
        query.location = {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                $maxDistance: parseFloat(radius) || 5000 // Default to 5km if radius not provided
            }
        }
    }
    const trials = await db.collection('trials').find(query).toArray();
    res.status(200).json(trials);

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;