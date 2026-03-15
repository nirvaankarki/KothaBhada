import { Contact } from '../../models/contactModel.js';

export async function submitContactForm(req, res) {
    try {
        const { fullName, email, phone, subject, message } = req.body;

        // Basic validation
        if (!fullName || !email || !subject || !message) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        const newMessage = new Contact({
            fullName,
            email,
            phone,
            subject,
            message
        });

        await newMessage.save();

        res.status(201).json({ 
            success: true, 
            message: 'Your message has been sent successfully. We will get back to you soon!' 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to send message', 
            error: error.message 
        });
    }
}