const stringify = (value) => String(value || '').toLowerCase();

export const getNotificationTargetPath = ({ notification, isLandlord = false }) => {
  const type = stringify(notification?.type);
  const listingId = notification?.metadata?.listingId;
  const chatId = notification?.metadata?.chatId;

  if (isLandlord) {
    if (type.includes('booking')) {
      return '/landlord/dashboard?tab=bookings';
    }

    if (type.includes('chat')) {
      const query = new URLSearchParams({ tab: 'chat' });
      if (chatId) {
        query.set('chatId', String(chatId));
      }
      return `/landlord/dashboard?${query.toString()}`;
    }

    if (type.includes('inquiry')) {
      if (listingId) {
        return `/listing-details?id=${encodeURIComponent(String(listingId))}`;
      }
      return '/landlord/dashboard?tab=listings';
    }

    return '/landlord/dashboard';
  }

  if (type.includes('booking')) {
    return '/rental/dashboard?tab=bookings';
  }

  if (type.includes('inquiry')) {
    return '/rental/requests?tab=inquiries';
  }

  if (type.includes('chat')) {
    if (listingId) {
      return `/listing-details?id=${encodeURIComponent(String(listingId))}&tab=chat`;
    }
    return '/rental/requests?tab=inquiries';
  }

  if (type.includes('review') && listingId) {
    return `/listing-details?id=${encodeURIComponent(String(listingId))}&tab=reviews`;
  }

  return '/rental/dashboard';
};