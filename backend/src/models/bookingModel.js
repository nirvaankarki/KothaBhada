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

export const Booking = mongoose.model('Booking', bookingSchema);
