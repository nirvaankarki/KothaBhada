import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Heart, History, ShieldAlert, Trash2, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import DashboardHeader from './DashboardHeader';
import StatCard from './StatCard';
import RecentActivityItem from './RecentActivityItem';
import RevenueChartCard from './RevenueChartCard';
import ReportCenterPanel from '../shared/ReportCenterPanel';
import { useToast } from '../../context/ToastContext';

const formatTimeSlot = (value) => {
  const slot = String(value || '').toLowerCase();
  if (slot === 'morning') return 'Morning (9:00 AM to 12:00 PM)';
  if (slot === 'afternoon') return 'Afternoon (12:00 PM to 4:00 PM)';
  if (slot === 'evening') return 'Evening (4:00 PM to 6:00 PM)';
  if (!slot) return 'Not set';
  return slot.charAt(0).toUpperCase() + slot.slice(1);
};

const statusMetaMap = {
  pending: {
    label: 'Pending',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    mutedClass: 'text-gray-500',
  },
  confirmed: {
    label: 'Confirmed',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    mutedClass: 'text-gray-500',
  },
  declined: {
    label: 'Declined',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    mutedClass: 'text-gray-500',
  },
};

const getLastUpdatedValue = (booking) => booking?.updatedAt || booking?.createdAt || booking?.preferredVisitDate || '';

const formatLastUpdatedLabel = (value) => {
  if (!value) return 'Not updated yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not updated yet';

  return `Updated ${date.toLocaleString()}`;
};

const formatDateInputValue = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const createBookingEditDraft = (booking) => ({
  fullName: String(booking?.fullName || '').trim(),
  email: String(booking?.email || '').trim(),
  phone: String(booking?.phone || '').trim(),
  preferredVisitDate: formatDateInputValue(booking?.preferredVisitDate),
  preferredTime: String(booking?.preferredTime || '').trim(),
  moveInDate: formatDateInputValue(booking?.moveInDate),
  stayDurationMonths: String(booking?.stayDurationMonths || ''),
  occupants: String(booking?.occupants || ''),
  occupation: String(booking?.occupation || '').trim(),
  monthlyIncome: String(booking?.monthlyIncome || '').trim(),
  hasPets: String(booking?.hasPets || '').trim().toLowerCase(),
  reasonForMoving: String(booking?.reasonForMoving || '').trim(),
  note: String(booking?.note || '').trim(),
});

const BOOKING_WINDOW_OPTIONS = [
  { id: 'all', label: 'All Updates', hours: 0 },
  { id: '24h', label: 'Last 24 Hours', hours: 24 },
  { id: '48h', label: 'Last 48 Hours', hours: 48 },
  { id: '7d', label: 'Last 7 Days', hours: 168 },
];

