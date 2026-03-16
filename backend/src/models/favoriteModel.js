import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    listingId: {
        type: String,
        required: true
    },
    source: {
        type: String,
        default: 'web'
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
    }
}, {
    timestamps: true
});

favoriteSchema.index({ userId: 1, listingId: 1 }, { unique: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);
