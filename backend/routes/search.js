const express = require('express');
const router = express.Router();
const { getDB, STUDIES_COLLECTION } = require('../db/connection');

const SEARCH_FIELDS = [
  'Study_Title',
  'Brief_Title',
  'Brief_Summary',
  'Detailed_Description',
  'Conditions',
  'Interventions',
  'Lead_Sponsor_Name',
  'NCT_Number',
];

function buildKeywordQuery(term) {
  if (!term || !term.trim()) {
    return null;
  }

  const regex = new RegExp(term.trim(), 'i');
  return {
    $or: SEARCH_FIELDS.map((field) => ({ [field]: regex })),
  };
}

function buildGeoQuery(lat, lng, radiusMiles) {
  const latitude = Number.parseFloat(lat);
  const longitude = Number.parseFloat(lng);
  const miles = Number.parseFloat(radiusMiles);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const maxDistanceMeters = Number.isFinite(miles) && miles > 0
    ? miles * 1609.34
    : 5 * 1609.34;

  return {
    location_geo: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  };
}

async function runSearch(req, res, { requireGeo }) {
  try {
    const db = getDB();
    const { q = '', lat, lng, radius } = req.query;
    const filters = [];

    const keywordQuery = buildKeywordQuery(q);
    if (keywordQuery) {
      filters.push(keywordQuery);
    }

    const geoQuery = buildGeoQuery(lat, lng, radius);
    if (geoQuery) {
      filters.push(geoQuery);
    } else if (requireGeo) {
      return res.status(400).json({ error: 'lat, lng, and radius must be valid numbers.' });
    }

    const query = filters.length === 0 ? {} : filters.length === 1 ? filters[0] : { $and: filters };
    const studies = await db
      .collection(STUDIES_COLLECTION)
      .find(query)
      .limit(250)
      .toArray();

    return res.status(200).json(studies);
  } catch (error) {
    console.error('Search route error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

router.get('/', async (req, res) => {
  return runSearch(req, res, { requireGeo: false });
});

router.get('/geo', async (req, res) => {
  return runSearch(req, res, { requireGeo: true });
});

module.exports = router;
