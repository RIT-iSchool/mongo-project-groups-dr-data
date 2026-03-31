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
    
    // Will only select the fields needed for the search results - Task 2 
    const studies = await db
      .collection(STUDIES_COLLECTION)
      .find(query, {
        projection: {
          Study_Title: 1,
          Brief_Title: 1,
          Brief_Summary: 1,
          Detailed_Description: 1,
          Primary_Outcome_Measures: 1,
          Conditions: 1,
          Lead_Sponsor_Name: 1,
          NCT_Number: 1,
          Phases: 1,
          Overall_Status: 1,
          'Study Status': 1,
          Locations: 1,
          location_label: 1,
        }
      })
      .limit(250)
      .toArray();

    // This will create a snippet and send the fields needed to the frontend - Task 2 
    const summary = studies.map((doc) => {
      const brief = doc.Primary_Outcome_Measures
        || doc.Brief_Summary
        || doc.Detailed_Description
        || doc.Brief_Title
        || '';
      const status = doc.Overall_Status || doc['Study Status'] || '';
      const location = doc.location_label || doc.Locations || '';

      return {
        // Did what Result.jsx was doing before 
        _id: doc._id,
        title: doc.Study_Title || doc.Brief_Title,
        condition: doc.Conditions || '',
        sponsor: doc.Lead_Sponsor_Name || '',
        snippet: brief.length > 200 ? brief.slice(0, 200) + '…' : brief,
        location,
        nctId: doc.NCT_Number || '',
        phase: doc.Phases || 'Phase Unknown',
        status,
        Study_Title: doc.Study_Title,
        Brief_Title: doc.Brief_Title,
        Conditions: doc.Conditions || '',
        Lead_Sponsor_Name: doc.Lead_Sponsor_Name || '',
        NCT_Number: doc.NCT_Number || '',
        Phases: doc.Phases || 'Phase Unknown',
        Overall_Status: status,
        location_label: location,
      };
    });

    return res.status(200).json(summary);
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
