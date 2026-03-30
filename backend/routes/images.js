// Task 7: serves images stored in GridFS to the browser
// Route: GET /api/images/:id
// The frontend calls this with a GridFS file ID to display the image

const express = require('express');
const router = express.Router();
const { ObjectId, GridFSBucket } = require('mongodb');
const { getDB } = require('../db/connection');

const DEFAULT_IMAGE_FILENAME = 'Caduceus.svg';

async function streamImageByFilter(res, filter) {
  const db = getDB();
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  const files = await bucket.find(filter).toArray();

  if (!files || files.length === 0) {
    return false;
  }

  const file = files[0];
  const filename = file.filename.toLowerCase();

  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    res.set('Content-Type', 'image/jpeg');
  } else if (filename.endsWith('.png')) {
    res.set('Content-Type', 'image/png');
  } else if (filename.endsWith('.svg')) {
    res.set('Content-Type', 'image/svg+xml');
  } else {
    res.set('Content-Type', 'application/octet-stream');
  }

  const downloadStream = bucket.openDownloadStream(file._id);
  downloadStream.pipe(res);

  return new Promise((resolve, reject) => {
    downloadStream.on('end', () => resolve(true));
    downloadStream.on('error', reject);
  });
}

router.get('/default', async (req, res) => {
  try {
    const found = await streamImageByFilter(res, { filename: DEFAULT_IMAGE_FILENAME });

    if (!found) {
      return res.status(404).json({ error: 'Default image not found' });
    }
  } catch (err) {
    console.error('Default image route error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// GET /api/images/:id
// Streams an image from GridFS directly to the browser response
router.get('/:id', async (req, res) => {
  try {
    // Convert the string ID from the URL into a MongoDB ObjectId
    let fileId;
    try {
      fileId = new ObjectId(req.params.id);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid image ID format' });
    }

    const found = await streamImageByFilter(res, { _id: fileId });
    if (!found) {
      return res.status(404).json({ error: 'Image not found' });
    }
  } catch (err) {
    console.error('Image route error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

module.exports = router;
