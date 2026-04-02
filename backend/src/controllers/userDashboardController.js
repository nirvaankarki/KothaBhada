import { Favorite } from '../models/favoriteModel.js';
import { ViewHistory } from '../models/viewHistoryModel.js';
import { Inquiry } from '../models/inquiryModel.js';
import { Booking } from '../models/bookingModel.js';
import { Chat } from '../models/chatModel.js';
import { Room } from '../models/roomModel.js';
import { Notification } from '../models/notificationModel.js';

async function resolveRoomOwner(listingId) {
    if (!listingId) {
        return null;
    }

    const room = await Room.findById(listingId).select('ownerId ownerName ownerPhone ownerEmail title location price image');
    if (!room) {
        return null;
    }

    return room;
}

async function createNotification({ userId, role, type, title, message, metadata = {} }) {
    if (!userId || !role || !type || !title || !message) return;

    await Notification.create({
        userId,
        role,
        type,
        title,
        message,
        metadata
    });
}

export async function getFavorites(req, res) {
    try {
        const favorites = await Favorite.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ favorites });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch favorites', error: error.message });
    }
}

export async function toggleFavorite(req, res) {
    try {
        const { listingId, title, location, price, image, source } = req.body;

        if (!listingId || !title) {
            return res.status(400).json({ message: 'listingId and title are required' });
        }

        const existing = await Favorite.findOne({ userId: req.user.userId, listingId });
        if (existing) {
            await Favorite.findByIdAndDelete(existing._id);
            return res.status(200).json({ message: 'Removed from favorites', isFavorite: false });
        }

        await Favorite.create({
            userId: req.user.userId,
            listingId,
            title,
            location: location || '',
            price: Number(price) || 0,
            image: image || '',
            source: source || 'web'
        });

        return res.status(201).json({ message: 'Added to favorites', isFavorite: true });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update favorite', error: error.message });
    }
}

