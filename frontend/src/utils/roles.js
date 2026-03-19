export const normalizeRole = (role) => String(role || '').trim().toLowerCase();

export const getRoleFromToken = (token) => {
  if (!token || typeof token !== 'string') return '';

  try {
    const parts = token.split('.');
    if (parts.length < 2) return '';

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const payloadJson = atob(padded);
    const payload = JSON.parse(payloadJson);
    return normalizeRole(payload?.role);
  } catch {
    return '';
  }
};

export const resolveRole = (role, token) => {
  const tokenRole = getRoleFromToken(token);
  if (tokenRole) return tokenRole;
  return normalizeRole(role);
};

export const isLandlordRole = (role) => normalizeRole(role) === 'landlord';

export const hasAllowedRole = (role, allowedRoles = []) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return true;
  }

  const normalizedRole = normalizeRole(role);
  return allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === normalizedRole);
};
