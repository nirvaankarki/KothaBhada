import { AiChatHistory } from '../../models/aiChatHistoryModel.js';

export async function getAdminChatbotInsights(req, res) {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query?.limit) || 10));

    const rows = await AiChatHistory.aggregate([
      { $unwind: '$messages' },
      { $match: { 'messages.senderType': 'user' } },
      { $sort: { 'messages.sentAt': -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          question: '$messages.text',
          askedAt: '$messages.sentAt',
          userName: { $ifNull: [{ $arrayElemAt: ['$user.name', 0] }, 'User'] },
          userEmail: { $ifNull: [{ $arrayElemAt: ['$user.email', 0] }, ''] },
        },
      },
    ]);

    return res.status(200).json({
      questions: rows,
      meta: {
        count: rows.length,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load chatbot insights',
      error: error.message,
    });
  }
}
