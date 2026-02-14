import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
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
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Room = mongoose.model('Room', roomSchema);
