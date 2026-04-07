import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/userModel.js';
import { resolveAccountAccess } from '../utils/accountAccess.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const userDoc = await User.findById(decoded.userId).select('email role moderatorPermissions accountStatus suspensionUntil accountActionReason accountActionAt accountActionBy');
        const access = await resolveAccountAccess(userDoc);

        if (access.blocked) {
            return res.status(access.statusCode || 403).json({ message: access.message || 'Access denied' });
        }

        req.user = {
            userId: String(userDoc._id),
            email: userDoc.email,
            role: String(userDoc.role || '').toLowerCase(),
            moderatorPermissions: Array.isArray(userDoc.moderatorPermissions) ? userDoc.moderatorPermissions : [],
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

export async function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userDoc = await User.findById(decoded.userId).select('email role moderatorPermissions accountStatus suspensionUntil accountActionReason accountActionAt accountActionBy');
        const access = await resolveAccountAccess(userDoc);

        if (access.blocked) {
            req.user = null;
            return next();
        }

        req.user = {
            userId: String(userDoc._id),
            email: userDoc.email,
            role: String(userDoc.role || '').toLowerCase(),
            moderatorPermissions: Array.isArray(userDoc.moderatorPermissions) ? userDoc.moderatorPermissions : [],
        };
    } catch {
        req.user = null;
    }

    next();
}

export function authorizeRoles(...allowedRoles) {
    const normalizedAllowedRoles = allowedRoles
        .flat()
        .map((role) => String(role || '').trim().toLowerCase())
        .filter(Boolean);

    return (req, res, next) => {
        const currentRole = String(req.user?.role || '').trim().toLowerCase();

        if (!currentRole) {
            return res.status(403).json({ message: 'User role missing in token' });
        }

        if (!normalizedAllowedRoles.includes(currentRole)) {
            return res.status(403).json({ message: 'Access denied: insufficient permissions' });
        }

        next();
    };
}