export async function addViewHistory(req, res) {
    try {
        const { listingId, title, location, price, image, source } = req.body;

        if (!listingId || !title) {
            return res.status(400).json({ message: 'listingId and title are required' });
        }

        await ViewHistory.create({
            userId: req.user.userId,
            listingId,
            title,
            location: location || '',
            price: Number(price) || 0,
            image: image || '',
            source: source || 'web',
            viewedAt: new Date()
        });

        return res.status(201).json({ message: 'View history tracked' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to track view history', error: error.message });
    }
}

export async function getViewHistory(req, res) {
    try {
        const history = await ViewHistory.find({ userId: req.user.userId })
            .sort({ viewedAt: -1 })
            .limit(100);

        return res.status(200).json({ history });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch view history', error: error.message });
    }
}

export async function clearViewHistory(req, res) {
    try {
        const result = await ViewHistory.deleteMany({ userId: req.user.userId });
        return res.status(200).json({
            message: 'Viewing history cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to clear view history', error: error.message });
    }
}

export async function createInquiry(req, res) {
    try {
        const {
            listingId,
            title,
            location,
            price,
            image,
            ownerName,
            ownerContact,
            message
        } = req.body;

        if (!listingId || !title || !message || !message.trim()) {
            return res.status(400).json({ message: 'listingId, title and message are required' });
        }

        const room = await resolveRoomOwner(listingId);

        const inquiry = await Inquiry.create({
            userId: req.user.userId,
            ownerId: room?.ownerId || null,
            listingId,
            title: room?.title || title,
            location: room?.location || location || '',
            price: room?.price || Number(price) || 0,
            image: room?.image || image || '',
            ownerName: room?.ownerName || ownerName || 'Property Owner',
            ownerContact: room?.ownerPhone || ownerContact || '',
            status: 'open',
            messages: [
                {
                    senderType: 'user',
                    text: message.trim(),
                    sentAt: new Date()
                }
            ],
            lastMessageAt: new Date()
        });

        await createNotification({
            userId: inquiry.ownerId,
            role: 'landlord',
            type: 'inquiry_created',
            title: 'New inquiry received',
            message: `${req.user.name || 'A renter'} sent an inquiry for ${inquiry.title || 'your property'}.`,
            metadata: {
                inquiryId: inquiry._id,
                listingId: inquiry.listingId
            }
        });

        return res.status(201).json({ message: 'Inquiry sent successfully', inquiry });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create inquiry', error: error.message });
    }
}

export async function getInquiries(req, res) {
    try {
        const inquiries = await Inquiry.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
        return res.status(200).json({ inquiries });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch inquiries', error: error.message });
    }
}

export async function addInquiryMessage(req, res) {
    try {
        const { inquiryId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const inquiry = await Inquiry.findOne({ _id: inquiryId, userId: req.user.userId });
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        inquiry.messages.push({
            senderType: 'user',
            text: message.trim(),
            sentAt: new Date()
        });
        inquiry.lastMessageAt = new Date();
        await inquiry.save();

        await createNotification({
            userId: inquiry.ownerId,
            role: 'landlord',
            type: 'inquiry_message',
            title: 'New inquiry message',
            message: `${req.user.name || 'A renter'} sent a follow-up message on ${inquiry.title || 'a property inquiry'}.`,
            metadata: {
                inquiryId: inquiry._id,
                listingId: inquiry.listingId
            }
        });

        return res.status(200).json({ message: 'Message sent', inquiry });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
}

export async function createBooking(req, res) {
    try {
        const {
            listingId,
            title,
            location,
            price,
            image,
            ownerName,
            ownerContact,
            preferredVisitDate,
            preferredTime,
            fullName,
            email,
            phone,
            occupation,
            monthlyIncome,
            moveInDate,
            stayDurationMonths,
            occupants,
            hasPets,
            reasonForMoving,
            note
        } = req.body;

        if (
            !listingId ||
            !preferredVisitDate ||
            !preferredTime ||
            !fullName ||
            !email ||
            !phone ||
            !occupation ||
            !monthlyIncome ||
            !moveInDate ||
            !stayDurationMonths ||
            !occupants ||
            !hasPets ||
            !reasonForMoving
        ) {
            return res.status(400).json({
                message: 'All booking fields are required except additional notes'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        const normalizedPhone = String(phone).trim();
        if (normalizedPhone.length < 7) {
            return res.status(400).json({ message: 'Please enter a valid phone number' });
        }

        const normalizedStayDuration = Number(stayDurationMonths);
        const normalizedOccupants = Number(occupants);
        if (!Number.isFinite(normalizedStayDuration) || normalizedStayDuration < 1) {
            return res.status(400).json({ message: 'Stay duration must be at least 1 month' });
        }

        if (!Number.isFinite(normalizedOccupants) || normalizedOccupants < 1) {
            return res.status(400).json({ message: 'Occupants must be at least 1' });
        }

        const normalizedHasPets = String(hasPets).toLowerCase();
        if (!['yes', 'no'].includes(normalizedHasPets)) {
            return res.status(400).json({ message: 'hasPets must be either yes or no' });
        }

        const room = await resolveRoomOwner(listingId);
        if (!room) {
            return res.status(404).json({ message: 'Property not found' });
        }

        const booking = await Booking.create({
            userId: req.user.userId,
            ownerId: room?.ownerId || null,
            listingId,
            title: room?.title || title,
            location: room?.location || location || '',
            price: room?.price || Number(price) || 0,
            image: room?.image || image || '',
            ownerName: room?.ownerName || ownerName || 'Property Owner',
            ownerContact: room?.ownerPhone || ownerContact || '',
            preferredVisitDate,
            preferredTime: String(preferredTime).trim(),
            fullName: String(fullName).trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            occupation: String(occupation).trim(),
            monthlyIncome: String(monthlyIncome).trim(),
            moveInDate,
            stayDurationMonths: normalizedStayDuration,
            occupants: normalizedOccupants,
            hasPets: normalizedHasPets,
            reasonForMoving: String(reasonForMoving).trim(),
            note: note || '',
            status: 'pending'
        });

        await createNotification({
            userId: booking.ownerId,
            role: 'landlord',
            type: 'booking_created',
            title: 'New booking request',
            message: `${booking.fullName || req.user.name || 'A renter'} requested a visit for ${booking.title || 'your property'}.`,
            metadata: {
                bookingId: booking._id,
                listingId: booking.listingId
            }
        });

        return res.status(201).json({ message: 'Booking request sent', booking });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create booking request', error: error.message });
    }
}

export async function getBookings(req, res) {
    try {
        const bookings = await Booking.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ bookings });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
    }
}

export async function getOwnerInquiries(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can access owner inquiries' });
        }

        const inquiries = await Inquiry.find({ ownerId: req.user.userId })
            .populate('userId', 'name email')
            .sort({ updatedAt: -1 });

        return res.status(200).json({ inquiries });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch owner inquiries', error: error.message });
    }
}

export async function addOwnerInquiryMessage(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can reply to inquiries' });
        }

        const { inquiryId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const inquiry = await Inquiry.findOne({ _id: inquiryId, ownerId: req.user.userId }).populate('userId', 'name email');
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        inquiry.messages.push({
            senderType: 'owner',
            text: message.trim(),
            sentAt: new Date()
        });
        inquiry.status = 'responded';
        inquiry.lastMessageAt = new Date();
        await inquiry.save();

        await createNotification({
            userId: inquiry.userId?._id || inquiry.userId,
            role: 'user',
            type: 'inquiry_reply',
            title: 'Owner replied to your inquiry',
            message: `You received a reply for ${inquiry.title || 'your property inquiry'}.`,
            metadata: {
                inquiryId: inquiry._id,
                listingId: inquiry.listingId
            }
        });

        return res.status(200).json({ message: 'Reply sent', inquiry });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send owner reply', error: error.message });
    }
}

export async function getOwnerBookings(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can access owner bookings' });
        }

        const bookings = await Booking.find({ ownerId: req.user.userId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({ bookings });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch owner bookings', error: error.message });
    }
}

export async function updateOwnerBookingStatus(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can update booking requests' });
        }

        const { bookingId } = req.params;
        const { status, ownerResponse } = req.body;
        const normalizedStatus = String(status || '').toLowerCase();

        if (!['confirmed', 'declined'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'Status must be confirmed or declined' });
        }

        if (normalizedStatus === 'declined' && !String(ownerResponse || '').trim()) {
            return res.status(400).json({ message: 'A reason is required when declining a booking' });
        }

        const booking = await Booking.findOne({ _id: bookingId, ownerId: req.user.userId }).populate('userId', 'name email');
        if (!booking) {
            return res.status(404).json({ message: 'Booking request not found' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: 'This booking has already been reviewed' });
        }

        booking.status = normalizedStatus;
        booking.ownerResponse = String(ownerResponse || '').trim();
        await booking.save();

        await createNotification({
            userId: booking.userId?._id || booking.userId,
            role: 'user',
            type: normalizedStatus === 'confirmed' ? 'booking_confirmed' : 'booking_declined',
            title: normalizedStatus === 'confirmed' ? 'Booking request accepted' : 'Booking request rejected',
            message: normalizedStatus === 'confirmed'
                ? `Your booking request for ${booking.title || 'the property'} was accepted.`
                : `Your booking request for ${booking.title || 'the property'} was rejected.`,
            metadata: {
                bookingId: booking._id,
                listingId: booking.listingId
            }
        });

        return res.status(200).json({
            message: normalizedStatus === 'confirmed' ? 'Booking request accepted' : 'Booking request declined',
            booking
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update booking status', error: error.message });
    }
}

export async function sendChatMessage(req, res) {
    try {
        const { listingId, ownerId, message, title, location, price, image } = req.body;

        if (!listingId || !message || !message.trim()) {
            return res.status(400).json({ message: 'listingId and message are required' });
        }

        if (!ownerId) {
            return res.status(400).json({ message: 'ownerId is required' });
        }

        const room = await resolveRoomOwner(listingId);

        let chat = await Chat.findOne({
            userId: req.user.userId,
            ownerId,
            listingId
        });

        if (!chat) {
            chat = await Chat.create({
                userId: req.user.userId,
                ownerId,
                listingId,
                title: room?.title || title || 'Property Chat',
                location: room?.location || location || '',
                price: room?.price || Number(price) || 0,
                image: room?.image || image || '',
                messages: [
                    {
                        senderId: req.user.userId,
                        senderType: 'user',
                        text: message.trim(),
                        sentAt: new Date()
                    }
                ],
                lastMessageAt: new Date()
            });
        } else {
            chat.messages.push({
                senderId: req.user.userId,
                senderType: 'user',
                text: message.trim(),
                sentAt: new Date()
            });
            chat.lastMessageAt = new Date();
            await chat.save();
        }

        await chat.populate('ownerId', 'name email profilePhoto');

        await createNotification({
            userId: ownerId,
            role: 'landlord',
            type: 'chat_message',
            title: 'New chat message',
            message: `${req.user.name || 'A renter'} sent a new message about ${chat.title || 'your listing'}.`,
            metadata: {
                chatId: chat._id,
                listingId: chat.listingId
            }
        });

        return res.status(201).json({ message: 'Message sent', chat });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
}

export async function getUserChats(req, res) {
    try {
        const chats = await Chat.find({ userId: req.user.userId })
            .populate('ownerId', 'name email profilePhoto')
            .sort({ lastMessageAt: -1 });

        return res.status(200).json({ chats });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch chats', error: error.message });
    }
}

export async function getOwnerChats(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can access owner chats' });
        }

        const chats = await Chat.find({ ownerId: req.user.userId })
            .populate('userId', 'name email profilePhoto')
            .sort({ lastMessageAt: -1 });

        return res.status(200).json({ chats });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch owner chats', error: error.message });
    }
}

