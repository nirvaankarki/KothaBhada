import mongoose from 'mongoose';

const inquiryMessageSchema = new mongoose.Schema({
    senderType: {
        type: String,
        enum: ['user', 'owner', 'system'],
        default: 'user'
    },
    text: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const inquirySchema = new mongoose.Schema({
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
        required: true
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
    ownerName: {
        type: String,
        default: 'Property Owner'
    },
    ownerContact: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['open', 'responded', 'closed'],
        default: 'open'
    },
    messages: {
        type: [inquiryMessageSchema],
        default: []
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

inquirySchema.index({ userId: 1, updatedAt: -1 });
inquirySchema.index({ ownerId: 1, updatedAt: -1 });

export const Inquiry = mongoose.model('Inquiry', inquirySchema);
