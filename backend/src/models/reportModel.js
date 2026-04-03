import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reporterRole: {
    type: String,
    enum: ['user', 'landlord'],
    required: true,
  },
  targetType: {
    type: String,
    enum: ['listing', 'user', 'booking', 'chat', 'review', 'other'],
    default: 'other',
    index: true,
  },
  targetId: {
    type: String,
    default: '',
    trim: true,
  },
  targetListingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null,
    index: true,
  },
  targetOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  reasonCategory: {
    type: String,
    enum: ['fraud', 'spam', 'harassment', 'fake_listing', 'policy_violation', 'other'],
    default: 'other',
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1200,
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'dismissed'],
    default: 'open',
    index: true,
  },
  adminNote: {
    type: String,
    default: '',
    trim: true,
  },
  landlordResponseNote: {
    type: String,
    default: '',
    trim: true,
  },
  landlordRespondedAt: {
    type: Date,
    default: null,
  },
  landlordRespondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  adminDecisionSeverity: {
    type: String,
    enum: ['none', 'minor', 'major'],
    default: 'none',
    index: true,
  },
  adminDecisionAction: {
    type: String,
    enum: ['none', 'reject_listing', 'ban_landlord'],
    default: 'none',
    index: true,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export const Report = mongoose.model('Report', reportSchema);
