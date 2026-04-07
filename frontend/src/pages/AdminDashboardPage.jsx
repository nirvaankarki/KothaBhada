import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Home,
  LayoutDashboard,
  ShieldAlert,
  Users,
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/landlordDashboard/DashboardHeader';

const adminTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'Listings', icon: Home },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: ShieldAlert },
];

const adminHeaderMeta = {
  overview: {
    title: 'Overview',
    subtitle: 'See the platform pulse with only critical moderation and safety metrics.',
  },
  listings: {
    title: 'Listing Moderation',
    subtitle: 'Approve or reject listings with clear owner context and reason tracking.',
  },
  users: {
    title: 'User Management',
    subtitle: 'Handle account access states for renters, landlords, and moderators.',
  },
  reports: {
    title: 'Report Center',
    subtitle: 'Review abuse reports and apply quick safety actions where needed.',
  },
};

const defaultSummary = {
  totalUsers: 0,
  activeRooms: 0,
  totalListings: 0,
  pendingListings: 0,
  openReports: 0,
  suspendedUsers: 0,
};

const listingFilterOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

const userFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'user', label: 'Renters' },
  { value: 'landlord', label: 'Landlords' },
  { value: 'moderator', label: 'Moderators' },
];

const reportFilterOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
];

const initialActionModal = {
  open: false,
  kind: '',
  payload: null,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  confirmVariant: 'primary',
  requireReason: false,
  reasonLabel: 'Reason',
  reasonPlaceholder: 'Write reason',
  reason: '',
  showSuspensionDays: false,
  suspensionDays: '7',
};

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}

function metricValue(value) {
  return Number(value || 0).toLocaleString();
}

function statusPillClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (['approved', 'active', 'resolved'].includes(normalized)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['rejected', 'banned', 'dismissed', 'removed'].includes(normalized)) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (['in_review', 'suspended', 'shadow_banned', 'hidden'].includes(normalized)) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function getAdminPanelFromNotification(notification) {
  const type = String(notification?.type || '').toLowerCase();

  if (type.includes('report')) return 'reports';
  if (type.includes('listing') || type.includes('moderation')) return 'listings';
  if (type.includes('account') || type.includes('user') || type.includes('suspend') || type.includes('ban')) return 'users';
  return 'overview';
}

