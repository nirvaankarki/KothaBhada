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

  const normalizedRole = normalizeRole(role);
  if (normalizedRole) return normalizedRole;
  return '';
};

export const isLandlordRole = (role) => normalizeRole(role) === 'landlord';

export const isAdminRole = (role) => normalizeRole(role) === 'admin';

export const getDashboardPathByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'admin') return '/admin/dashboard';
  if (normalizedRole === 'landlord') return '/landlord/dashboard';
  return '/rental/dashboard';
};

export const hasAllowedRole = (role, allowedRoles = []) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return true;
  }

  const normalizedRole = normalizeRole(role);
  return allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === normalizedRole);
};
