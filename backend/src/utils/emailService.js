import nodemailer from 'nodemailer';

// Configure your email service
// For development, you can use Gmail with App Password
// For production, use your email service provider
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'your_email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_app_password'
    }
});

export const sendVerificationEmail = async (email, verificationCode) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@kothabhada.com',
            to: email,
            subject: 'Password Reset Verification Code',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset. Use the code below to reset your password:</p>
                <h3 style="background-color: #f0f0f0; padding: 10px; text-align: center; letter-spacing: 5px;">
                    ${verificationCode}
                </h3>
                <p>This code is valid for 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};