export async function replyToChat(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can reply to chats' });
        }

        const { chatId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const chat = await Chat.findOne({ _id: chatId, ownerId: req.user.userId })
            .populate('userId', 'name email profilePhoto');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        chat.messages.push({
            senderId: req.user.userId,
            senderType: 'owner',
            text: message.trim(),
            sentAt: new Date()
        });
        chat.ownerLastSeenAt = new Date();
        chat.lastMessageAt = new Date();
        await chat.save();

        await createNotification({
            userId: chat.userId?._id || chat.userId,
            role: 'user',
            type: 'chat_reply',
            title: 'New reply from landlord',
            message: `You received a new message about ${chat.title || 'your property inquiry'}.`,
            metadata: {
                chatId: chat._id,
                listingId: chat.listingId
            }
        });

        return res.status(200).json({ message: 'Reply sent', chat });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send reply', error: error.message });
    }
}

export async function markOwnerChatSeen(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can mark chats as seen' });
        }

        const { chatId } = req.params;

        const chat = await Chat.findOne({ _id: chatId, ownerId: req.user.userId })
            .populate('userId', 'name email profilePhoto');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        chat.ownerLastSeenAt = new Date();
        await chat.save();

        return res.status(200).json({ message: 'Chat marked as seen', chat });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to mark chat as seen', error: error.message });
    }
}

export async function getNotifications(req, res) {
    try {
        const role = req.user.role === 'landlord' ? 'landlord' : 'user';
        const notifications = await Notification.find({ userId: req.user.userId, role })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = notifications.filter((item) => !item.isRead).length;

        return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
}

export async function markNotificationAsRead(req, res) {
    try {
        const role = req.user.role === 'landlord' ? 'landlord' : 'user';
        const { notificationId } = req.params;

        const notification = await Notification.findOne({
            _id: notificationId,
            userId: req.user.userId,
            role
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
        }

        return res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
    }
}

export async function markAllNotificationsAsRead(req, res) {
    try {
        const role = req.user.role === 'landlord' ? 'landlord' : 'user';

        await Notification.updateMany(
            { userId: req.user.userId, role, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
    }
}

export async function clearAllNotifications(req, res) {
    try {
        const role = req.user.role === 'landlord' ? 'landlord' : 'user';

        const result = await Notification.deleteMany({
            userId: req.user.userId,
            role
        });

        return res.status(200).json({
            message: 'All notifications cleared',
            deletedCount: result.deletedCount || 0
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
    }
}
