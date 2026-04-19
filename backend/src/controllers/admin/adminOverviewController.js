import { User } from '../../models/userModel.js';
import { Room } from '../../models/roomModel.js';
import { Booking } from '../../models/bookingModel.js';
import { Inquiry } from '../../models/inquiryModel.js';
import { Report } from '../../models/reportModel.js';
import { Chat } from '../../models/chatModel.js';

function toStatusMap(rows = []) {
  return new Map(rows.map((row) => [String(row?._id || '').toLowerCase(), Number(row?.count || 0)]));
}

function ratioPercent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((Number(numerator || 0) / Number(denominator || 0)) * 100).toFixed(2));
}

function buildDateBuckets(totalDays) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const days = [];
  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    const current = new Date(end);
    current.setDate(end.getDate() - offset);
    days.push(current.toISOString().slice(0, 10));
  }

  return days;
}

function toDailyMap(rows = []) {
  return new Map(rows.map((row) => [String(row?._id?.day || ''), Number(row?.count || 0)]));
}

export async function getAdminOverview(req, res) {
  try {
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      managedUsers,
      renters,
      landlords,
      admins,
      moderators,
      suspendedUsers,
      shadowBannedUsers,
      bannedUsers,
      totalListings,
      activeListings,
      pendingListings,
      approvedListings,
      rejectedListings,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalInquiries,
      openInquiries,
      totalReports,
      openReports,
      inReviewReports,
      pending3dModels,
      totalChats,
      activeChats,
      chatMessages,
      renterActiveLast30d,
      landlordActiveLast30d,
      renterEmailVerified,
      landlordVerified,
      landlordKycPending,
      renterBookingStatuses,
      landlordBookingStatuses,
      renterInquiryStatuses,
      landlordInquiryStatuses,
      renterReportStatuses,
      landlordReportStatuses,
      renterSignups30d,
      landlordSignups30d,
      renterBookings30d,
      landlordListings30d,
      topLandlords,
      topRenters,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['user', 'landlord'] } }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'landlord' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'moderator' }),
      User.countDocuments({ role: { $in: ['user', 'landlord'] }, accountStatus: 'suspended' }),
      User.countDocuments({ role: { $in: ['user', 'landlord'] }, accountStatus: 'shadow_banned' }),
      User.countDocuments({ role: { $in: ['user', 'landlord'] }, accountStatus: 'banned' }),
      Room.countDocuments({}),
      Room.countDocuments({
        status: 'active',
        $or: [
          { moderationStatus: 'approved' },
          { moderationStatus: { $exists: false } },
        ],
      }),
      Room.countDocuments({ moderationStatus: 'pending' }),
      Room.countDocuments({
        $or: [
          { moderationStatus: 'approved' },
          { moderationStatus: { $exists: false } },
        ],
      }),
      Room.countDocuments({ moderationStatus: 'rejected' }),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Inquiry.countDocuments({}),
      Inquiry.countDocuments({ status: 'open' }),
      Report.countDocuments({}),
      Report.countDocuments({ status: 'open' }),
      Report.countDocuments({ status: 'in_review' }),
      Room.countDocuments({
        moderationStatus: 'pending',
        model3dUrl: { $exists: true, $type: 'string', $ne: '' },
      }),
      Chat.countDocuments({}),
      Chat.countDocuments({ status: 'active' }),
      Chat.aggregate([{ $unwind: '$messages' }, { $count: 'count' }]).then((rows) => Number(rows?.[0]?.count || 0)),
      User.countDocuments({
        role: 'user',
        accountStatus: 'active',
        lastLoginAt: { $gte: thirtyDaysAgo },
      }),
      User.countDocuments({
        role: 'landlord',
        accountStatus: 'active',
        lastLoginAt: { $gte: thirtyDaysAgo },
      }),
      User.countDocuments({ role: 'user', isEmailVerified: true }),
      User.countDocuments({ role: 'landlord', isLandlordVerified: true }),
      User.countDocuments({ role: 'landlord', landlordKycStatus: 'pending' }),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { ownerId: { $ne: null } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Inquiry.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Inquiry.aggregate([
        { $match: { ownerId: { $ne: null } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { reporterRole: 'user' } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { targetOwnerId: { $ne: null } } },
        {
          $lookup: {
            from: 'users',
            localField: 'targetOwnerId',
            foreignField: '_id',
            as: 'ownerDoc',
          },
        },
        { $unwind: '$ownerDoc' },
        { $match: { 'ownerDoc.role': 'landlord' } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        {
          $match: {
            role: 'user',
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        {
          $match: {
            role: 'landlord',
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
            count: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
            count: { $sum: 1 },
          },
        },
      ]),
      Room.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
            count: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        { $match: { ownerId: { $ne: null } } },
        {
          $group: {
            _id: '$ownerId',
            totalBookings: { $sum: 1 },
            confirmedBookings: {
              $sum: {
                $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0],
              },
            },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { confirmedBookings: -1, totalBookings: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDoc',
          },
        },
        { $unwind: '$userDoc' },
        { $match: { 'userDoc.role': 'landlord' } },
        {
          $lookup: {
            from: 'rooms',
            let: { ownerId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$ownerId', '$$ownerId'] } } },
              {
                $group: {
                  _id: null,
                  totalListings: { $sum: 1 },
                  activeListings: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
                    },
                  },
                },
              },
            ],
            as: 'listingStats',
          },
        },
        {
          $project: {
            _id: 1,
            name: '$userDoc.name',
            email: '$userDoc.email',
            totalBookings: 1,
            confirmedBookings: 1,
            totalListings: {
              $ifNull: [{ $arrayElemAt: ['$listingStats.totalListings', 0] }, 0],
            },
            activeListings: {
              $ifNull: [{ $arrayElemAt: ['$listingStats.activeListings', 0] }, 0],
            },
          },
        },
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: '$userId',
            totalBookings: { $sum: 1 },
            confirmedBookings: {
              $sum: {
                $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0],
              },
            },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { confirmedBookings: -1, totalBookings: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDoc',
          },
        },
        { $unwind: '$userDoc' },
        { $match: { 'userDoc.role': 'user' } },
        {
          $lookup: {
            from: 'inquiries',
            let: { renterId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$userId', '$$renterId'] } } },
              { $group: { _id: null, totalInquiries: { $sum: 1 } } },
            ],
            as: 'inquiryStats',
          },
        },
        {
          $project: {
            _id: 1,
            name: '$userDoc.name',
            email: '$userDoc.email',
            totalBookings: 1,
            confirmedBookings: 1,
            totalInquiries: {
              $ifNull: [{ $arrayElemAt: ['$inquiryStats.totalInquiries', 0] }, 0],
            },
          },
        },
      ]),
    ]);

    const renterBookingStatusMap = toStatusMap(renterBookingStatuses);
    const landlordBookingStatusMap = toStatusMap(landlordBookingStatuses);
    const renterInquiryStatusMap = toStatusMap(renterInquiryStatuses);
    const landlordInquiryStatusMap = toStatusMap(landlordInquiryStatuses);
    const renterReportStatusMap = toStatusMap(renterReportStatuses);
    const landlordReportStatusMap = toStatusMap(landlordReportStatuses);

    const renterBookingsTotal = totalBookings;
    const renterBookingsConfirmed = Number(renterBookingStatusMap.get('confirmed') || 0);
    const renterInquiriesTotal = totalInquiries;
    const renterInquiriesResponded = Number(renterInquiryStatusMap.get('responded') || 0) + Number(renterInquiryStatusMap.get('closed') || 0);
    const renterReportsTotal = Number(renterReportStatusMap.get('open') || 0)
      + Number(renterReportStatusMap.get('in_review') || 0)
      + Number(renterReportStatusMap.get('resolved') || 0)
      + Number(renterReportStatusMap.get('dismissed') || 0);

    const landlordBookingsTotal = Number(landlordBookingStatusMap.get('pending') || 0)
      + Number(landlordBookingStatusMap.get('confirmed') || 0)
      + Number(landlordBookingStatusMap.get('declined') || 0)
      + Number(landlordBookingStatusMap.get('cancelled') || 0);
    const landlordBookingsConfirmed = Number(landlordBookingStatusMap.get('confirmed') || 0);
    const landlordInquiriesTotal = Number(landlordInquiryStatusMap.get('open') || 0)
      + Number(landlordInquiryStatusMap.get('responded') || 0)
      + Number(landlordInquiryStatusMap.get('closed') || 0);
    const landlordInquiriesResponded = Number(landlordInquiryStatusMap.get('responded') || 0) + Number(landlordInquiryStatusMap.get('closed') || 0);
    const landlordReportsTotal = Number(landlordReportStatusMap.get('open') || 0)
      + Number(landlordReportStatusMap.get('in_review') || 0)
      + Number(landlordReportStatusMap.get('resolved') || 0)
      + Number(landlordReportStatusMap.get('dismissed') || 0);

    const trendBuckets30 = buildDateBuckets(30);
    const renterSignupsMap = toDailyMap(renterSignups30d);
    const landlordSignupsMap = toDailyMap(landlordSignups30d);
    const renterBookingsMap = toDailyMap(renterBookings30d);
    const landlordListingsMap = toDailyMap(landlordListings30d);

    const trendWindow30d = trendBuckets30.map((day) => ({
      day,
      renterSignups: Number(renterSignupsMap.get(day) || 0),
      landlordSignups: Number(landlordSignupsMap.get(day) || 0),
      renterBookings: Number(renterBookingsMap.get(day) || 0),
      landlordListings: Number(landlordListingsMap.get(day) || 0),
    }));
    const trendWindow7d = trendWindow30d.slice(-7);

    return res.status(200).json({
      summary: {
        totalUsers: managedUsers,
        renters,
        landlords,
        admins,
        moderators,
        suspendedUsers,
        shadowBannedUsers,
        bannedUsers,
        totalListings,
        activeRooms: activeListings,
        activeListings,
        pendingListings,
        pending3dModels,
        approvedListings,
        rejectedListings,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalInquiries,
        openInquiries,
        totalReports,
        openReports,
        inReviewReports,
        totalChats,
        activeChats,
        chatMessages,
        rolePerformance: {
          renter: {
            total: renters,
            activeLast30d: renterActiveLast30d,
            emailVerified: renterEmailVerified,
            bookingsTotal: renterBookingsTotal,
            bookingsConfirmed: renterBookingsConfirmed,
            inquiriesTotal: renterInquiriesTotal,
            inquiriesResponded: renterInquiriesResponded,
            reportsRaised: renterReportsTotal,
            openReportsRaised: Number(renterReportStatusMap.get('open') || 0),
            inquiryToBookingRate: ratioPercent(renterBookingsTotal, renterInquiriesTotal),
            bookingConfirmationRate: ratioPercent(renterBookingsConfirmed, renterBookingsTotal),
          },
          landlord: {
            total: landlords,
            activeLast30d: landlordActiveLast30d,
            verifiedCount: landlordVerified,
            kycPendingCount: landlordKycPending,
            listingsTotal: totalListings,
            listingsActive: activeListings,
            listingsPendingModeration: pendingListings,
            listingsRejected: rejectedListings,
            bookingsReceived: landlordBookingsTotal,
            bookingsReceivedConfirmed: landlordBookingsConfirmed,
            inquiriesReceived: landlordInquiriesTotal,
            inquiriesResponded: landlordInquiriesResponded,
            reportsAgainst: landlordReportsTotal,
            openReportsAgainst: Number(landlordReportStatusMap.get('open') || 0),
            listingApprovalRate: ratioPercent(approvedListings, totalListings),
            bookingAcceptanceRate: ratioPercent(landlordBookingsConfirmed, landlordBookingsTotal),
          },
          trends: {
            window7d: trendWindow7d,
            window30d: trendWindow30d,
          },
          topPerformers: {
            landlordsByBookings: topLandlords,
            rentersByBookings: topRenters,
          },
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load admin overview',
      error: error.message,
    });
  }
}
