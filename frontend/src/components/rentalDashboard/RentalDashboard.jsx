import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, CalendarDays, Heart, History, Send, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import DashboardHeader from './DashboardHeader';
import StatCard from './StatCard';
import RecentActivityItem from './RecentActivityItem';
import RevenueChartCard from './RevenueChartCard';
import { useToast } from '../../context/ToastContext';

const RentalDashboard = ({
  userName,
  loading,
  error,
  onRetry,
  stats,
  trendData,
  activities,
  favorites,
  history,
}) => {
  const [activeTab, setActiveTab] = useState('favorites');
  const [localFavorites, setLocalFavorites] = useState(favorites || []);
  const [localHistory, setLocalHistory] = useState(history || []);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { showToast } = useToast();

  const detailsRef = useRef(null);
  const hasActivities = activities.length > 0;

  useEffect(() => {
    setLocalFavorites(favorites || []);
  }, [favorites]);

  useEffect(() => {
    setLocalHistory(history || []);
  }, [history]);

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

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-4">
          <p className="text-sm text-gray-600">Welcome back,</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{userName}</h2>
        </div>

        <DashboardHeader />

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-gray-700 text-sm">Loading your renter dashboard...</div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((item) => (
                <StatCard
                  key={item.id}
                  title={item.title}
                  value={item.value}
                  trend={item.trend}
                  trendLabel={item.trendLabel}
                  color={item.color}
                  detailColor={item.detailColor}
                />
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <RevenueChartCard
                data={trendData}
                title="Engagement Trend"
                periodLabel="Monthly"
                summaryValue={`${trendData.reduce((sum, item) => sum + item.value, 0)}`}
                summaryText="activities this year"
              />

              <aside className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-8">Recent Activity</h3>
                {hasActivities ? (
                  <div className="space-y-8">
                    {activities.map((item) => (
                      <RecentActivityItem key={item.id} title={item.title} category={item.category} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent renter activity yet. Start by browsing listings.</p>
                )}
              </aside>
            </section>

            <section ref={detailsRef} className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Renter Workspace</h3>

              <div className="mb-6 flex flex-wrap gap-2">
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
              </div>

              {activeTab === 'favorites' && (
                localFavorites.length === 0 ? (
                  <p className="text-sm text-gray-500">No favorites yet. Save listings from the listing page to track them here.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localFavorites.map((item) => (
                      <article key={item._id || item.listingId} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{item.title || 'Listing'}</h4>
                        <p className="text-xs text-gray-600 mb-1">{item.location || 'Location not set'}</p>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-blue-600 font-semibold">Rs {Number(item.price || 0).toLocaleString()}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveFavorite(item)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'history' && (
                localHistory.length === 0 ? (
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
                    {localHistory.slice(0, 8).map((item) => (
                      <article key={item._id || item.listingId} className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title || 'Viewed Listing'}</h4>
                          <p className="text-xs text-gray-600">{item.location || 'Location not set'}</p>
                        </div>
                        <span className="text-[11px] text-gray-500">{item.viewedAt ? new Date(item.viewedAt).toLocaleString() : 'Recently viewed'}</span>
                      </article>
                    ))}
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
