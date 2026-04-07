import { User } from '../../models/userModel.js';
import { Room } from '../../models/roomModel.js';
import { Booking } from '../../models/bookingModel.js';
import { Inquiry } from '../../models/inquiryModel.js';
import { Report } from '../../models/reportModel.js';
import { Chat } from '../../models/chatModel.js';

export async function getAdminOverview(req, res) {
  try {
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
    ]);

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
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load admin overview',
      error: error.message,
    });
  }
}
