import {
  Hospital,
  Pill,
  GraduationCap,
  Bus,
  Store,
  Landmark,
  UtensilsCrossed,
  Shield,
  Building2,
} from 'lucide-react';
import { getListingId } from './listingData';
import api from './api';

export function normalizeListing(rawListing) {
  if (!rawListing) return null;

  return {
    ...rawListing,
    listingId: getListingId(rawListing),
    source: rawListing.source || 'listing-details-page',
    bedrooms: Number(rawListing.bedrooms || 1),
    bathrooms: Number(rawListing.bathrooms || 1),
    areaSqFt: Number(rawListing.areaSqFt || 450),
    ownerName: rawListing.ownerName || 'Property Owner',
    ownerPhone: rawListing.ownerPhone || '',
    ownerEmail: rawListing.ownerEmail || '',
    ownerProfilePhoto: rawListing.ownerProfilePhoto || rawListing.owner?.profilePhoto || '',
    ownerIsVerified: Boolean(rawListing.ownerIsVerified),
  };
}

export function getListingImage(listing) {
  return String(listing?.image || listing?.images?.[0] || '').trim();
}

export const defaultKeyFeatures = [
  'Fully furnished',
  'Security System',
  'Balcony with view',
  'High-speed internet',
  'Kitchen appliances',
  'Laundry facilities',
];

export const defaultAreaHighlights = [
  '5 mins walk to Market',
  'Peaceful and secure area',
  '24/7 water and power',
];

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) {
    return 'Nearby';
  }

  if (meters < 1000) {
    return `${meters} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

export async function fetchDynamicAreaHighlights(input, options = {}) {
  const { signal } = options;
  const requestPayload = typeof input === 'object' && input !== null
    ? input
    : { locationText: input };

  const location = String(requestPayload.locationText || '').trim();
  const latitude = Number(requestPayload.latitude);
  const longitude = Number(requestPayload.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  if (!location && !hasCoordinates) {
    return [];
  }

  const params = hasCoordinates
    ? { location, latitude, longitude }
    : { location };

  const response = await api.get('/rooms/nearby-highlights', {
    signal,
    params,
  });

  const highlights = Array.isArray(response.data?.highlights) ? response.data.highlights : [];
  return highlights;
}

export function getPlaceVisuals(type) {
  const normalizedType = String(type || '').toLowerCase();

  if (['hospital', 'clinic'].includes(normalizedType)) {
    return { Icon: Hospital, badgeClass: 'bg-red-50 text-red-700 border-red-100' };
  }

  if (normalizedType === 'pharmacy') {
    return { Icon: Pill, badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' };
  }

  if (['school', 'college', 'university'].includes(normalizedType)) {
    return { Icon: GraduationCap, badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
  }

  if (['bus_station', 'station'].includes(normalizedType)) {
    return { Icon: Bus, badgeClass: 'bg-sky-50 text-sky-700 border-sky-100' };
  }

  if (['supermarket', 'marketplace', 'mall', 'convenience'].includes(normalizedType)) {
    return { Icon: Store, badgeClass: 'bg-orange-50 text-orange-700 border-orange-100' };
  }

  if (normalizedType === 'bank') {
    return { Icon: Landmark, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  }

  if (normalizedType === 'police') {
    return { Icon: Shield, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
  }

  if (['restaurant', 'cafe'].includes(normalizedType)) {
    return { Icon: UtensilsCrossed, badgeClass: 'bg-amber-50 text-amber-700 border-amber-100' };
  }

  return { Icon: Building2, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
}