function AdminSidebar({ activeTab, onTabChange, summary }) {
  return (
    <aside className="hidden lg:flex w-64 bg-[#0f172a] text-white flex-col sticky top-0 h-screen overflow-hidden">
      <div className="p-8">
        <h1 className="text-2xl font-black text-white">Kotha<span className="text-blue-500">Bhada</span></h1>
        <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-2">Admin Panel</p>
      </div>

      <nav className="flex-1">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = tab.id === 'listings'
            ? Number(summary.pendingListings || 0)
            : tab.id === 'reports'
              ? Number(summary.openReports || 0)
              : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
                isActive
                  ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{tab.label}</span>
              {badgeCount > 0 ? (
                <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-[11px] font-medium text-white inline-flex items-center justify-center">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function ActionConfirmModal({ modal, busy, error, onCancel, onConfirm, onChange }) {
  if (!modal.open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px] p-4">
      <div className="min-h-full flex items-center justify-center">
        <section className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
          <h3 className="text-lg font-bold text-[#132238]">{modal.title}</h3>
          <p className="mt-2 text-sm text-gray-600">{modal.message}</p>

          {modal.requireReason ? (
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {modal.reasonLabel}
              <textarea
                value={modal.reason}
                onChange={(event) => onChange({ reason: event.target.value })}
                rows={4}
                maxLength={1200}
                placeholder={modal.reasonPlaceholder}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
              />
            </label>
          ) : null}

          {modal.showSuspensionDays ? (
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Suspension Days
              <input
                type="number"
                min={1}
                max={365}
                value={modal.suspensionDays}
                onChange={(event) => onChange({ suspensionDays: event.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
              />
            </label>
          ) : null}

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="kb-btn kb-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={modal.confirmVariant === 'danger' ? 'kb-btn kb-btn-danger' : 'kb-btn kb-btn-primary'}
            >
              {busy ? 'Saving...' : modal.confirmLabel}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminDashboardPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [banner, setBanner] = useState({ type: '', message: '' });

  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [summary, setSummary] = useState(defaultSummary);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingFilter, setListingFilter] = useState('pending');
  const [listingSearchInput, setListingSearchInput] = useState('');
  const [listingSearchApplied, setListingSearchApplied] = useState('');

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilter, setUserFilter] = useState('all');
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearchApplied, setUserSearchApplied] = useState('');

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState('open');
  const [reportSearchInput, setReportSearchInput] = useState('');
  const [reportSearchApplied, setReportSearchApplied] = useState('');

  const [actionBusyId, setActionBusyId] = useState('');
  const [actionModal, setActionModal] = useState(initialActionModal);
  const [actionModalBusy, setActionModalBusy] = useState(false);
  const [actionModalError, setActionModalError] = useState('');

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await api.get('/user/notifications');
      setNotifications(response.data?.notifications || []);
      setUnreadNotifications(response.data?.unreadCount || 0);
    } catch {
      // silent refresh failure
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;

    setNotifications((prev) => prev.map((item) => (
      item._id === notificationId ? { ...item, isRead: true } : item
    )));
    setUnreadNotifications((prev) => Math.max(0, prev - 1));

    try {
      await api.post(`/user/notifications/${notificationId}/read`);
    } catch {
      refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadNotifications(0);

    try {
      await api.post('/user/notifications/read-all');
    } catch {
      refreshNotifications();
    }
  }, [refreshNotifications]);

  const clearAllNotifications = useCallback(async () => {
    if (!notifications.length) return;

    const previousNotifications = notifications;
    const previousUnreadCount = unreadNotifications;

    setNotifications([]);
    setUnreadNotifications(0);

    try {
      await api.delete('/user/notifications');
    } catch {
      setNotifications(previousNotifications);
      setUnreadNotifications(previousUnreadCount);
      refreshNotifications();
    }
  }, [notifications, unreadNotifications, refreshNotifications]);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const response = await api.get('/admin/overview');
      const next = response?.data?.summary || {};
      setSummary({
        totalUsers: Number(next.totalUsers || 0),
        activeRooms: Number(next.activeRooms || 0),
        totalListings: Number(next.totalListings || 0),
        pendingListings: Number(next.pendingListings || 0),
        openReports: Number(next.openReports || 0),
        suspendedUsers: Number(next.suspendedUsers || 0),
      });
    } catch (error) {
      setBanner({ type: 'error', message: error?.response?.data?.message || 'Could not load overview.' });
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams();
      if (listingFilter !== 'all') params.set('moderationStatus', listingFilter);
      if (listingSearchApplied) params.set('search', listingSearchApplied);
      params.set('limit', '50');

      const response = await api.get(`/admin/listings?${params.toString()}`);
      setListings(Array.isArray(response?.data?.listings) ? response.data.listings : []);
    } catch (error) {
      setListings([]);
      setBanner({ type: 'error', message: error?.response?.data?.message || 'Could not load listings.' });
    } finally {
      setListingsLoading(false);
    }
  }, [listingFilter, listingSearchApplied]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userFilter !== 'all') params.set('role', userFilter);
      if (userSearchApplied) params.set('search', userSearchApplied);
      params.set('limit', '50');

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(Array.isArray(response?.data?.users) ? response.data.users : []);
    } catch (error) {
      setUsers([]);
      setBanner({ type: 'error', message: error?.response?.data?.message || 'Could not load users.' });
    } finally {
      setUsersLoading(false);
    }
  }, [userFilter, userSearchApplied]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportFilter !== 'all') params.set('status', reportFilter);
      if (reportSearchApplied) params.set('search', reportSearchApplied);
      params.set('limit', '50');

      const response = await api.get(`/admin/reports?${params.toString()}`);
      setReports(Array.isArray(response?.data?.reports) ? response.data.reports : []);
    } catch (error) {
      setReports([]);
      setBanner({ type: 'error', message: error?.response?.data?.message || 'Could not load reports.' });
    } finally {
      setReportsLoading(false);
    }
  }, [reportFilter, reportSearchApplied]);

  useEffect(() => {
    fetchOverview();
    refreshNotifications();
  }, [fetchOverview, refreshNotifications]);

  useEffect(() => {
    if (activeTab === 'listings') fetchListings();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab, fetchListings, fetchReports, fetchUsers]);

  useEffect(() => {
    let stopped = false;

    const pullNotifications = async () => {
      if (stopped) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      await refreshNotifications();
    };

    const intervalId = setInterval(pullNotifications, 5000);

    const handleFocus = () => {
      pullNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullNotifications();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      stopped = true;
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [refreshNotifications]);

  const listingCountLabel = useMemo(() => `${listings.length} listings`, [listings.length]);
  const userCountLabel = useMemo(() => `${users.length} users`, [users.length]);
  const reportCountLabel = useMemo(() => `${reports.length} reports`, [reports.length]);

  const applyListingSearch = (event) => {
    event.preventDefault();
    setListingSearchApplied(listingSearchInput.trim());
  };

  const applyUserSearch = (event) => {
    event.preventDefault();
    setUserSearchApplied(userSearchInput.trim());
  };

  const applyReportSearch = (event) => {
    event.preventDefault();
    setReportSearchApplied(reportSearchInput.trim());
  };

  const handleNotificationNavigate = (notification) => {
    setActiveTab(getAdminPanelFromNotification(notification));
  };

  const openListingModerationModal = (listing, moderationStatus) => {
    const listingId = String(listing?._id || '');
    if (!listingId) return;

    setActionModalError('');
    setActionModal({
      open: true,
      kind: 'listing_moderation',
      payload: { listingId, moderationStatus },
      title: moderationStatus === 'approved' ? 'Approve Listing' : 'Reject Listing',
      message: moderationStatus === 'approved'
        ? `Confirm approval for ${listing?.title || 'this listing'}?`
        : `Provide rejection reason for ${listing?.title || 'this listing'}.`,
      confirmLabel: moderationStatus === 'approved' ? 'Approve' : 'Reject',
      confirmVariant: moderationStatus === 'approved' ? 'primary' : 'danger',
      requireReason: moderationStatus === 'rejected',
      reasonLabel: 'Moderation Note',
      reasonPlaceholder: 'Write rejection reason for landlord feedback',
      reason: '',
      showSuspensionDays: false,
      suspensionDays: '7',
    });
  };

  const openUserStatusModal = (entry, accountStatus) => {
    const userId = String(entry?.id || '');
    if (!userId) return;

    const requiresReason = accountStatus !== 'active';

    setActionModalError('');
    setActionModal({
      open: true,
      kind: 'user_status',
      payload: { userId, accountStatus },
      title: accountStatus === 'active' ? 'Activate Account' : `Set Account to ${accountStatus.replace('_', ' ')}`,
      message: accountStatus === 'active'
        ? `Activate ${entry?.name || entry?.email || 'this user'} account?`
        : `Confirm account action for ${entry?.name || entry?.email || 'this user'}.`,
      confirmLabel: accountStatus === 'active' ? 'Activate' : 'Confirm',
      confirmVariant: accountStatus === 'banned' ? 'danger' : 'primary',
      requireReason: requiresReason,
      reasonLabel: 'Reason',
      reasonPlaceholder: 'Provide action reason',
      reason: '',
      showSuspensionDays: accountStatus === 'suspended',
      suspensionDays: '7',
    });
  };

  const openReportStatusModal = (report, status) => {
    const reportId = String(report?._id || '');
    if (!reportId) return;

    const requiresReason = ['resolved', 'dismissed'].includes(status);

    setActionModalError('');
    setActionModal({
      open: true,
      kind: 'report_status',
      payload: { reportId, status },
      title: `Update Report to ${status.replace('_', ' ')}`,
      message: `Confirm report status update for ${report?.reasonCategory || 'this report'}?`,
      confirmLabel: 'Update',
      confirmVariant: status === 'dismissed' ? 'danger' : 'primary',
      requireReason: requiresReason,
      reasonLabel: 'Admin Note',
      reasonPlaceholder: 'Write resolution note',
      reason: '',
      showSuspensionDays: false,
      suspensionDays: '7',
    });
  };

  const openReportActionModal = (report, action) => {
    const reportId = String(report?._id || '');
    if (!reportId) return;

    const isDelete = action === 'delete_listing';

    setActionModalError('');
    setActionModal({
      open: true,
      kind: 'report_listing_action',
      payload: { reportId, action },
      title: isDelete ? 'Delete Reported Listing' : 'Warn Landlord',
      message: isDelete
        ? 'This will remove the listing and resolve the report.'
        : 'This will send warning to landlord and resolve the report.',
      confirmLabel: isDelete ? 'Delete Listing' : 'Send Warning',
      confirmVariant: isDelete ? 'danger' : 'primary',
      requireReason: true,
      reasonLabel: 'Admin Note',
      reasonPlaceholder: isDelete ? 'Reason for deleting this listing' : 'Warning note for landlord',
      reason: '',
      showSuspensionDays: false,
      suspensionDays: '7',
    });
  };

  const closeActionModal = () => {
    if (actionModalBusy) return;
    setActionModal(initialActionModal);
    setActionModalError('');
  };

  const confirmActionModal = async () => {
    if (!actionModal.open || !actionModal.kind || !actionModal.payload) return;

    const reason = String(actionModal.reason || '').trim();
    if (actionModal.requireReason && !reason) {
      setActionModalError('Please provide a reason before continuing.');
      return;
    }

    setActionModalBusy(true);
    setActionModalError('');

    try {
      if (actionModal.kind === 'listing_moderation') {
        const { listingId, moderationStatus } = actionModal.payload;
        setActionBusyId(`listing:${listingId}`);

        await api.patch(`/admin/listings/${listingId}/moderation`, {
          moderationStatus,
          moderationNote: reason,
        });

        setBanner({ type: 'success', message: `Listing ${moderationStatus}.` });
        await Promise.all([fetchListings(), fetchOverview()]);
      }

      if (actionModal.kind === 'user_status') {
        const { userId, accountStatus } = actionModal.payload;
        setActionBusyId(`user:${userId}`);

        const suspensionDays = actionModal.showSuspensionDays
          ? Math.max(1, Math.min(365, Number(actionModal.suspensionDays) || 7))
          : 7;

        await api.patch(`/admin/users/${userId}/account-status`, {
          accountStatus,
          reason,
          suspensionDays,
        });

        setBanner({ type: 'success', message: `User marked as ${accountStatus}.` });
        await Promise.all([fetchUsers(), fetchOverview()]);
      }

      if (actionModal.kind === 'report_status') {
        const { reportId, status } = actionModal.payload;
        setActionBusyId(`report:${reportId}`);

        await api.patch(`/admin/reports/${reportId}/status`, {
          status,
          adminNote: reason,
        });

        setBanner({ type: 'success', message: `Report marked as ${status.replace('_', ' ')}.` });
        await Promise.all([fetchReports(), fetchOverview()]);
      }

      if (actionModal.kind === 'report_listing_action') {
        const { reportId, action } = actionModal.payload;
        setActionBusyId(`report:${reportId}`);

        await api.patch(`/admin/reports/${reportId}/listing-action`, {
          action,
          adminNote: reason,
        });

        setBanner({
          type: 'success',
          message: action === 'delete_listing'
            ? 'Listing removed and report resolved.'
            : 'Warning sent and report resolved.',
        });
        await Promise.all([fetchReports(), fetchOverview()]);
      }

      setActionModal(initialActionModal);
    } catch (error) {
      setActionModalError(error?.response?.data?.message || 'Could not complete this action.');
    } finally {
      setActionModalBusy(false);
      setActionBusyId('');
    }
  };

  const headerMeta = adminHeaderMeta[activeTab] || adminHeaderMeta.overview;

  return (
    <div className="flex min-h-screen bg-[#f4f7fe] font-sans text-gray-800">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} summary={summary} />

      <main className="flex-1 p-5 md:p-8 overflow-y-auto">
        <DashboardHeader
          profilePhoto={user?.profilePhoto}
          profileName={user?.name || user?.email || 'Admin'}
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          roleLabel="Admin"
          contactValue={user?.phone || ''}
          notifications={notifications}
          unreadNotifications={unreadNotifications}
          onMarkNotificationRead={markNotificationAsRead}
          onMarkAllNotificationsRead={markAllNotificationsAsRead}
          onClearAllNotifications={clearAllNotifications}
          onNotificationNavigate={handleNotificationNavigate}
        />

        <div className="mb-5 flex flex-wrap gap-2 lg:hidden">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {banner.message ? (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${banner.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {banner.message}
          </div>
        ) : null}

        {activeTab === 'overview' ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewLoading ? (
              <article className="col-span-full bg-white p-6 rounded-2xl shadow-sm text-sm text-gray-500">
                Loading overview...
              </article>
            ) : (
              <>
                <article className="bg-white p-6 rounded-2xl shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="mt-2 text-3xl font-black text-[#132238]">{metricValue(summary.totalUsers)}</p>
                </article>
                <article className="bg-white p-6 rounded-2xl shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Active Listings</p>
                  <p className="mt-2 text-3xl font-black text-[#132238]">{metricValue(summary.activeRooms)}</p>
                </article>
                <article className="bg-white p-6 rounded-2xl shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Pending Listings</p>
                  <p className="mt-2 text-3xl font-black text-[#132238]">{metricValue(summary.pendingListings)}</p>
                </article>
                <article className="bg-white p-6 rounded-2xl shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Open Reports</p>
                  <p className="mt-2 text-3xl font-black text-[#132238]">{metricValue(summary.openReports)}</p>
                </article>
              </>
            )}
          </section>
        ) : null}

        {activeTab === 'listings' ? (
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-[#132238]">Moderation Queue</h3>
              <button type="button" onClick={fetchListings} className="kb-btn kb-btn-secondary kb-btn-sm">Refresh</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {listingFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setListingFilter(option.value)}
                  className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                    listingFilter === option.value
                      ? 'bg-[#132238] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <form onSubmit={applyListingSearch} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={listingSearchInput}
                onChange={(event) => setListingSearchInput(event.target.value)}
                placeholder="Search by title, location, owner"
                className="h-10 grow rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button type="submit" className="kb-btn kb-btn-secondary kb-btn-sm">Search</button>
            </form>

            <p className="mt-3 text-xs font-medium text-slate-500">{listingCountLabel}</p>

            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Listing</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Owner</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {listingsLoading ? (
                    <tr><td className="px-4 py-4 text-slate-500" colSpan={4}>Loading listings...</td></tr>
                  ) : listings.length === 0 ? (
                    <tr><td className="px-4 py-4 text-slate-500" colSpan={4}>No listings found.</td></tr>
                  ) : listings.map((listing) => {
                    const id = String(listing?._id || '');
                    const status = String(listing?.moderationStatus || 'pending').toLowerCase();
                    const busy = actionBusyId === `listing:${id}`;

                    return (
                      <tr key={id}>
                        <td className="px-4 py-3 align-top">
                          <p className="font-semibold text-slate-800">{listing?.title || 'Untitled listing'}</p>
                          <p className="text-xs text-slate-500">{listing?.location || '-'} • Rs {metricValue(listing?.price)}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(listing?.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-slate-600">
                          <p>{listing?.ownerName || '-'}</p>
                          <p>{listing?.ownerEmail || '-'}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusPillClass(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busy || status !== 'pending'}
                              onClick={() => openListingModerationModal(listing, 'approved')}
                              className="kb-btn kb-btn-soft-success kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {busy ? 'Saving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={busy || status !== 'pending'}
                              onClick={() => openListingModerationModal(listing, 'rejected')}
                              className="kb-btn kb-btn-soft-danger kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {busy ? 'Saving...' : 'Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === 'users' ? (
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-[#132238]">Account Access</h3>
              <button type="button" onClick={fetchUsers} className="kb-btn kb-btn-secondary kb-btn-sm">Refresh</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {userFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUserFilter(option.value)}
                  className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                    userFilter === option.value
                      ? 'bg-[#132238] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <form onSubmit={applyUserSearch} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={userSearchInput}
                onChange={(event) => setUserSearchInput(event.target.value)}
                placeholder="Search by name or email"
                className="h-10 grow rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button type="submit" className="kb-btn kb-btn-secondary kb-btn-sm">Search</button>
            </form>

            <p className="mt-3 text-xs font-medium text-slate-500">{userCountLabel}</p>

            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">User</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Role</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {usersLoading ? (
                    <tr><td className="px-4 py-4 text-slate-500" colSpan={4}>Loading users...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td className="px-4 py-4 text-slate-500" colSpan={4}>No users found.</td></tr>
                  ) : users.map((entry) => {
                    const id = String(entry?.id || '');
                    const status = String(entry?.accountStatus || 'active').toLowerCase();
                    const busy = actionBusyId === `user:${id}`;

                    return (
                      <tr key={id}>
                        <td className="px-4 py-3 align-top text-xs text-slate-700">
                          <p className="text-sm font-semibold text-slate-800">{entry?.name || 'Unknown user'}</p>
                          <p>{entry?.email || '-'}</p>
                          <p className="text-slate-500">Last login: {formatDateTime(entry?.lastLoginAt)}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold capitalize text-slate-700">
                            {entry?.role || 'user'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 font-semibold capitalize ${statusPillClass(status)}`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busy || status === 'active'}
                              onClick={() => openUserStatusModal(entry, 'active')}
                              className="kb-btn kb-btn-soft-success kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {busy ? 'Saving...' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              disabled={busy || status === 'suspended'}
                              onClick={() => openUserStatusModal(entry, 'suspended')}
                              className="kb-btn kb-btn-soft-warning kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {busy ? 'Saving...' : 'Suspend'}
                            </button>
                            <button
                              type="button"
                              disabled={busy || status === 'shadow_banned'}
                              onClick={() => openUserStatusModal(entry, 'shadow_banned')}
                              className="kb-btn kb-btn-soft-info kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {busy ? 'Saving...' : 'Shadow-ban'}
                            </button>
                            <button
                              type="button"
                              disabled={busy || status === 'banned'}
                              onClick={() => openUserStatusModal(entry, 'banned')}
                              className="kb-btn kb-btn-soft-danger kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {busy ? 'Saving...' : 'Ban'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === 'reports' ? (
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-[#132238]">Safety Reports</h3>
              <button type="button" onClick={fetchReports} className="kb-btn kb-btn-secondary kb-btn-sm">Refresh</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {reportFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setReportFilter(option.value)}
                  className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                    reportFilter === option.value
                      ? 'bg-[#132238] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <form onSubmit={applyReportSearch} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={reportSearchInput}
                onChange={(event) => setReportSearchInput(event.target.value)}
                placeholder="Search reports"
                className="h-10 grow rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button type="submit" className="kb-btn kb-btn-secondary kb-btn-sm">Search</button>
            </form>

            <p className="mt-3 text-xs font-medium text-slate-500">{reportCountLabel}</p>

            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Report</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Target</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {reportsLoading ? (
                    <tr><td className="px-4 py-4 text-slate-500" colSpan={4}>Loading reports...</td></tr>
                  ) : reports.length === 0 ? (
                    <tr><td className="px-4 py-4 text-slate-500" colSpan={4}>No reports found.</td></tr>
                  ) : reports.map((report) => {
                    const id = String(report?._id || '');
                    const status = String(report?.status || 'open').toLowerCase();
                    const busy = actionBusyId === `report:${id}`;
                    const targetType = String(report?.targetType || '').toLowerCase();

                    return (
                      <tr key={id}>
                        <td className="px-4 py-3 align-top text-xs text-slate-700">
                          <p className="text-sm font-semibold text-slate-800">{report?.reasonCategory || 'Uncategorized'}</p>
                          <p>{report?.description || '-'}</p>
                          <p className="text-slate-500">{formatDateTime(report?.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-slate-700">
                          <p className="capitalize">{targetType || 'unknown'}</p>
                          <p>{report?.targetListingId?.title || report?.targetId || '-'}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 font-semibold capitalize ${statusPillClass(status)}`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busy || ['in_review', 'resolved', 'dismissed'].includes(status)}
                              onClick={() => openReportStatusModal(report, 'in_review')}
                              className="kb-btn kb-btn-soft-info kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {busy ? 'Saving...' : 'In Review'}
                            </button>
                            <button
                              type="button"
                              disabled={busy || ['resolved', 'dismissed'].includes(status)}
                              onClick={() => openReportStatusModal(report, 'dismissed')}
                              className="kb-btn kb-btn-secondary kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {busy ? 'Saving...' : 'Dismiss'}
                            </button>
                            {targetType === 'listing' && !['resolved', 'dismissed'].includes(status) ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => openReportActionModal(report, 'warn_landlord')}
                                  className="kb-btn kb-btn-soft-warning kb-btn-sm disabled:cursor-not-allowed"
                                >
                                  {busy ? 'Saving...' : 'Warn'}
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => openReportActionModal(report, 'delete_listing')}
                                  className="kb-btn kb-btn-soft-danger kb-btn-sm disabled:cursor-not-allowed"
                                >
                                  {busy ? 'Saving...' : 'Delete Listing'}
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>

      <ActionConfirmModal
        modal={actionModal}
        busy={actionModalBusy}
        error={actionModalError}
        onCancel={closeActionModal}
        onConfirm={confirmActionModal}
        onChange={(patch) => setActionModal((prev) => ({ ...prev, ...patch }))}
      />
    </div>
  );
}

export default AdminDashboardPage;
