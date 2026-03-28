import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Heart, History, Trash2, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import DashboardHeader from './DashboardHeader';
import StatCard from './StatCard';
import RecentActivityItem from './RecentActivityItem';
import RevenueChartCard from './RevenueChartCard';
import { useToast } from '../../context/ToastContext';

const formatTimeSlot = (value) => {
  const slot = String(value || '').toLowerCase();
  if (slot === 'morning') return 'Morning (9:00 AM to 12:00 PM)';
  if (slot === 'afternoon') return 'Afternoon (12:00 PM to 4:00 PM)';
  if (slot === 'evening') return 'Evening (4:00 PM to 6:00 PM)';
  if (!slot) return 'Not set';
  return slot.charAt(0).toUpperCase() + slot.slice(1);
};

const RentalDashboard = ({
  loading,
  error,
  onRetry,
  stats,
  trendData,
  activities,
  favorites,
  history,
  bookings,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('favorites');
  const [localFavorites, setLocalFavorites] = useState(favorites || []);
  const [localHistory, setLocalHistory] = useState(history || []);
  const [localBookings, setLocalBookings] = useState(bookings || []);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('pending');
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { showToast } = useToast();

  const detailsRef = useRef(null);
  const hasActivities = activities.length > 0;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  useEffect(() => {
    setLocalFavorites(favorites || []);
  }, [favorites]);

  useEffect(() => {
    setLocalHistory(history || []);
  }, [history]);

  useEffect(() => {
    setLocalBookings(bookings || []);
  }, [bookings]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tab = query.get('tab');
    const allowedTabs = new Set(['favorites', 'history', 'bookings']);
    if (tab && allowedTabs.has(tab)) {
      setActiveTab(tab);
    }

    if (tab === 'bookings') {
      requestAnimationFrame(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.search]);

  useEffect(() => {
    if (!error) return;
    showToast({ type: 'error', title: 'Dashboard error', message: error });
  }, [error, showToast]);

  const handleOpenTab = (tab) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleRemoveFavorite = async (item) => {
    const previousFavorites = localFavorites;
    setLocalFavorites((prev) => prev.filter((fav) => fav.listingId !== item.listingId));

    try {
      await api.post('/user/favorites/toggle', {
        listingId: item.listingId,
        title: item.title,
      });
      showToast({ type: 'success', title: 'Success', message: 'Favorite removed successfully.' });
      onRetry();
    } catch (err) {
      setLocalFavorites(previousFavorites);
      showToast({ type: 'error', title: 'Action failed', message: err?.response?.data?.message || 'Could not remove favorite.' });
    }
  };

  const handleRequestClearHistory = () => {
    if (localHistory.length === 0) return;
    setShowClearHistoryModal(true);
  };

  const handleConfirmClearHistory = async () => {
    const previousHistory = localHistory;
    setIsClearing(true);
    setLocalHistory([]);

    try {
      await api.delete('/user/history');
      showToast({ type: 'success', title: 'Success', message: 'Viewing history removed successfully.' });
      setShowClearHistoryModal(false);
      onRetry();
    } catch (err) {
      setLocalHistory(previousHistory);
      setShowClearHistoryModal(false);
      showToast({ type: 'error', title: 'Action failed', message: err?.response?.data?.message || 'Could not clear viewing history.' });
    } finally {
      setIsClearing(false);
    }
  };

  const handleCancelClearHistory = () => {
    setShowClearHistoryModal(false);
  };

  const categorizedBookings = useMemo(() => {
    return localBookings.reduce((acc, booking) => {
      const status = String(booking?.status || 'pending').toLowerCase();
      if (status === 'confirmed') {
        acc.confirmed.push(booking);
      } else if (status === 'declined') {
        acc.declined.push(booking);
      } else {
        acc.pending.push(booking);
      }
      return acc;
    }, { pending: [], confirmed: [], declined: [] });
  }, [localBookings]);

  const filteredBookings = useMemo(() => {
    return categorizedBookings[bookingStatusFilter] || [];
  }, [categorizedBookings, bookingStatusFilter]);

  const uniqueHistoryEntries = useMemo(() => {
    const seenListingIds = new Set();
    const uniqueItems = [];

    for (const item of localHistory) {
      const listingKey = String(item?.listingId || item?._id || '');
      if (!listingKey || seenListingIds.has(listingKey)) {
        continue;
      }

      seenListingIds.add(listingKey);
      uniqueItems.push(item);
    }

    return uniqueItems;
  }, [localHistory]);

  const renderBookingCard = (booking) => {
    const status = String(booking.status || 'pending').toLowerCase();
    const badgeClass = status === 'confirmed'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : status === 'declined'
        ? 'bg-rose-50 text-rose-800 border-rose-200'
        : 'bg-amber-50 text-amber-800 border-amber-200';
    const accentClass = status === 'confirmed'
      ? 'border-l-emerald-500'
      : status === 'declined'
        ? 'border-l-rose-500'
        : 'border-l-amber-500';
    return (
      <article key={booking._id} className={`rounded-2xl border border-gray-200 border-l-4 ${accentClass} bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-base font-bold text-gray-900 line-clamp-1">{booking.title || 'Property'}</h4>
            <p className="mt-1 text-xs font-medium text-gray-500">{booking.location || 'Visit update'}</p>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${badgeClass}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Visit date</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-800">
              {booking.preferredVisitDate ? new Date(booking.preferredVisitDate).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Time slot</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-800">{formatTimeSlot(booking.preferredTime)}</p>
          </div>
        </div>

        {status === 'confirmed' && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            Your booking request has been accepted.
          </p>
        )}

        {status === 'declined' && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
            Your booking request has been rejected.
          </p>
        )}

        {booking.ownerResponse && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Owner response</p>
            <p className="mt-1 text-sm text-gray-700 leading-relaxed">{booking.ownerResponse}</p>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{greeting}</h2>
        </div>

        <DashboardHeader />

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-gray-700 text-sm">Loading your renter dashboard...</div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-7">
              {stats.map((item) => (
                <StatCard
                  key={item.id}
                  title={item.title}
                  value={item.value}
                  trend={item.trend}
                  trendLabel={item.trendLabel}
                  color={item.color}
                  detailColor={item.detailColor}
                  onDetailClick={item.detailAction ? () => handleOpenTab(item.detailAction) : undefined}
                />
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
              <RevenueChartCard
                data={trendData}
                title="Engagement Trend"
                periodLabel="Monthly"
                summaryValue={`${trendData.reduce((sum, item) => sum + item.value, 0)}`}
                summaryText="activities this year"
              />

              <aside className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-5">Recent Activity</h3>
                {hasActivities ? (
                  <div className="space-y-3">
                    {activities.map((item) => (
                      <RecentActivityItem key={item.id} title={item.title} category={item.category} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent renter activity yet. Start by browsing listings.</p>
                )}
              </aside>
            </section>

            <section ref={detailsRef} className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
              <div className="mb-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Renter Workspace</h3>
                <p className="mt-1 text-sm text-gray-500">Manage saved properties, visits, and updates.</p>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('favorites')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'favorites' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="inline-flex items-center gap-2"><Heart size={14} /> Favorites</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="inline-flex items-center gap-2"><History size={14} /> History</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'bookings' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="inline-flex items-center gap-2"><CalendarDays size={14} /> Booking Confirmations</span>
                </button>
              </div>

              {activeTab === 'favorites' && (
                localFavorites.length === 0 ? (
                  <p className="text-sm text-gray-500">No favorites yet. Save listings from the listing page to track them here.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {localFavorites.map((item) => (
                      <article key={item._id || item.listingId} className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-base font-bold text-gray-900 line-clamp-1">{item.title || 'Listing'}</h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveFavorite(item)}
                            aria-label="Remove favorite"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          >
                            <Heart size={14} fill="currentColor" />
                          </button>
                        </div>

                        <p className="mt-2 text-sm text-gray-600 line-clamp-1">{item.location || 'Location not set'}</p>

                        <div className="mt-3.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500">Monthly Rent</p>
                          <p className="mt-0.5 text-sm font-bold text-gray-900">Rs {Number(item.price || 0).toLocaleString()}</p>
                        </div>

                        <p className="mt-3 text-[11px] text-gray-500">Saved listing</p>
                      </article>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'history' && (
                uniqueHistoryEntries.length === 0 ? (
                  <p className="text-sm text-gray-500">No viewing history yet.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleRequestClearHistory}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      >
                        Remove All History
                      </button>
                    </div>
                    {uniqueHistoryEntries.slice(0, 8).map((item) => (
                      <button
                        key={item._id || item.listingId}
                        type="button"
                        onClick={() => {
                          if (!item?.listingId) return;
                          navigate(`/listing-details?id=${encodeURIComponent(String(item.listingId))}`);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between gap-3 text-left hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title || 'Viewed Listing'}</h4>
                          <p className="text-xs text-gray-600">{item.location || 'Location not set'}</p>
                        </div>
                        <span className="text-[11px] text-gray-500">{item.viewedAt ? new Date(item.viewedAt).toLocaleString() : 'Recently viewed'}</span>
                      </button>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'bookings' && (
                localBookings.length === 0 ? (
                  <p className="text-sm text-gray-500">No booking confirmations yet.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingStatusFilter('pending')}
                        aria-pressed={bookingStatusFilter === 'pending'}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                          bookingStatusFilter === 'pending'
                            ? 'border-amber-300 bg-amber-50/60 text-slate-900 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        Pending
                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-1.5 text-[11px] font-medium text-amber-700">
                          {categorizedBookings.pending.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingStatusFilter('confirmed')}
                        aria-pressed={bookingStatusFilter === 'confirmed'}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                          bookingStatusFilter === 'confirmed'
                            ? 'border-emerald-300 bg-emerald-50/60 text-slate-900 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        Confirmed
                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-1.5 text-[11px] font-medium text-emerald-700">
                          {categorizedBookings.confirmed.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingStatusFilter('declined')}
                        aria-pressed={bookingStatusFilter === 'declined'}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                          bookingStatusFilter === 'declined'
                            ? 'border-rose-300 bg-rose-50/60 text-slate-900 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        Declined
                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-1.5 text-[11px] font-medium text-rose-700">
                          {categorizedBookings.declined.length}
                        </span>
                      </button>
                    </div>

                    {filteredBookings.length === 0 ? (
                      <p className="text-sm text-gray-500 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        No {bookingStatusFilter} requests.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredBookings.map((booking) => renderBookingCard(booking))}
                      </div>
                    )}
                  </div>
                )
              )}

            </section>
          </>
        )}
      </main>

      {showClearHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove all history?</h3>
            <p className="text-sm text-gray-600 mb-6">This will permanently delete your entire viewing history. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancelClearHistory}
                disabled={isClearing}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearHistory}
                disabled={isClearing}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isClearing && <Loader2 size={14} className="animate-spin" />}
                {isClearing ? 'Removing...' : 'Remove All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalDashboard;
