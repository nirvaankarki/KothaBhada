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
    latitude: {
        type: Number,
        min: -90,
        max: 90,
        default: null
    },
    longitude: {
        type: Number,
        min: -180,
        max: 180,
        default: null
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
    images: {
        type: [String],
        default: []
    },
    model3dUrl: {
        type: String,
        default: ''
    },
    tourPoints: {
        type: [{
            _id: false,
            label: {
                type: String,
                default: ''
            },
            x: {
                type: Number,
                required: true
            },
            y: {
                type: Number,
                required: true
            },
            z: {
                type: Number,
                required: true
            },
            lookAtX: {
                type: Number,
                default: 0
            },
            lookAtY: {
                type: Number,
                default: 0.82
            },
            lookAtZ: {
                type: Number,
                default: 0
            }
        }],
        default: []
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    moderationNote: {
        type: String,
        default: '',
        trim: true,
    },
    moderationReviewedAt: {
        type: Date,
        default: null,
    },
    moderationReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Room = mongoose.model('Room', roomSchema);
