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
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'banned'],
        default: 'active',
        index: true
    },
    suspensionUntil: {
        type: Date,
        default: null
    },
    accountActionReason: {
        type: String,
        default: '',
        trim: true
    },
    accountActionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    accountActionAt: {
        type: Date,
        default: null
    },
    phone: {
        type: String,
        default: ''
    },
    profilePhoto: {
        type: String,
        default: null
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
