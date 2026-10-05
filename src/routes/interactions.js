import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();

// POST: Add or Remove Interaction (Toggle Upvote / Bookmark)
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { ideaId, userEmail, type } = req.body;

    if (!ideaId || !userEmail || !type) {
      return sendError(res, 400, 'ideaId, userEmail, and type (upvoted/bookmarked) are required');
    }

    const filter = { ideaId, userEmail, type };
    const existing = await db.collection('interactions').findOne(filter);

    if (existing) {
      // আগেই থাকলে ডিলিট (Toggle behavior)
      await db.collection('interactions').deleteOne({ _id: existing._id });
      return sendSuccess(res, 200, 'Interaction removed successfully', { action: 'removed' });
    }

    // নতুন ইন্টারঅ্যাকশন সেভ
    const newInteraction = {
      ideaId,
      userEmail,
      type, // 'upvoted' অথবা 'bookmarks'
      createdAt: new Date().toISOString()
    };

    const result = await db.collection('interactions').insertOne(newInteraction);
    sendSuccess(res, 201, 'Interaction saved successfully', {
      _id: result.insertedId,
      ...newInteraction,
      action: 'added'
    });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// GET: Fetch Interactions with Idea details ($lookup aggregation)
router.get('/:type', async (req, res) => {
  try {
    const db = getDb();
    const { type } = req.params; // 'upvoted' or 'bookmarks'
    const { email } = req.query;

    if (!email) {
      return sendError(res, 400, 'User email query parameter is required');
    }

    // MongoDB Aggregation দিয়ে ideas collection-এর সাথে Join করা
    const interactions = await db.collection('interactions').aggregate([
      {
        $match: {
          userEmail: email,
          type: type
        }
      },
      {
        $addFields: {
          convertedIdeaId: {
            $cond: {
              if: { $eq: [{ $strLenCP: "$ideaId" }, 24] },
              then: { $toObjectId: "$ideaId" },
              else: "$ideaId"
            }
          }
        }
      },
      {
        $lookup: {
          from: 'ideas',
          localField: 'convertedIdeaId',
          foreignField: '_id',
          as: 'ideaDetails'
        }
      },
      {
        $unwind: {
          path: '$ideaDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          type: 1,
          userEmail: 1,
          createdAt: 1,
          ideaId: '$ideaDetails' // ফ্রন্টএন্ডের সুবিধার জন্য ideaId তে ফুল অবজেক্ট রাখা
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    sendSuccess(res, 200, `${type} interactions fetched successfully`, interactions);
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// DELETE: Remove Single Interaction by ID (For My Interactions Page)
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { _id: id };
    }

    const result = await db.collection('interactions').deleteOne(query);

    if (result.deletedCount === 0) {
      return sendError(res, 404, 'Interaction not found or already deleted');
    }

    sendSuccess(res, 200, 'Interaction removed successfully');
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

export default router;