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
    updateBookingRequest,
    getOwnerInquiries,
    addOwnerInquiryMessage,
    getOwnerBookings,
    updateOwnerBookingStatus,
    sendChatMessage,
    getUserChats,
    getOwnerChats,
    replyToChat,
    markOwnerChatSeen,
    getAiRecommendations,
    getAiChatHistory,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications
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
router.patch('/bookings/:bookingId', authenticate, updateBookingRequest);
router.get('/owner/inquiries', authenticate, getOwnerInquiries);
router.post('/owner/inquiries/:inquiryId/messages', authenticate, addOwnerInquiryMessage);
router.get('/owner/bookings', authenticate, getOwnerBookings);
router.patch('/owner/bookings/:bookingId/status', authenticate, updateOwnerBookingStatus);
router.post('/chat/send', authenticate, sendChatMessage);
router.post('/ai/recommendations', authenticate, getAiRecommendations);
router.get('/ai/history', authenticate, getAiChatHistory);
router.get('/chats', authenticate, getUserChats);
router.get('/owner/chats', authenticate, getOwnerChats);
router.post('/chats/:chatId/reply', authenticate, replyToChat);
router.post('/chats/:chatId/seen', authenticate, markOwnerChatSeen);
router.get('/notifications', authenticate, getNotifications);
router.post('/notifications/read-all', authenticate, markAllNotificationsAsRead);
router.post('/notifications/:notificationId/read', authenticate, markNotificationAsRead);
router.delete('/notifications', authenticate, clearAllNotifications);

export default router;
