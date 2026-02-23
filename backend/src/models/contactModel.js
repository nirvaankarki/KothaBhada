import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String }, // Optional
    subject: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { collection : 'contacts' });

export const Contact = mongoose.model('Contact', contactSchema);