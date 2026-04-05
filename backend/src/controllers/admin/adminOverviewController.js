import { User } from '../../models/userModel.js';
import { Room } from '../../models/roomModel.js';
import { Booking } from '../../models/bookingModel.js';
import { Inquiry } from '../../models/inquiryModel.js';
import { Report } from '../../models/reportModel.js';

export async function getAdminOverview(req, res) {
  try {
    const [
      managedUsers,
      renters,
      landlords,
      admins,
      suspendedUsers,
      bannedUsers,
      totalListings,
      activeListings,
      pendingListings,
      approvedListings,
      rejectedListings,
      totalBookings,
      pendingBookings,
      totalInquiries,
      openInquiries,
      totalReports,
      openReports,
      inReviewReports,
      pending3dModels,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['user', 'landlord'] } }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'landlord' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: { $in: ['user', 'landlord'] }, accountStatus: 'suspended' }),
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
      Inquiry.countDocuments({}),
      Inquiry.countDocuments({ status: 'open' }),
      Report.countDocuments({}),
      Report.countDocuments({ status: 'open' }),
      Report.countDocuments({ status: 'in_review' }),
      Room.countDocuments({
        moderationStatus: 'pending',
        model3dUrl: { $exists: true, $type: 'string', $ne: '' },
      }),
    ]);

    return res.status(200).json({
      summary: {
        totalUsers: managedUsers,
        renters,
        landlords,
        admins,
        suspendedUsers,
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
        totalInquiries,
        openInquiries,
        totalReports,
        openReports,
        inReviewReports,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load admin overview',
      error: error.message,
    });
  }
}
