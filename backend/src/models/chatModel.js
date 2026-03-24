import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderType: {
        type: String,
        enum: ['user', 'owner'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    listingId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: ''
    },
    messages: [messageSchema],
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    ownerLastSeenAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    }
}, {
    timestamps: true
});

chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ ownerId: 1, createdAt: -1 });
chatSchema.index({ userId: 1, ownerId: 1, listingId: 1 });

export const Chat = mongoose.model('Chat', chatSchema);
