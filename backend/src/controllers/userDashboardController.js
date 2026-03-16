import { Favorite } from '../models/favoriteModel.js';
import { ViewHistory } from '../models/viewHistoryModel.js';
import { Inquiry } from '../models/inquiryModel.js';
import { Booking } from '../models/bookingModel.js';

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

        const inquiry = await Inquiry.create({
            userId: req.user.userId,
            listingId,
            title,
            location: location || '',
            price: Number(price) || 0,
            image: image || '',
            ownerName: ownerName || 'Property Owner',
            ownerContact: ownerContact || '',
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

        if (!listingId || !title || !preferredVisitDate) {
            return res.status(400).json({ message: 'listingId, title and preferredVisitDate are required' });
        }

        const booking = await Booking.create({
            userId: req.user.userId,
            listingId,
            title,
            location: location || '',
            price: Number(price) || 0,
            image: image || '',
            ownerName: ownerName || 'Property Owner',
            ownerContact: ownerContact || '',
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
