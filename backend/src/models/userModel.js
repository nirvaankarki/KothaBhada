import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'landlord', 'admin'],
        default: 'user'
    },
    phone: {
        type: String,
        default: ''
    },
    resetCode: {
        type: String,
        default: null
    },
    resetCodeExpiry: {
        type: Date,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: true
    },
    emailVerificationCode: {
        type: String,
        default: null
    },
    emailVerificationCodeExpiry: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const User = mongoose.model('User', userSchema);
