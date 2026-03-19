export const FALLBACK_LISTINGS = [
  {
    _id: 'fallback-1',
    title: 'Bright Studio Room',
    location: 'Baneshwor, Kathmandu',
    price: 14000,
    description: 'Cozy studio room near the main road and public transport.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'fallback-2',
    title: 'Family Flat with Balcony',
    location: 'Lalitpur, Jawalakhel',
    price: 28000,
    description: 'Two-bedroom flat with airy rooms and balcony access.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'fallback-3',
    title: 'Budget Single Room',
    location: 'Kirtipur, Kathmandu',
    price: 9000,
    description: 'Affordable single room for students and working professionals.',
    createdAt: new Date().toISOString(),
  },
];

export function getListingId(listing) {
  return String(listing?._id || listing?.id || listing?.title || '').trim();
}
