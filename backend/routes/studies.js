const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB, STUDIES_COLLECTION } = require('../db/connection');

function parseObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const studyId = parseObjectId(req.params.id);

    if (!studyId) {
      return res.status(400).json({ error: 'Invalid study ID format' });
    }

    const study = await db.collection(STUDIES_COLLECTION).findOne({ _id: studyId });

    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    return res.status(200).json(study);
  } catch (error) {
    console.error('Study detail route error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/:id/comment', async (req, res) => {
  try {
    const db = getDB();
    const studyId = parseObjectId(req.params.id);
    const author = (req.body?.author || 'Anonymous').toString().trim() || 'Anonymous';
    const text = (req.body?.text || '').toString().trim();

    if (!studyId) {
      return res.status(400).json({ error: 'Invalid study ID format' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = {
      author,
      text,
      date: new Date(),
    };

    const result = await db.collection(STUDIES_COLLECTION).findOneAndUpdate(
      { _id: studyId },
      { $push: { comments: comment } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Study not found' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Study comment route error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
