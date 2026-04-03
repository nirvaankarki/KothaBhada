import React, { useEffect, useMemo, useState } from 'react';
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
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useAutoDismiss(error, () => setError(''));

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError('');

      try {
          const [favoritesRes, historyRes, bookingsRes, reportsRes] = await Promise.all([
          api.get('/user/favorites'),
          api.get('/user/history'),
          api.get('/user/bookings'),
          api.get('/user/reports'),
        ]);

        setFavorites(favoritesRes.data?.favorites || []);
        setHistory(historyRes.data?.history || []);
        setBookings(bookingsRes.data?.bookings || []);
        setReports(reportsRes.data?.reports || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load renter dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [refreshKey]);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((item) => String(item?.status || '').toLowerCase() === 'confirmed').length;
    const pendingBookings = bookings.filter((item) => String(item?.status || '').toLowerCase() === 'pending').length;

    return [
      {
        id: 'favorites',
        title: 'Saved Listings',
        value: String(favorites.length),
        trend: `${history.length}`,
        trendLabel: 'views',
        color: 'bg-blue-600',
        detailColor: 'bg-blue-500/50',
        detailAction: 'favorites',
      },
      {
        id: 'bookings',
        title: 'Booking Requests',
        value: String(totalBookings),
        trend: `${pendingBookings}`,
        trendLabel: 'pending',
        color: 'bg-amber-500',
        detailColor: 'bg-amber-400/50',
        detailAction: 'bookings',
      },
      {
        id: 'confirmed-bookings',
        title: 'Confirmed Visits',
        value: String(confirmedBookings),
        trend: `${totalBookings}`,
        trendLabel: 'total',
        color: 'bg-teal-600',
        detailColor: 'bg-teal-500/50',
        detailAction: 'bookings',
      },
    ];
  }, [favorites.length, history.length, bookings]);

  const trendData = useMemo(() => buildTrendData(history, favorites), [history, favorites]);
  const activities = useMemo(() => getRecentActivities(favorites, history), [favorites, history]);

  return (
    <RentalDashboard
      loading={loading}
      error={error}
      onRetry={() => setRefreshKey((prev) => prev + 1)}
      stats={stats}
      trendData={trendData}
      activities={activities}
      favorites={favorites}
      history={history}
      bookings={bookings}
      reports={reports}
    />
  );
};

export default RentalDashboardPage;
