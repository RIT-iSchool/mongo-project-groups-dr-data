// Task 7: serves images stored in GridFS to the browser
// Route: GET /api/images/:id
// The frontend calls this with a GridFS file ID to display the image

const express = require('express');
const router = express.Router();
const { ObjectId, GridFSBucket } = require('mongodb');
const { getDB } = require('../db/connection');

// GET /api/images/:id
// Streams an image from GridFS directly to the browser response
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    // Convert the string ID from the URL into a MongoDB ObjectId
    let fileId;
    try {
      fileId = new ObjectId(req.params.id);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid image ID format' });
    }

    // Look up the file metadata to get the correct content type
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const file = files[0];
    const filename = file.filename.toLowerCase();

    // Set the correct Content Type header based on file extension
    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (filename.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    } else if (filename.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    } else {
      res.set('Content-Type', 'application/octet-stream');
    }

    // Stream the image bytes from GridFS directly to the HTTP response
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);

    downloadStream.on('error', () => {
      res.status(500).json({ error: 'Error streaming image' });
    });

  } catch (err) {
    console.error('Image route error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;