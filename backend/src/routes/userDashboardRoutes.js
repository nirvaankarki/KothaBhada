import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
    getFavorites,
    toggleFavorite,
    addViewHistory,
    getViewHistory,
    clearViewHistory,
    createInquiry,
    getInquiries,
    addInquiryMessage,
    createBooking,
    getBookings,
    getOwnerInquiries,
    addOwnerInquiryMessage,
    getOwnerBookings,
    sendChatMessage,
    getUserChats,
    getOwnerChats,
    replyToChat,
    markOwnerChatSeen
} from '../controllers/userDashboardController.js';

const router = express.Router();

router.get('/favorites', authenticate, getFavorites);
router.post('/favorites/toggle', authenticate, toggleFavorite);
router.get('/history', authenticate, getViewHistory);
router.post('/history', authenticate, addViewHistory);
router.delete('/history', authenticate, clearViewHistory);
router.get('/inquiries', authenticate, getInquiries);
router.post('/inquiries', authenticate, createInquiry);
router.post('/inquiries/:inquiryId/messages', authenticate, addInquiryMessage);
router.get('/bookings', authenticate, getBookings);
router.post('/bookings', authenticate, createBooking);
router.get('/owner/inquiries', authenticate, getOwnerInquiries);
router.post('/owner/inquiries/:inquiryId/messages', authenticate, addOwnerInquiryMessage);
router.get('/owner/bookings', authenticate, getOwnerBookings);
router.post('/chat/send', authenticate, sendChatMessage);
router.get('/chats', authenticate, getUserChats);
router.get('/owner/chats', authenticate, getOwnerChats);
router.post('/chats/:chatId/reply', authenticate, replyToChat);
router.post('/chats/:chatId/seen', authenticate, markOwnerChatSeen);

export default router;
