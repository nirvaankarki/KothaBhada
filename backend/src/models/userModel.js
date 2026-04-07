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
        enum: ['user', 'landlord', 'moderator', 'admin'],
        default: 'user'
    },
    moderatorPermissions: {
        type: [String],
        default: [],
    },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'shadow_banned', 'banned'],
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
    landlordKycDocumentType: {
        type: String,
        enum: ['', 'citizenship', 'license'],
        default: ''
    },
    landlordKycDocumentImage: {
        type: String,
        default: ''
    },
    landlordKycStatus: {
        type: String,
        enum: ['not_submitted', 'pending', 'reupload_requested', 'verified', 'rejected'],
        default: 'not_submitted',
        index: true
    },
    landlordKycSubmittedAt: {
        type: Date,
        default: null
    },
    landlordKycReviewedAt: {
        type: Date,
        default: null
    },
    landlordKycReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    landlordKycReviewNote: {
        type: String,
        default: '',
        trim: true
    },
    isLandlordVerified: {
        type: Boolean,
        default: false,
        index: true
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
    lastLoginAt: {
        type: Date,
        default: null,
        index: true,
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
