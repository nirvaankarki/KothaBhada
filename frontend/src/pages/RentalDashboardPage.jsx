import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import RentalDashboard from '../components/rentalDashboard/RentalDashboard';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildTrendData = (history = [], favorites = []) => {
  const byMonth = monthLabels.map((name) => ({ name, value: 0 }));

  const countByDate = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return;
    const month = date.getMonth();
    byMonth[month].value += 1;
  };

  history.forEach((item) => countByDate(item.viewedAt));
  favorites.forEach((item) => countByDate(item.createdAt || item.updatedAt));

  return byMonth;
};

const getRecentActivities = (favorites = [], history = []) => {
  const combined = [
    ...history.map((item) => ({
      id: `history-${item._id || item.listingId}`,
      title: item.title || 'Viewed Listing',
      category: item.location || 'Recently viewed',
      createdAt: item.viewedAt || item.createdAt,
    })),
    ...favorites.map((item) => ({
      id: `favorite-${item._id || item.listingId}`,
      title: item.title || 'Favorite Listing',
      category: item.location || 'Saved property',
      createdAt: item.createdAt || item.updatedAt,
    })),
  ];

  return combined
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);
};

const RentalDashboardPage = () => {
  const { user } = useAuth();
  const userName = user?.name || 'Yasmine';

  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useAutoDismiss(error, () => setError(''));

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError('');

      try {
        const [favoritesRes, historyRes] = await Promise.all([
          api.get('/user/favorites'),
          api.get('/user/history'),
        ]);

        setFavorites(favoritesRes.data?.favorites || []);
        setHistory(historyRes.data?.history || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load renter dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [refreshKey]);

  const stats = useMemo(() => {
    return [
      {
        id: 'favorites',
        title: 'Saved Listings',
        value: String(favorites.length),
        trend: `${history.length}`,
        trendLabel: 'views tracked',
        color: 'bg-emerald-500',
        detailColor: 'bg-emerald-400/50',
      },
    ];
  }, [favorites.length, history.length]);

  const trendData = useMemo(() => buildTrendData(history, favorites), [history, favorites]);
  const activities = useMemo(() => getRecentActivities(favorites, history), [favorites, history]);

  return (
    <RentalDashboard
      userName={userName}
      loading={loading}
      error={error}
      onRetry={() => setRefreshKey((prev) => prev + 1)}
      stats={stats}
      trendData={trendData}
      activities={activities}
      favorites={favorites}
      history={history}
    />
  );
};

export default RentalDashboardPage;
