import { Favorite } from '../models/favoriteModel.js';
import { ViewHistory } from '../models/viewHistoryModel.js';
import { Inquiry } from '../models/inquiryModel.js';
import { Booking } from '../models/bookingModel.js';
import { Chat } from '../models/chatModel.js';
import { Room } from '../models/roomModel.js';

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
            note
        } = req.body;

        if (!listingId || !preferredVisitDate) {
            return res.status(400).json({ message: 'listingId and preferredVisitDate are required' });
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
            note: note || '',
            status: 'pending'
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
