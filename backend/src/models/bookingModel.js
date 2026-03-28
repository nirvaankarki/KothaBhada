import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
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
    preferredVisitDate: {
        type: Date,
        required: true
    },
    preferredTime: {
        type: String,
        required: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    occupation: {
        type: String,
        required: true,
        trim: true
    },
    monthlyIncome: {
        type: String,
        required: true,
        trim: true
    },
    moveInDate: {
        type: Date,
        required: true
    },
    stayDurationMonths: {
        type: Number,
        required: true,
        min: 1
    },
    occupants: {
        type: Number,
        required: true,
        min: 1
    },
    hasPets: {
        type: String,
        required: true,
        enum: ['yes', 'no']
    },
    reasonForMoving: {
        type: String,
        required: true,
        trim: true
    },
    note: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'declined', 'cancelled'],
        default: 'pending'
    },
    ownerResponse: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ ownerId: 1, createdAt: -1 });
bookingSchema.index({ ownerId: 1, status: 1, createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);
