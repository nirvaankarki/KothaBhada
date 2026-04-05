import { User } from '../../models/userModel.js';

const ALLOWED_KYC_DOC_TYPES = new Set(['citizenship', 'license']);

function normalizeKycDocType(value) {
    return String(value || '').trim().toLowerCase();
}

export async function getCurrentUser(req, res) {
    try {
        const user = await User.findById(req.user.userId).select('-password -resetCode -resetCodeExpiry');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                profilePhoto: user.profilePhoto || null,
                isLandlordVerified: Boolean(user.isLandlordVerified),
                landlordKycDocumentType: user.landlordKycDocumentType || '',
                landlordKycDocumentImage: user.landlordKycDocumentImage || '',
                landlordKycStatus: user.landlordKycStatus || 'not_submitted',
                landlordKycSubmittedAt: user.landlordKycSubmittedAt || null,
                landlordKycReviewedAt: user.landlordKycReviewedAt || null,
                landlordKycReviewNote: user.landlordKycReviewNote || ''
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
    }
}

export async function updateCurrentUser(req, res) {
    try {
        const {
            name,
            phone,
            profilePhoto,
            landlordKycDocumentType,
            landlordKycDocumentImage,
        } = req.body;
        const updatePayload = {};

        if (name !== undefined) {
            if (!name || !name.trim()) {
                return res.status(400).json({ message: 'Name cannot be empty' });
            }
            updatePayload.name = name.trim();
        }

        if (phone !== undefined) {
            const normalizedPhone = String(phone).trim();
            if (normalizedPhone && !/^\+?[0-9\s-]{7,15}$/.test(normalizedPhone)) {
                return res.status(400).json({ message: 'Invalid contact number format' });
            }
            updatePayload.phone = normalizedPhone;
        }

        if (profilePhoto !== undefined) {
            // profilePhoto should be base64 string or null
            if (profilePhoto === null) {
                updatePayload.profilePhoto = null;
            } else if (typeof profilePhoto === 'string' && profilePhoto.startsWith('data:image')) {
                // Limit base64 size to 5MB
                if (profilePhoto.length > 5242880) {
                    return res.status(400).json({ message: 'Photo size exceeds 5MB limit' });
                }
                updatePayload.profilePhoto = profilePhoto;
            } else {
                return res.status(400).json({ message: 'Invalid photo format' });
            }
        }

        const isLandlord = String(req.user?.role || '').toLowerCase() === 'landlord';
        const hasKycTypeInPayload = landlordKycDocumentType !== undefined;
        const hasKycImageInPayload = landlordKycDocumentImage !== undefined;

        if ((hasKycTypeInPayload || hasKycImageInPayload) && !isLandlord) {
            return res.status(403).json({ message: 'Only landlord accounts can manage KYC documents' });
        }

        if (isLandlord && (hasKycTypeInPayload || hasKycImageInPayload)) {
            const normalizedDocType = normalizeKycDocType(landlordKycDocumentType);
            const isClearingDoc = landlordKycDocumentImage === null || String(landlordKycDocumentImage || '').trim() === '';

            if (isClearingDoc) {
                updatePayload.landlordKycDocumentType = '';
                updatePayload.landlordKycDocumentImage = '';
                updatePayload.landlordKycStatus = 'not_submitted';
                updatePayload.landlordKycSubmittedAt = null;
                updatePayload.landlordKycReviewedAt = null;
                updatePayload.landlordKycReviewedBy = null;
                updatePayload.landlordKycReviewNote = '';
                updatePayload.isLandlordVerified = false;
            } else {
                if (!ALLOWED_KYC_DOC_TYPES.has(normalizedDocType)) {
                    return res.status(400).json({ message: 'KYC document type must be citizenship or license' });
                }

                if (typeof landlordKycDocumentImage !== 'string' || !landlordKycDocumentImage.startsWith('data:image')) {
                    return res.status(400).json({ message: 'KYC document must be a valid image file' });
                }

                if (landlordKycDocumentImage.length > 10485760) {
                    return res.status(400).json({ message: 'KYC document image must be smaller than 10MB' });
                }

                updatePayload.landlordKycDocumentType = normalizedDocType;
                updatePayload.landlordKycDocumentImage = landlordKycDocumentImage;
                updatePayload.landlordKycStatus = 'pending';
                updatePayload.landlordKycSubmittedAt = new Date();
                updatePayload.landlordKycReviewedAt = null;
                updatePayload.landlordKycReviewedBy = null;
                updatePayload.landlordKycReviewNote = '';
                updatePayload.isLandlordVerified = false;
            }
        }

        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).json({ message: 'No profile fields provided for update' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            updatePayload,
            { new: true, runValidators: true }
        ).select('-password -resetCode -resetCodeExpiry');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone || '',
                profilePhoto: updatedUser.profilePhoto || null,
                isLandlordVerified: Boolean(updatedUser.isLandlordVerified),
                landlordKycDocumentType: updatedUser.landlordKycDocumentType || '',
                landlordKycDocumentImage: updatedUser.landlordKycDocumentImage || '',
                landlordKycStatus: updatedUser.landlordKycStatus || 'not_submitted',
                landlordKycSubmittedAt: updatedUser.landlordKycSubmittedAt || null,
                landlordKycReviewedAt: updatedUser.landlordKycReviewedAt || null,
                landlordKycReviewNote: updatedUser.landlordKycReviewNote || ''
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
}
