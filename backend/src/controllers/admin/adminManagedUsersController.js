import { User } from '../../models/userModel.js';
import { Room } from '../../models/roomModel.js';
import { Booking } from '../../models/bookingModel.js';
import { Inquiry } from '../../models/inquiryModel.js';

const ALLOWED_ROLE_FILTERS = new Set(['user', 'landlord', 'admin']);

function toCountMap(rows = []) {
  return new Map(rows.map((row) => [String(row._id), Number(row.count || 0)]));
}

export async function getManagedUsers(req, res) {
  try {
    const roleFilter = String(req.query.role || '').trim().toLowerCase();
    const searchText = String(req.query.search || '').trim();
    const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 60));

    const filter = {};

    if (ALLOWED_ROLE_FILTERS.has(roleFilter)) {
      filter.role = roleFilter;
    } else {
      filter.role = { $in: ['user', 'landlord'] };
    }

    if (searchText) {
      const searchRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const users = await User.find(filter)
      .select('_id name email role phone createdAt isEmailVerified accountStatus suspensionUntil accountActionReason accountActionAt isLandlordVerified landlordKycStatus')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (!users.length) {
      return res.status(200).json({
        users: [],
        meta: {
          count: 0,
          role: roleFilter || 'all',
          limit,
        },
      });
    }

    const userIds = users.map((user) => user._id);

    const [
      renterBookingRows,
      renterInquiryRows,
      landlordListingRows,
      landlordActiveListingRows,
      landlordBookingRows,
      landlordInquiryRows,
    ] = await Promise.all([
      Booking.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      Inquiry.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      Room.aggregate([
        { $match: { ownerId: { $in: userIds } } },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
      Room.aggregate([
        { $match: { ownerId: { $in: userIds }, status: 'active' } },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { ownerId: { $in: userIds } } },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
      Inquiry.aggregate([
        { $match: { ownerId: { $in: userIds } } },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
    ]);

    const renterBookingsMap = toCountMap(renterBookingRows);
    const renterInquiriesMap = toCountMap(renterInquiryRows);
    const landlordListingsMap = toCountMap(landlordListingRows);
    const landlordActiveListingsMap = toCountMap(landlordActiveListingRows);
    const landlordBookingsMap = toCountMap(landlordBookingRows);
    const landlordInquiriesMap = toCountMap(landlordInquiryRows);

    const enrichedUsers = users.map((user) => {
      const userId = String(user._id);
      const role = String(user.role || '').trim().toLowerCase();

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        phone: user.phone || '',
        isEmailVerified: Boolean(user.isEmailVerified),
        isLandlordVerified: Boolean(user.isLandlordVerified),
        landlordKycStatus: user.landlordKycStatus || 'not_submitted',
        accountStatus: String(user.accountStatus || 'active').toLowerCase(),
        suspensionUntil: user.suspensionUntil || null,
        accountActionReason: user.accountActionReason || '',
        accountActionAt: user.accountActionAt || null,
        createdAt: user.createdAt,
        activity: {
          renterBookings: renterBookingsMap.get(userId) || 0,
          renterInquiries: renterInquiriesMap.get(userId) || 0,
          landlordListings: landlordListingsMap.get(userId) || 0,
          landlordActiveListings: landlordActiveListingsMap.get(userId) || 0,
          landlordBookings: landlordBookingsMap.get(userId) || 0,
          landlordInquiries: landlordInquiriesMap.get(userId) || 0,
        },
      };
    });

    return res.status(200).json({
      users: enrichedUsers,
      meta: {
        count: enrichedUsers.length,
        role: roleFilter || 'all',
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load managed users',
      error: error.message,
    });
  }
}
