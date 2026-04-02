import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    ownerName: {
        type: String,
        default: 'Property Owner'
    },
    ownerEmail: {
        type: String,
        default: ''
    },
    ownerPhone: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    location: {
        type: String,
        required: true
    },
    bedrooms: {
        type: Number,
        default: 1,
        min: 0
    },
    bathrooms: {
        type: Number,
        default: 1,
        min: 0
    },
    areaSqFt: {
        type: Number,
        default: 0,
        min: 0
    },
    keyFeatures: {
        type: [String],
        default: []
    },
    areaHighlights: {
        type: [String],
        default: []
    },
    image: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Room = mongoose.model('Room', roomSchema);
