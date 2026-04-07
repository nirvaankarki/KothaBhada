import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

export const PlatformSetting = mongoose.model('PlatformSetting', platformSettingSchema);
