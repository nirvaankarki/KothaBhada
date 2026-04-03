import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
    rank: {
        type: Number,
        default: 0,
    },
    listingId: {
        type: String,
        default: '',
    },
    title: {
        type: String,
        default: '',
    },
    location: {
        type: String,
        default: '',
    },
    price: {
        type: Number,
        default: 0,
    },
    reason: {
        type: String,
        default: '',
    },
    model3dUrl: {
        type: String,
        default: '',
    },
}, { _id: false });

const aiChatMessageSchema = new mongoose.Schema({
    senderType: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    recommendations: {
        type: [recommendationSchema],
        default: [],
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: true });

const aiChatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    messages: {
        type: [aiChatMessageSchema],
        default: [],
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

export const AiChatHistory = mongoose.model('AiChatHistory', aiChatHistorySchema);
