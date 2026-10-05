import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// 1. GET: Fetch all comments for a specific idea
router.get('/idea/:ideaId', async (req, res) => {
  try {
    const db = getDb();
    const { ideaId } = req.params;

    const comments = await db
      .collection('comments')
      .find({ ideaId: ideaId })
      .sort({ createdAt: -1 })
      .toArray();

    sendSuccess(res, 200, 'Comments fetched successfully', comments);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// 2. GET: Fetch all comments created by a specific user
router.get('/user/:email', async (req, res) => {
  try {
    const db = getDb();
    const { email } = req.params;

    const comments = await db
      .collection('comments')
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    sendSuccess(res, 200, 'User comments fetched successfully', comments);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// 3. POST: Add a new comment (With Idea details for My-Interactions)
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { ideaId, userName, userEmail, commentText } = req.body;

    if (!ideaId || !commentText || !userName) {
      return sendError(res, 400, 'Idea ID, user name, and comment text are required');
    }

    // ideas collection to filter
    const ideaFilter = ObjectId.isValid(ideaId)
      ? { $or: [{ _id: new ObjectId(ideaId) }, { _id: ideaId }] }
      : { _id: ideaId };

    const idea = await db.collection('ideas').findOne(ideaFilter);

    const newComment = {
      ideaId,
      ideaTitle: idea?.title || 'Untitled Idea',
      category: idea?.category || 'General',
      userName,
      userEmail: userEmail || 'anonymous@example.com',
      commentText,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection('comments').insertOne(newComment);

    sendSuccess(res, 201, 'Comment added successfully', {
      _id: result.insertedId,
      ...newComment,
    });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// 4. PUT: Edit / Update an existing comment
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { commentText } = req.body;

    if (!commentText) {
      return sendError(res, 400, 'Updated comment text is required');
    }

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const result = await db.collection('comments').updateOne(filter, {
      $set: {
        commentText,
        updatedAt: new Date().toISOString(),
      },
    });

    if (result.matchedCount === 0) {
      return sendError(res, 404, 'Comment not found');
    }

    sendSuccess(res, 200, 'Comment updated successfully', { commentText });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// 5. DELETE: Delete a comment
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const result = await db.collection('comments').deleteOne(filter);

    if (result.deletedCount === 0) {
      return sendError(res, 404, 'Comment not found');
    }

    sendSuccess(res, 200, 'Comment deleted successfully', { id });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

export default router;