import mongoose from 'mongoose';

const viewHistorySchema = new mongoose.Schema({
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
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

viewHistorySchema.index({ userId: 1, viewedAt: -1 });
viewHistorySchema.index({ userId: 1, listingId: 1 });

export const ViewHistory = mongoose.model('ViewHistory', viewHistorySchema);
