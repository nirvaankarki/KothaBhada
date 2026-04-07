export const MODERATOR_PERMISSIONS = [
    'user_management',
    'listing_moderation',
    'report_management',
    'review_moderation',
    'booking_oversight',
    'chat_monitoring',
    'analytics',
    'role_management',
    'kyc_review',
];

export function normalizePermissionList(input) {
    if (!Array.isArray(input)) return [];

    const normalized = input
        .map((entry) => String(entry || '').trim().toLowerCase())
        .filter(Boolean)
        .filter((entry) => MODERATOR_PERMISSIONS.includes(entry));

    return Array.from(new Set(normalized));
}

export function hasAdminPermission(user, permission) {
    const role = String(user?.role || '').trim().toLowerCase();
    if (role === 'admin') return true;
    if (role !== 'moderator') return false;

    const normalizedPermission = String(permission || '').trim().toLowerCase();
    const permissions = normalizePermissionList(user?.moderatorPermissions || []);

    return permissions.includes(normalizedPermission);
}
