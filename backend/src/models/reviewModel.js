import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  listingId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    default: 'Anonymous User'
  },
  userEmail: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: true,
    trim: true
  },
  moderationStatus: {
    type: String,
    enum: ['visible', 'hidden', 'removed'],
    default: 'visible',
    index: true,
  },
  moderationNote: {
    type: String,
    default: '',
    trim: true,
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  moderatedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export const Review = mongoose.model('Review', reviewSchema);
