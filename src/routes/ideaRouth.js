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

// GET: All Ideas
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const ideas = await db.collection('ideas').find().toArray();
    sendSuccess(res, 200, 'Ideas fetched successfully', ideas);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// GET: Trending Ideas (Limit 6)
router.get('/trending', async (req, res) => {
  try {
    const db = getDb();
    const trending = await db
      .collection('ideas')
      .find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    sendSuccess(res, 200, 'Trending ideas fetched successfully', trending);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// GET: Top Contributors (Limit 3) - MUST be placed before /:id route
router.get('/top-contributors', async (req, res) => {
  try {
    const db = getDb();

    const topContributors = await db
      .collection('ideas')
      .aggregate([
        {
          $group: {
            _id: '$authorEmail',
            authorName: { $first: '$authorName' },
            authorEmail: { $first: '$authorEmail' },
            ideasCount: { $sum: 1 },
            totalUpvotes: {
              $sum: {
                $cond: [
                  { $gt: ['$upvotes', null] },
                  '$upvotes',
                  0,
                ],
              },
            },
          },
        },
        {
          $match: {
            _id: { $ne: null },
          },
        },
        {
          $sort: { ideasCount: -1, totalUpvotes: -1 },
        },
        {
          $limit: 3,
        },
        {
          $project: {
            _id: 1,
            name: { $ifNull: ['$authorName', 'Anonymous Innovator'] },
            email: '$authorEmail',
            ideasCount: 1,
            totalUpvotes: 1,
            role: 'Idea Builder',
          },
        },
      ])
      .toArray();

    sendSuccess(
      res,
      200,
      'Top contributors fetched successfully',
      topContributors
    );
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// GET: Ideas posted by a specific user (For My Ideas page)
router.get('/user/:email', async (req, res) => {
  try {
    const db = getDb();
    const { email } = req.params;
    const userIdeas = await db
      .collection('ideas')
      .find({ authorEmail: email })
      .toArray();

    sendSuccess(res, 200, 'User ideas fetched successfully', userIdeas);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// GET: Single Idea by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    console.log('Requested ID:', id);

    let idea = null;

    if (ObjectId.isValid(id)) {
      idea = await db.collection('ideas').findOne({
        _id: new ObjectId(id),
      });
    }

    if (!idea) {
      idea = await db.collection('ideas').findOne({
        _id: id,
      });
    }

    if (!idea) {
      return sendError(res, 404, 'Idea not found');
    }

    sendSuccess(res, 200, 'Idea details fetched successfully', idea);
  } catch (error) {
    console.error('Get single idea error:', error);
    sendError(res, 500, error.message);
  }
});

// PUT: Update Idea by ID (For Edit Idea page)
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Idea ID format');
    }

    delete updateData._id;

    const result = await db.collection('ideas').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return sendError(res, 404, 'Idea not found');
    }

    sendSuccess(res, 200, 'Idea updated successfully');
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// DELETE: Delete Idea by ID
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Idea ID format');
    }

    const result = await db
      .collection('ideas')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return sendError(res, 404, 'Idea not found or already deleted');
    }

    sendSuccess(res, 200, 'Idea deleted successfully');
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

export default router;