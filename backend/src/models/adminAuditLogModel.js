import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  adminEmail: {
    type: String,
    default: '',
    trim: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  targetType: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  targetId: {
    type: String,
    default: '',
    trim: true,
  },
  targetLabel: {
    type: String,
    default: '',
    trim: true,
  },
  reason: {
    type: String,
    default: '',
    trim: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
