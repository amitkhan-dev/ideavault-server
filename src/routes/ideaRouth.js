import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// POST: Create a new startup idea
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const newIdea = req.body;

    // Basic Validation
    if (!newIdea.title || !newIdea.category || !newIdea.shortDescription) {
      return sendError(
        res,
        400,
        'Title, category, and short description are required fields'
      );
    }

    const ideaData = {
      ...newIdea,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection('ideas').insertOne(ideaData);

    sendSuccess(res, 201, 'Idea created successfully', {
      _id: result.insertedId,
      ...ideaData,
    });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});


export default router;