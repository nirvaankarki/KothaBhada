import mongoose from 'mongoose';
import { Booking } from '../../models/bookingModel.js';
import { Inquiry } from '../../models/inquiryModel.js';
import { Chat } from '../../models/chatModel.js';
import { Room } from '../../models/roomModel.js';
import { User } from '../../models/userModel.js';
import { ViewHistory } from '../../models/viewHistoryModel.js';
import { Report } from '../../models/reportModel.js';

function cleanText(value) {
  return String(value || '').trim();
}

function formatDayLabel(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export async function getAdminBookingOversight(req, res) {
  try {
    const status = cleanText(req.query?.status).toLowerCase();
    const search = cleanText(req.query?.search);
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit) || 120));

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { title: regex },
        { fullName: regex },
        { email: regex },
        { location: regex },
        { ownerName: regex },
      ];
    }

    const [bookings, statusCounts] = await Promise.all([
      Booking.find(filter)
        .populate('userId', 'name email role')
        .populate('ownerId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const summary = statusCounts.reduce((acc, row) => {
      acc[String(row._id || 'pending')] = Number(row.count || 0);
      return acc;
    }, {
      pending: 0,
      confirmed: 0,
      declined: 0,
      cancelled: 0,
    });

    return res.status(200).json({
      bookings,
      summary,
      meta: {
        count: bookings.length,
        limit,
        status: status || 'all',
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load booking oversight',
      error: error.message,
    });
  }
}

export async function getAdminConversionMetrics(req, res) {
  try {
    const [totalInquiries, respondedInquiries, totalBookings, confirmedBookings] = await Promise.all([
      Inquiry.countDocuments({}),
      Inquiry.countDocuments({ status: { $in: ['responded', 'closed'] } }),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'confirmed' }),
    ]);

    const inquiryToBookingRate = totalInquiries > 0 ? (totalBookings / totalInquiries) * 100 : 0;
    const bookingConfirmationRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

    return res.status(200).json({
      metrics: {
        totalInquiries,
        respondedInquiries,
        totalBookings,
        confirmedBookings,
        inquiryToBookingRate: Number(inquiryToBookingRate.toFixed(2)),
        bookingConfirmationRate: Number(bookingConfirmationRate.toFixed(2)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load conversion metrics',
      error: error.message,
    });
  }
}

export async function getAdminChatOversight(req, res) {
  try {
    const lookbackDays = Math.max(1, Math.min(90, Number(req.query?.days) || 14));
    const sinceDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const [messageRows, conversationCount, flaggedCount] = await Promise.all([
      Chat.aggregate([
        { $unwind: '$messages' },
        { $match: { 'messages.sentAt': { $gte: sinceDate } } },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$messages.sentAt' } },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.day': 1 } },
      ]),
      Chat.countDocuments({ lastMessageAt: { $gte: sinceDate } }),
      Chat.aggregate([
        { $unwind: '$messages' },
        {
          $match: {
            'messages.sentAt': { $gte: sinceDate },
            'messages.text': {
              $regex: '(\\+?\\d[\\d\\s-]{7,}|@|whatsapp|telegram|viber|call me)',
              $options: 'i',
            },
          },
        },
        { $count: 'count' },
      ]).then((rows) => Number(rows?.[0]?.count || 0)),
    ]);

    const volume = messageRows.map((row) => ({
      day: row?._id?.day,
      messages: Number(row?.count || 0),
    }));

    return res.status(200).json({
      oversight: {
        lookbackDays,
        activeConversations: conversationCount,
        flaggedMessages: flaggedCount,
        messageVolume: volume,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load chat oversight metrics',
      error: error.message,
    });
  }
}

export async function getAdminMarketplaceInsights(req, res) {
  try {
    const [supplyRows, demandRows, recentUsers, recentListings, activeUsers30d, renterHistoryRows] = await Promise.all([
      Room.aggregate([
        { $group: { _id: { $ifNull: ['$location', 'Unknown'] }, listings: { $sum: 1 } } },
        { $sort: { listings: -1 } },
        { $limit: 30 },
      ]),
      ViewHistory.aggregate([
        { $group: { _id: { $ifNull: ['$location', 'Unknown'] }, views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 30 },
      ]),
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            role: { $in: ['user', 'landlord'] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Room.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ViewHistory.distinct('userId', { viewedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }).then((ids) => ids.length),
      ViewHistory.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDoc',
          },
        },
        { $unwind: '$userDoc' },
        { $match: { 'userDoc.role': 'user' } },
        {
          $group: {
            _id: '$userId',
            visitCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const demandMap = new Map(demandRows.map((row) => [String(row._id), Number(row.views || 0)]));
    const heatmap = supplyRows.map((row) => {
      const location = String(row._id || 'Unknown');
      return {
        location,
        listings: Number(row.listings || 0),
        demandViews: demandMap.get(location) || 0,
      };
    });

    const retainedRenters = renterHistoryRows.filter((row) => Number(row.visitCount || 0) > 1).length;
    const totalRentersWithVisits = renterHistoryRows.length;
    const retentionRate = totalRentersWithVisits > 0 ? (retainedRenters / totalRentersWithVisits) * 100 : 0;

    return res.status(200).json({
      insights: {
        supplyDemandHeatmap: heatmap,
        growth: {
          userSignupsByDay: recentUsers.map((row) => ({ day: row._id, count: Number(row.count || 0) })),
          listingGrowthByDay: recentListings.map((row) => ({ day: row._id, count: Number(row.count || 0) })),
          activeUsers30d,
        },
        retention: {
          retainedRenters,
          totalRentersWithVisits,
          renterReturnRate: Number(retentionRate.toFixed(2)),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load marketplace insights',
      error: error.message,
    });
  }
}

export async function getAdminReportDisputeContext(req, res) {
  try {
    const { reportId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(reportId || ''))) {
      return res.status(400).json({ message: 'Invalid report id' });
    }

    const report = await Report.findById(reportId)
      .populate('reporterId', 'name email role')
      .populate('targetOwnerId', 'name email role')
      .populate('targetListingId', 'title location')
      .lean();

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const reporterId = report?.reporterId?._id || report?.reporterId;
    const ownerId = report?.targetOwnerId?._id || report?.targetOwnerId;
    const listingIdString = report?.targetListingId?._id
      ? String(report.targetListingId._id)
      : cleanText(report?.targetId);

    const chatFilter = {
      listingId: listingIdString,
    };

    if (mongoose.Types.ObjectId.isValid(String(reporterId || ''))) {
      chatFilter.userId = reporterId;
    }
    if (mongoose.Types.ObjectId.isValid(String(ownerId || ''))) {
      chatFilter.ownerId = ownerId;
    }

    const [chats, bookings, inquiries] = await Promise.all([
      Chat.find(chatFilter)
        .populate('userId', 'name email')
        .populate('ownerId', 'name email')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Booking.find({ listingId: listingIdString })
        .populate('userId', 'name email')
        .populate('ownerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Inquiry.find({ listingId: listingIdString })
        .populate('userId', 'name email')
        .populate('ownerId', 'name email')
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
    ]);

    return res.status(200).json({
      report,
      disputeContext: {
        chats,
        bookings,
        inquiries,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load dispute context',
      error: error.message,
    });
  }
}
