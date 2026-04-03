export async function resolveAccountAccess(userDoc) {
  if (!userDoc) {
    return {
      blocked: true,
      statusCode: 401,
      message: 'User not found for token',
    };
  }

  const currentStatus = String(userDoc.accountStatus || 'active').toLowerCase();
  if (currentStatus === 'active') {
    return { blocked: false, status: 'active' };
  }

  if (currentStatus === 'suspended') {
    const suspensionUntil = userDoc.suspensionUntil ? new Date(userDoc.suspensionUntil) : null;
    const now = new Date();

    if (suspensionUntil && suspensionUntil.getTime() <= now.getTime()) {
      userDoc.accountStatus = 'active';
      userDoc.suspensionUntil = null;
      userDoc.accountActionReason = '';
      userDoc.accountActionBy = null;
      userDoc.accountActionAt = null;
      await userDoc.save();

      return { blocked: false, status: 'active' };
    }

    return {
      blocked: true,
      statusCode: 403,
      message: suspensionUntil
        ? `Your account is suspended until ${suspensionUntil.toLocaleString()}.`
        : 'Your account is suspended. Please contact support.',
    };
  }

  return {
    blocked: true,
    statusCode: 403,
    message: 'Your account is banned. Please contact support.',
  };
}