const initialReportForm = {
  targetType: 'listing',
  targetId: '',
  reasonCategory: 'other',
  description: '',
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
  reports,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('favorites');
  const [localFavorites, setLocalFavorites] = useState(favorites || []);
  const [localHistory, setLocalHistory] = useState(history || []);
  const [localBookings, setLocalBookings] = useState(bookings || []);
  const [localReports, setLocalReports] = useState(reports || []);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('pending');
  const [selectedBookingWindow, setSelectedBookingWindow] = useState('all');
  const [editingBookingId, setEditingBookingId] = useState('');
  const [bookingEditDrafts, setBookingEditDrafts] = useState({});
  const [savingBookingId, setSavingBookingId] = useState('');
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
    setLocalReports(reports || []);
  }, [reports]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tab = query.get('tab');
    const allowedTabs = new Set(['favorites', 'history', 'bookings', 'reports']);
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

  const handleRefreshReports = async () => {
    setReportsLoading(true);

    try {
      const response = await api.get('/user/reports');
      setLocalReports(response.data?.reports || []);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Could not load reports',
        message: err?.response?.data?.message || 'Please try again later.',
      });
    } finally {
      setReportsLoading(false);
    }
  };

  const handleCreateReport = async (event) => {
    event.preventDefault();

    const description = String(reportForm.description || '').trim();
    if (!description) {
      showToast({ type: 'warning', title: 'Missing details', message: 'Please describe the issue before submitting.' });
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
        setLocalReports((prev) => [response.data.report, ...prev]);
      }

      setReportForm((prev) => ({
        ...prev,
        targetId: '',
        description: '',
      }));
      showToast({ type: 'success', title: 'Report submitted', message: 'Admin will review your report soon.' });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Submit failed',
        message: err?.response?.data?.message || 'Could not submit report.',
      });
    } finally {
      setReportSubmitting(false);
    }
  };

  const categorizedBookings = useMemo(() => {
    const selectedWindow = BOOKING_WINDOW_OPTIONS.find((option) => option.id === selectedBookingWindow) || BOOKING_WINDOW_OPTIONS[0];
    const recentCutoff = selectedWindow.hours > 0
      ? Date.now() - (selectedWindow.hours * 60 * 60 * 1000)
      : 0;

    const sourceBookings = selectedWindow.hours > 0
      ? localBookings.filter((booking) => {
          const updatedValue = getLastUpdatedValue(booking);
          const updatedDate = new Date(updatedValue || 0);
          if (Number.isNaN(updatedDate.getTime())) return false;
          return updatedDate.getTime() >= recentCutoff;
        })
      : localBookings;

    const orderedBookings = [...sourceBookings].sort((a, b) => new Date(getLastUpdatedValue(b) || 0) - new Date(getLastUpdatedValue(a) || 0));

    return orderedBookings.reduce((acc, booking) => {
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
  }, [localBookings, selectedBookingWindow]);

  const filteredBookings = useMemo(() => {
    return categorizedBookings[bookingStatusFilter] || [];
  }, [categorizedBookings, bookingStatusFilter]);

  const recentStatusHighlights = useMemo(() => {
    const buildHighlight = (statusKey) => {
      const list = categorizedBookings[statusKey] || [];
      const latest = list[0] || null;
      return {
        key: statusKey,
        count: list.length,
        latest,
      };
    };

    return [buildHighlight('pending'), buildHighlight('confirmed'), buildHighlight('declined')];
  }, [categorizedBookings]);

  const activeBookingWindowLabel = useMemo(() => {
    const selectedWindow = BOOKING_WINDOW_OPTIONS.find((option) => option.id === selectedBookingWindow);
    return selectedWindow?.label || 'All Updates';
  }, [selectedBookingWindow]);

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

  const setBookingEditField = (bookingId, field, value) => {
    if (!bookingId || !field) return;

    setBookingEditDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        [field]: value,
      },
    }));
  };

  const handleStartBookingEdit = (booking) => {
    if (!booking?._id) return;

    const status = String(booking?.status || 'pending').toLowerCase();
    if (status !== 'pending') {
      showToast({
        type: 'warning',
        title: 'Cannot edit',
        message: 'Only pending booking requests can be edited.',
      });
      return;
    }

    const bookingId = String(booking._id);
    setEditingBookingId(bookingId);
    setBookingEditDrafts((prev) => ({
      ...prev,
      [bookingId]: prev[bookingId] || createBookingEditDraft(booking),
    }));
  };

  const handleCancelBookingEdit = (bookingId) => {
    if (!bookingId) return;
    setEditingBookingId((prev) => (prev === bookingId ? '' : prev));
  };

  const handleSaveBookingEdit = async (bookingId) => {
    const draft = bookingEditDrafts[bookingId];
    if (!draft) return;

    const payload = {
      fullName: String(draft.fullName || '').trim(),
      email: String(draft.email || '').trim(),
      phone: String(draft.phone || '').trim(),
      preferredVisitDate: draft.preferredVisitDate,
      preferredTime: String(draft.preferredTime || '').trim(),
      moveInDate: draft.moveInDate,
      stayDurationMonths: Number(draft.stayDurationMonths || 0),
      occupants: Number(draft.occupants || 0),
      occupation: String(draft.occupation || '').trim(),
      monthlyIncome: String(draft.monthlyIncome || '').trim(),
      hasPets: String(draft.hasPets || '').trim().toLowerCase(),
      reasonForMoving: String(draft.reasonForMoving || '').trim(),
      note: String(draft.note || '').trim(),
    };

    setSavingBookingId(bookingId);

    try {
      const response = await api.patch(`/user/bookings/${bookingId}`, payload);
      const updatedBooking = response.data?.booking;

      if (updatedBooking) {
        setLocalBookings((prev) => prev.map((item) => (
          item._id === bookingId ? updatedBooking : item
        )));
      }

      setEditingBookingId('');
      setBookingEditDrafts((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });

      showToast({
        type: 'success',
        title: 'Request updated',
        message: 'Your pending booking request has been updated.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Update failed',
        message: err?.response?.data?.message || 'Could not update this booking request.',
      });
    } finally {
      setSavingBookingId('');
    }
  };

  const renderBookingCard = (booking, options = {}) => {
    const status = String(booking.status || 'pending').toLowerCase();
    const isEditing = editingBookingId === booking._id;
    const bookingDraft = bookingEditDrafts[booking._id] || {};
    const isSaving = savingBookingId === booking._id;
    const canEdit = status === 'pending';
    const { isMostRecent = false } = options;
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
      <article key={booking._id} className={`rounded-2xl border border-gray-200 border-l-4 ${accentClass} ${isMostRecent ? 'ring-1 ring-[#3A5AFF]/40' : ''} bg-white p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-base font-bold text-gray-900 line-clamp-1">{booking.title || 'Property'}</h4>
            <p className="mt-1 text-xs font-medium text-gray-500">{booking.location || 'Visit update'}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${badgeClass}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
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

        {canEdit && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              You can edit this request while its status is pending.
            </p>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => handleStartBookingEdit(booking)}
                className="rounded-md border border-[#3A5AFF] bg-white px-3 py-1.5 text-xs font-semibold text-[#3A5AFF] hover:bg-[#3A5AFF]/5"
              >
                Edit Request
              </button>
            ) : null}
          </div>
        )}

        {isEditing && (
          <div className="mt-4 rounded-xl border border-[#3A5AFF]/30 bg-[#3A5AFF]/5 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3A5AFF]">Edit your pending request</p>

            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="text-xs text-gray-600">
                Full name
                <input
                  type="text"
                  value={bookingDraft.fullName || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'fullName', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                />
              </label>

              <label className="text-xs text-gray-600">
                Email
                <input
                  type="email"
                  value={bookingDraft.email || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'email', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                />
              </label>

              <label className="text-xs text-gray-600">
                Phone
                <input
                  type="text"
                  value={bookingDraft.phone || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'phone', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                />
              </label>

              <label className="text-xs text-gray-600">
                Preferred visit date
                <input
                  type="date"
                  value={bookingDraft.preferredVisitDate || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'preferredVisitDate', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                />
              </label>

              <label className="text-xs text-gray-600">
                Preferred time
                <select
                  value={bookingDraft.preferredTime || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'preferredTime', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                >
                  <option value="">Select time</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </label>

              <label className="text-xs text-gray-600">
                Move-in date
                <input
                  type="date"
                  value={bookingDraft.moveInDate || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'moveInDate', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                />
              </label>

              <label className="text-xs text-gray-600">
                Stay duration (months)
                <input
                  type="number"
                  min={1}
                  value={bookingDraft.stayDurationMonths || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'stayDurationMonths', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                />
              </label>

              <label className="text-xs text-gray-600">
                Occupants
                <input
                  type="number"
                  min={1}
                  value={bookingDraft.occupants || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'occupants', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                />
              </label>

              <label className="text-xs text-gray-600">
                Occupation
                <input
                  type="text"
                  value={bookingDraft.occupation || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'occupation', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                />
              </label>

              <label className="text-xs text-gray-600">
                Monthly income
                <input
                  type="text"
                  value={bookingDraft.monthlyIncome || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'monthlyIncome', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                />
              </label>

              <label className="text-xs text-gray-600">
                Pets
                <select
                  value={bookingDraft.hasPets || ''}
                  onChange={(event) => setBookingEditField(booking._id, 'hasPets', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>

            <label className="mt-2.5 block text-xs text-gray-600">
              Reason for moving
              <textarea
                rows={2}
                value={bookingDraft.reasonForMoving || ''}
                onChange={(event) => setBookingEditField(booking._id, 'reasonForMoving', event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
              />
            </label>

            <label className="mt-2.5 block text-xs text-gray-600">
              Additional note
              <textarea
                rows={2}
                value={bookingDraft.note || ''}
                onChange={(event) => setBookingEditField(booking._id, 'note', event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A5AFF]/35"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSaveBookingEdit(booking._id)}
                disabled={isSaving}
                className="rounded-md bg-[#3A5AFF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#3150e0] disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                type="button"
                onClick={() => handleCancelBookingEdit(booking._id)}
                disabled={isSaving}
                className="rounded-md border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-gray-500">{formatLastUpdatedLabel(getLastUpdatedValue(booking))}</p>
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
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'reports' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="inline-flex items-center gap-2"><ShieldAlert size={14} /> Reports</span>
                </button>
              </div>

              {activeTab === 'favorites' && (
                localFavorites.length === 0 ? (
                  <p className="text-sm text-gray-500">No favorites yet. Save listings from the listing page to track them here.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {localFavorites.map((item) => {
                      const has2DRoom = Boolean(String(item?.image || '').trim() || (Array.isArray(item?.images) && item.images.length));
                      const has3DRoomTour = Boolean(String(item?.model3dUrl || '').trim());

                      return (
                      <article key={item._id || item.listingId} className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                        {(has2DRoom || has3DRoomTour) && (
                          <div className="mb-2">
                            <div className="inline-flex items-center gap-1.5 flex-wrap">
                              {has2DRoom && (
                                <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-sky-700 border border-sky-200">
                                  2D Room
                                </span>
                              )}
                              {has3DRoomTour && (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-emerald-700 border border-emerald-200">
                                  3D Room Tour
                                </span>
                              )}
                            </div>
                            <div className="mt-2 border-t border-gray-100" />
                          </div>
                        )}

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

                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <p className="text-[11px] text-gray-500">Saved listing</p>
                        </div>
                      </article>
                      );
                    })}
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
                    {uniqueHistoryEntries.slice(0, 8).map((item) => {
                      const has2DRoom = Boolean(String(item?.image || '').trim() || (Array.isArray(item?.images) && item.images.length));
                      const has3DRoomTour = Boolean(String(item?.model3dUrl || '').trim());

                      return (
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
                          {(has2DRoom || has3DRoomTour) && (
                            <div className="mb-2">
                              <div className="inline-flex items-center gap-1.5 flex-wrap">
                                {has2DRoom && (
                                  <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sky-700 border border-sky-200">
                                    2D Room
                                  </span>
                                )}
                                {has3DRoomTour && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 border border-emerald-200">
                                    3D Room Tour
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 border-t border-gray-100" />
                            </div>
                          )}

                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title || 'Viewed Listing'}</h4>
                          <p className="mt-1 text-xs text-gray-600">{item.location || 'Location not set'}</p>
                        </div>
                        <span className="text-[11px] text-gray-500">{item.viewedAt ? new Date(item.viewedAt).toLocaleString() : 'Recently viewed'}</span>
                      </button>
                      );
                    })}
                  </div>
                )
              )}

              {activeTab === 'bookings' && (
                localBookings.length === 0 ? (
                  <p className="text-sm text-gray-500">No booking confirmations yet.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Recent update window</p>
                        <p className="text-[11px] text-gray-500">Quickly focus booking confirmations by latest update time.</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {BOOKING_WINDOW_OPTIONS.map((option) => {
                          const isActive = selectedBookingWindow === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setSelectedBookingWindow(option.id)}
                              aria-pressed={isActive}
                              className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors ${
                                isActive
                                  ? 'border-[#3A5AFF] bg-[#3A5AFF]/10 text-[#3A5AFF]'
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-gray-900">Recent Booking Status Updates</h4>
                        <p className="text-[11px] text-gray-500">Latest updates are highlighted first</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {recentStatusHighlights.map((item) => {
                          const meta = statusMetaMap[item.key] || statusMetaMap.pending;
                          const isStatusActive = bookingStatusFilter === item.key;

                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setBookingStatusFilter(item.key)}
                              className={`text-left rounded-xl border px-3 py-3 transition-colors ${
                                isStatusActive
                                  ? 'border-[#3A5AFF] bg-[#3A5AFF]/5'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}>
                                  {meta.label}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                              </div>

                              <p className="mt-2 text-xs font-semibold text-gray-800 line-clamp-1">
                                {item.latest?.title || `No ${meta.label.toLowerCase()} bookings yet`}
                              </p>
                              <p className={`mt-1 text-[11px] line-clamp-1 ${meta.mutedClass}`}>
                                {item.latest
                                  ? formatLastUpdatedLabel(getLastUpdatedValue(item.latest))
                                  : 'Waiting for updates'}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {filteredBookings.length === 0 ? (
                      <p className="text-sm text-gray-500 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        {selectedBookingWindow === 'all'
                          ? `No ${bookingStatusFilter} requests.`
                          : `No ${bookingStatusFilter} requests in ${activeBookingWindowLabel.toLowerCase()}.`}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredBookings.map((booking, index) => renderBookingCard(booking, { isMostRecent: index === 0 }))}
                      </div>
                    )}
                  </div>
                )
              )}

              {activeTab === 'reports' && (
                <ReportCenterPanel
                  title="Renter Report Center"
                  subtitle="Report suspicious listings, users, or interactions and track admin decisions."
                  reportForm={reportForm}
                  onReportFormChange={(field, value) => setReportForm((prev) => ({ ...prev, [field]: value }))}
                  handleCreateReport={handleCreateReport}
                  reportSubmitting={reportSubmitting}
                  reports={localReports}
                  reportsLoading={reportsLoading}
                  handleRefreshReports={handleRefreshReports}
                  emptyMessage="No reports submitted yet from your renter account."
                />
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
