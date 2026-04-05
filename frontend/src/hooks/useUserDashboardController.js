import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAutoDismiss } from './useAutoDismiss';
import { useToast } from '../context/ToastContext';

const allowedTabs = new Set(['favorites', 'history', 'inquiries', 'bookings', 'reports']);

const initialInquiryForm = {
  listingId: '',
  title: '',
  location: '',
  price: '',
  image: '',
  ownerName: '',
  ownerContact: '',
  message: '',
};

const initialBookingForm = {
  listingId: '',
  title: '',
  location: '',
  price: '',
  image: '',
  fullName: '',
  email: '',
  phone: '',
  preferredVisitDate: '',
  preferredTime: '',
  moveInDate: '',
  stayDurationMonths: '12',
  occupants: '1',
  occupation: '',
  monthlyIncome: '',
  hasPets: '',
  reasonForMoving: '',
  note: '',
};

const initialReportForm = {
  targetType: 'listing',
  targetId: '',
  reasonCategory: 'other',
  description: '',
};

export const useUserDashboardController = () => {
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get('tab');
  const initialTab = allowedTabs.has(queryTab) ? queryTab : 'favorites';
  const { showToast } = useToast();

  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [pendingFavoriteRemoval, setPendingFavoriteRemoval] = useState(null);
  const [inquiryForm, setInquiryForm] = useState(initialInquiryForm);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [replyDrafts, setReplyDrafts] = useState({});

  const bookingStatusMapRef = useRef({});
  const hasInitializedBookingMapRef = useRef(false);

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

  useEffect(() => {
    if (allowedTabs.has(queryTab)) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  useEffect(() => {
    if (!error) return;
    showToast({ type: 'error', title: 'Dashboard error', message: error });
  }, [error, showToast]);

  useEffect(() => {
    if (!success) return;
    showToast({ type: 'success', title: 'Success', message: success });
  }, [success, showToast]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError('');
      try {
        const [favoritesRes, historyRes, inquiriesRes, bookingsRes, reportsRes] = await Promise.all([
          api.get('/user/favorites'),
          api.get('/user/history'),
          api.get('/user/inquiries'),
          api.get('/user/bookings'),
          api.get('/user/reports'),
        ]);

        setFavorites(favoritesRes.data?.favorites || []);
        setHistory(historyRes.data?.history || []);
        setInquiries(inquiriesRes.data?.inquiries || []);
        const initialBookings = bookingsRes.data?.bookings || [];
        setBookings(initialBookings);
        setReports(reportsRes.data?.reports || []);
        bookingStatusMapRef.current = initialBookings.reduce((acc, booking) => {
          if (booking?._id) {
            acc[booking._id] = booking.status || 'pending';
          }
          return acc;
        }, {});
        hasInitializedBookingMapRef.current = true;
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load your dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!hasInitializedBookingMapRef.current) return;

    const pollBookings = async () => {
      try {
        const response = await api.get('/user/bookings');
        const latestBookings = response.data?.bookings || [];
        setBookings(latestBookings);

        const nextMap = {};

        latestBookings.forEach((booking) => {
          if (!booking?._id) return;

          const latestStatus = booking.status || 'pending';
          const previousStatus = bookingStatusMapRef.current[booking._id] || 'pending';

          if (latestStatus !== previousStatus && ['confirmed', 'declined'].includes(latestStatus)) {
            showToast({
              type: latestStatus === 'confirmed' ? 'success' : 'error',
              title: latestStatus === 'confirmed' ? 'Booking Accepted' : 'Booking Rejected',
              message: latestStatus === 'confirmed'
                ? `Your booking for ${booking.title || 'this property'} was accepted by the landlord.`
                : `Your booking for ${booking.title || 'this property'} was rejected by the landlord.`,
            });
          }

          nextMap[booking._id] = latestStatus;
        });

        bookingStatusMapRef.current = nextMap;
      } catch {
        // Silent polling failure to avoid noisy dashboard errors.
      }
    };

    const intervalId = setInterval(pollBookings, 15000);

    return () => clearInterval(intervalId);
  }, [showToast]);

  const sourceListings = useMemo(() => {
    return [...favorites, ...history].reduce((acc, item) => {
      if (!acc.find((entry) => entry.listingId === item.listingId)) {
        acc.push(item);
      }
      return acc;
    }, []);
  }, [favorites, history]);

  const executeRemoveFavorite = async (item) => {
    setError('');
    setSuccess('');
    try {
      await api.post('/user/favorites/toggle', {
        listingId: item.listingId,
        title: item.title,
      });
      setFavorites((prev) => prev.filter((fav) => fav.listingId !== item.listingId));
      setSuccess('Favorite removed successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not remove favorite');
    }
  };

  const handleRemoveFavoriteRequest = (item) => {
    if (!item?.listingId) return;
    setPendingFavoriteRemoval(item);
  };

  const handleCancelRemoveFavorite = () => {
    setPendingFavoriteRemoval(null);
  };

  const handleConfirmRemoveFavorite = async () => {
    const item = pendingFavoriteRemoval;
    if (!item) return;

    setPendingFavoriteRemoval(null);
    await executeRemoveFavorite(item);
  };

  const handleClearHistoryRequest = () => {
    if (history.length === 0) return;
    setShowClearHistoryConfirm(true);
  };

  const handleConfirmClearHistory = async () => {
    setShowClearHistoryConfirm(false);
    setError('');
    setSuccess('');

    try {
      await api.delete('/user/history');
      setHistory([]);
      setSuccess('Viewing history removed successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not remove viewing history');
    }
  };

  const handleListingSelectForInquiry = (listingId) => {
    const selected = sourceListings.find((item) => item.listingId === listingId);
    if (!selected) return;

    setInquiryForm((prev) => ({
      ...prev,
      listingId: selected.listingId,
      title: selected.title,
      location: selected.location,
      price: selected.price,
      image: selected.image,
    }));
  };

  const handleListingSelectForBooking = (listingId) => {
    const selected = sourceListings.find((item) => item.listingId === listingId);
    if (!selected) return;

    setBookingForm((prev) => ({
      ...prev,
      listingId: selected.listingId,
      title: selected.title,
      location: selected.location,
      price: selected.price,
      image: selected.image,
    }));
  };

  const handleCreateInquiry = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/user/inquiries', inquiryForm);
      setInquiries((prev) => [response.data.inquiry, ...prev]);
      setInquiryForm((prev) => ({
        ...prev,
        ownerName: '',
        ownerContact: '',
        message: '',
      }));
      setSuccess('Inquiry sent successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send inquiry');
    }
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/user/bookings', bookingForm);
      setBookings((prev) => [response.data.booking, ...prev]);
      setBookingForm((prev) => ({
        ...prev,
        fullName: '',
        email: '',
        phone: '',
        preferredVisitDate: '',
        preferredTime: '',
        moveInDate: '',
        stayDurationMonths: '12',
        occupants: '1',
        occupation: '',
        monthlyIncome: '',
        hasPets: '',
        reasonForMoving: '',
        note: '',
      }));
      setSuccess('Booking request sent successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send booking request');
    }
  };

  const handleSendReply = async (inquiryId) => {
    const message = replyDrafts[inquiryId]?.trim();
    if (!message) return;

    setError('');

    try {
      const response = await api.post(`/user/inquiries/${inquiryId}/messages`, { message });
      setInquiries((prev) => prev.map((item) => (item._id === inquiryId ? response.data.inquiry : item)));
      setReplyDrafts((prev) => ({ ...prev, [inquiryId]: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send message');
    }
  };

  const refreshReports = async () => {
    setReportsLoading(true);
    try {
      const response = await api.get('/user/reports');
      setReports(response.data?.reports || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleCreateReport = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const description = String(reportForm.description || '').trim();
    if (!description) {
      setError('Please provide report details before submitting.');
      return;
    }

    setReportSubmitting(true);
    try {
      const payload = {
        targetType: String(reportForm.targetType || 'other').trim(),
        targetId: String(reportForm.targetId || '').trim(),
        reasonCategory: String(reportForm.reasonCategory || 'other').trim(),
        description,
      };

      const response = await api.post('/user/reports', payload);
      if (response.data?.report) {
        setReports((prev) => [response.data.report, ...prev]);
      }

      setReportForm((prev) => ({
        ...prev,
        targetId: '',
        description: '',
      }));
      setSuccess('Report submitted successfully. Admin will review it soon.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const statusPill = (status) => {
    const statusMap = {
      open: 'bg-blue-50 text-blue-700',
      responded: 'bg-green-50 text-green-700',
      closed: 'bg-gray-100 text-gray-600',
      pending: 'bg-amber-50 text-amber-700',
      confirmed: 'bg-green-50 text-green-700',
      declined: 'bg-red-50 text-red-700',
      cancelled: 'bg-gray-100 text-gray-600',
    };

    return statusMap[status] || 'bg-gray-100 text-gray-600';
  };

  const formatStatusLabel = (status) => {
    const normalized = String(status || 'pending');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  return {
    favorites,
    history,
    inquiries,
    bookings,
    reports,
    loading,
    reportsLoading,
    reportSubmitting,
    activeTab,
    setActiveTab,
    showClearHistoryConfirm,
    setShowClearHistoryConfirm,
    pendingFavoriteRemoval,
    inquiryForm,
    setInquiryForm,
    bookingForm,
    setBookingForm,
    reportForm,
    setReportForm,
    replyDrafts,
    setReplyDrafts,
    sourceListings,
    handleRemoveFavoriteRequest,
    handleCancelRemoveFavorite,
    handleConfirmRemoveFavorite,
    handleClearHistoryRequest,
    handleConfirmClearHistory,
    handleListingSelectForInquiry,
    handleListingSelectForBooking,
    handleCreateInquiry,
    handleCreateBooking,
    handleSendReply,
    handleCreateReport,
    refreshReports,
    statusPill,
    formatStatusLabel,
  };
};
