import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Home,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/landlordDashboard/DashboardHeader';
import { subscribeRealtimeUpdates } from '../utils/realtimeUpdates';

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
  renters: 0,
  landlords: 0,
  activeRooms: 0,
  totalListings: 0,
  pendingListings: 0,
  approvedListings: 0,
  rejectedListings: 0,
  openReports: 0,
  inReviewReports: 0,
  totalReports: 0,
  suspendedUsers: 0,
  rolePerformance: {
    renter: {
      total: 0,
      activeLast30d: 0,
      emailVerified: 0,
      bookingsTotal: 0,
      bookingsConfirmed: 0,
      inquiriesTotal: 0,
      inquiriesResponded: 0,
      reportsRaised: 0,
      openReportsRaised: 0,
      inquiryToBookingRate: 0,
      bookingConfirmationRate: 0,
    },
    landlord: {
      total: 0,
      activeLast30d: 0,
      verifiedCount: 0,
      kycPendingCount: 0,
      listingsTotal: 0,
      listingsActive: 0,
      listingsPendingModeration: 0,
      listingsRejected: 0,
      bookingsReceived: 0,
      bookingsReceivedConfirmed: 0,
      inquiriesReceived: 0,
      inquiriesResponded: 0,
      reportsAgainst: 0,
      openReportsAgainst: 0,
      listingApprovalRate: 0,
      bookingAcceptanceRate: 0,
    },
    trends: {
      window7d: [],
      window30d: [],
    },
    topPerformers: {
      landlordsByBookings: [],
      rentersByBookings: [],
    },
  },
};

const overviewRoleOptions = [
  { value: 'renter', label: 'Renter Performance' },
  { value: 'landlord', label: 'Landlord Performance' },
];

const trendWindowOptions = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

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

function percentValue(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ratioPercent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((safeNumber(numerator) / safeNumber(denominator)) * 100).toFixed(2));
}

function compactLabel(value, max = 16) {
  const text = String(value || '').trim();
  if (!text) return 'Unknown';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function buildSummaryFromResponse(next = {}) {
  const rolePerformance = next?.rolePerformance || {};
  const renter = rolePerformance?.renter || {};
  const landlord = rolePerformance?.landlord || {};
  const trends = rolePerformance?.trends || {};
  const topPerformers = rolePerformance?.topPerformers || {};

  return {
    ...defaultSummary,
    totalUsers: safeNumber(next.totalUsers),
    renters: safeNumber(next.renters),
    landlords: safeNumber(next.landlords),
    activeRooms: safeNumber(next.activeRooms),
    totalListings: safeNumber(next.totalListings),
    pendingListings: safeNumber(next.pendingListings),
    approvedListings: safeNumber(next.approvedListings),
    rejectedListings: safeNumber(next.rejectedListings),
    openReports: safeNumber(next.openReports),
    inReviewReports: safeNumber(next.inReviewReports),
    totalReports: safeNumber(next.totalReports),
    suspendedUsers: safeNumber(next.suspendedUsers),
    rolePerformance: {
      renter: {
        ...defaultSummary.rolePerformance.renter,
        ...renter,
      },
      landlord: {
        ...defaultSummary.rolePerformance.landlord,
        ...landlord,
      },
      trends: {
        window7d: Array.isArray(trends.window7d) ? trends.window7d : [],
        window30d: Array.isArray(trends.window30d) ? trends.window30d : [],
      },
      topPerformers: {
        landlordsByBookings: Array.isArray(topPerformers.landlordsByBookings) ? topPerformers.landlordsByBookings : [],
        rentersByBookings: Array.isArray(topPerformers.rentersByBookings) ? topPerformers.rentersByBookings : [],
      },
    },
  };
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

function AdminSidebar({ activeTab, onTabChange, summary, onLogout }) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col bg-[#111315] text-white sticky top-0 h-screen overflow-hidden">
      <div className="px-8 py-7">
        <h1 className="text-2xl font-black tracking-tight text-white">Kotha<span className="text-[#006aff]">Bhada</span></h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pb-5">
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
              className={`mx-3 flex w-[calc(100%-24px)] items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                isActive
                  ? 'bg-[#006aff] text-white shadow-[0_10px_24px_rgba(0,106,255,0.28)]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-semibold">{tab.label}</span>
              {badgeCount > 0 ? (
                <span className={`ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}

        <p className="px-8 pt-6 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
          Moderation
        </p>
      </nav>

      <div className="p-6">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/20"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
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
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [banner, setBanner] = useState({ type: '', message: '' });

  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [summary, setSummary] = useState(defaultSummary);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewRoleFocus, setOverviewRoleFocus] = useState('renter');
  const [overviewTrendWindow, setOverviewTrendWindow] = useState('7d');

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

  const fetchOverview = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setOverviewLoading(true);
    }

    try {
      const response = await api.get('/admin/overview');
      const next = response?.data?.summary || {};
      setSummary(buildSummaryFromResponse(next));
    } catch (error) {
      if (!silent) {
        setBanner({ type: 'error', message: error?.response?.data?.message || 'Could not load overview.' });
      }
    } finally {
      if (!silent) {
        setOverviewLoading(false);
      }
    }
  }, []);

  const fetchListings = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setListingsLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (listingFilter !== 'all') params.set('moderationStatus', listingFilter);
      if (listingSearchApplied) params.set('search', listingSearchApplied);
      params.set('limit', '50');

      const response = await api.get(`/admin/listings?${params.toString()}`);
      setListings(Array.isArray(response?.data?.listings) ? response.data.listings : []);
    } catch (error) {
      if (!silent) {
        setListings([]);
        setBanner({ type: 'error', message: error?.response?.data?.message || 'Could not load listings.' });
      }
    } finally {
      if (!silent) {
        setListingsLoading(false);
      }
    }
  }, [listingFilter, listingSearchApplied]);

  const fetchUsers = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setUsersLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (userFilter !== 'all') params.set('role', userFilter);
      if (userSearchApplied) params.set('search', userSearchApplied);
      params.set('limit', '50');

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(Array.isArray(response?.data?.users) ? response.data.users : []);
    } catch (error) {
      if (!silent) {
        setUsers([]);
        setBanner({ type: 'error', message: error?.response?.data?.message || 'Could not load users.' });
      }
    } finally {
      if (!silent) {
        setUsersLoading(false);
      }
    }
  }, [userFilter, userSearchApplied]);

  const fetchReports = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setReportsLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (reportFilter !== 'all') params.set('status', reportFilter);
      if (reportSearchApplied) params.set('search', reportSearchApplied);
      params.set('limit', '50');

      const response = await api.get(`/admin/reports?${params.toString()}`);
      setReports(Array.isArray(response?.data?.reports) ? response.data.reports : []);
    } catch (error) {
      if (!silent) {
        setReports([]);
        setBanner({ type: 'error', message: error?.response?.data?.message || 'Could not load reports.' });
      }
    } finally {
      if (!silent) {
        setReportsLoading(false);
      }
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
    let refreshTimeoutId = null;

    const unsubscribe = subscribeRealtimeUpdates(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }

      refreshTimeoutId = setTimeout(() => {
        const refreshTasks = [fetchOverview({ silent: true })];
        if (activeTab === 'listings') refreshTasks.push(fetchListings({ silent: true }));
        if (activeTab === 'users') refreshTasks.push(fetchUsers({ silent: true }));
        if (activeTab === 'reports') refreshTasks.push(fetchReports({ silent: true }));
        Promise.all(refreshTasks);
      }, 120);
    });

    return () => {
      unsubscribe();
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }
    };
  }, [activeTab, fetchListings, fetchOverview, fetchReports, fetchUsers]);

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

  const goToListingsPanel = useCallback((moderationStatus = 'all', search = '') => {
    const nextSearch = String(search || '').trim();
    setListingFilter(moderationStatus || 'all');
    setListingSearchInput(nextSearch);
    setListingSearchApplied(nextSearch);
    setActiveTab('listings');
  }, []);

  const goToUsersPanel = useCallback((role = 'all', search = '') => {
    const nextSearch = String(search || '').trim();
    setUserFilter(role || 'all');
    setUserSearchInput(nextSearch);
    setUserSearchApplied(nextSearch);
    setActiveTab('users');
  }, []);

  const goToReportsPanel = useCallback((status = 'all', search = '') => {
    const nextSearch = String(search || '').trim();
    setReportFilter(status || 'all');
    setReportSearchInput(nextSearch);
    setReportSearchApplied(nextSearch);
    setActiveTab('reports');
  }, []);

  const handleOverviewDrillDown = useCallback((drillDown) => {
    if (!drillDown || typeof drillDown !== 'object') return;

    const tab = String(drillDown.tab || '').toLowerCase();
    const filter = String(drillDown.filter || 'all').toLowerCase();
    const search = String(drillDown.search || '');

    if (tab === 'users') {
      goToUsersPanel(filter, search);
      return;
    }

    if (tab === 'listings') {
      goToListingsPanel(filter, search);
      return;
    }

    if (tab === 'reports') {
      goToReportsPanel(filter, search);
    }
  }, [goToListingsPanel, goToReportsPanel, goToUsersPanel]);

  const rolePerformance = summary.rolePerformance || defaultSummary.rolePerformance;
  const selectedRolePerformance = overviewRoleFocus === 'landlord'
    ? rolePerformance.landlord
    : rolePerformance.renter;

  const trendRows = useMemo(() => (
    overviewTrendWindow === '30d'
      ? rolePerformance.trends.window30d
      : rolePerformance.trends.window7d
  ), [overviewTrendWindow, rolePerformance.trends.window30d, rolePerformance.trends.window7d]);

  const overviewPalette = useMemo(() => {
    if (overviewRoleFocus === 'landlord') {
      return {
        primary: '#0ea5e9',
        secondary: '#6366f1',
        soft: 'rgba(14, 165, 233, 0.08)',
        surface: '#f0f9ff',
        border: '#bae6fd',
        gradientFrom: '#ecfeff',
        gradientTo: '#eef2ff',
      };
    }

    return {
      primary: '#10b981',
      secondary: '#3b82f6',
      soft: 'rgba(16, 185, 129, 0.08)',
      surface: '#ecfdf5',
      border: '#a7f3d0',
      gradientFrom: '#ecfdf5',
      gradientTo: '#eff6ff',
    };
  }, [overviewRoleFocus]);

  const trendSeries = useMemo(() => {
    if (overviewRoleFocus === 'landlord') {
      return [
        { key: 'landlordSignups', label: 'Landlord Signups', color: overviewPalette.primary },
        { key: 'landlordListings', label: 'Listings Added', color: overviewPalette.secondary },
      ];
    }

    return [
      { key: 'renterSignups', label: 'Renter Signups', color: overviewPalette.primary },
      { key: 'renterBookings', label: 'Booking Requests', color: overviewPalette.secondary },
    ];
  }, [overviewPalette.primary, overviewPalette.secondary, overviewRoleFocus]);

  const focusMetricCards = useMemo(() => {
    if (overviewRoleFocus === 'landlord') {
      return [
        {
          label: 'Verified Landlords',
          value: metricValue(selectedRolePerformance.verifiedCount),
          hint: `${metricValue(selectedRolePerformance.kycPendingCount)} pending KYC`,
          drillDown: { tab: 'users', filter: 'landlord' },
        },
        {
          label: 'Booking Acceptance Rate',
          value: percentValue(selectedRolePerformance.bookingAcceptanceRate),
          hint: `${metricValue(selectedRolePerformance.bookingsReceivedConfirmed)} confirmed from ${metricValue(selectedRolePerformance.bookingsReceived)}`,
          drillDown: { tab: 'users', filter: 'landlord' },
        },
        {
          label: 'Listing Approval Rate',
          value: percentValue(selectedRolePerformance.listingApprovalRate),
          hint: `${metricValue(selectedRolePerformance.listingsPendingModeration)} pending moderation`,
          drillDown: { tab: 'listings', filter: 'pending' },
        },
        {
          label: 'Open Reports Against',
          value: metricValue(selectedRolePerformance.openReportsAgainst),
          hint: `${metricValue(selectedRolePerformance.reportsAgainst)} total landlord reports`,
          drillDown: { tab: 'reports', filter: 'open' },
        },
      ];
    }

    return [
      {
        label: 'Active Renters (30D)',
        value: metricValue(selectedRolePerformance.activeLast30d),
        hint: `${metricValue(selectedRolePerformance.emailVerified)} email-verified`,
        drillDown: { tab: 'users', filter: 'user' },
      },
      {
        label: 'Booking Confirmation Rate',
        value: percentValue(selectedRolePerformance.bookingConfirmationRate),
        hint: `${metricValue(selectedRolePerformance.bookingsConfirmed)} confirmed from ${metricValue(selectedRolePerformance.bookingsTotal)}`,
        drillDown: { tab: 'users', filter: 'user' },
      },
      {
        label: 'Inquiry to Booking Rate',
        value: percentValue(selectedRolePerformance.inquiryToBookingRate),
        hint: `${metricValue(selectedRolePerformance.inquiriesTotal)} inquiries submitted`,
        drillDown: { tab: 'users', filter: 'user' },
      },
      {
        label: 'Open Reports Raised',
        value: metricValue(selectedRolePerformance.openReportsRaised),
        hint: `${metricValue(selectedRolePerformance.reportsRaised)} total reports by renters`,
        drillDown: { tab: 'reports', filter: 'open' },
      },
    ];
  }, [overviewRoleFocus, selectedRolePerformance]);

  const trendChartData = useMemo(() => (
    trendRows.map((row) => ({
      ...row,
      dayLabel: String(row?.day || '').slice(5),
    }))
  ), [trendRows]);

  const userCompositionData = useMemo(() => {
    const rows = [
      { name: 'Renters', value: safeNumber(summary.renters), color: '#10b981' },
      { name: 'Landlords', value: safeNumber(summary.landlords), color: '#3b82f6' },
    ];
    return rows.filter((row) => row.value > 0);
  }, [summary.renters, summary.landlords]);

  const listingModerationData = useMemo(() => {
    const rows = [
      { name: 'Approved', value: safeNumber(summary.approvedListings), color: '#22c55e' },
      { name: 'Pending', value: safeNumber(summary.pendingListings), color: '#f59e0b' },
      { name: 'Rejected', value: safeNumber(summary.rejectedListings), color: '#ef4444' },
    ];
    return rows.filter((row) => row.value > 0);
  }, [summary.approvedListings, summary.pendingListings, summary.rejectedListings]);

  const safetyDistributionData = useMemo(() => {
    const resolvedLike = Math.max(0, safeNumber(summary.totalReports) - safeNumber(summary.openReports) - safeNumber(summary.inReviewReports));
    const rows = [
      { name: 'Open', value: safeNumber(summary.openReports), color: '#f97316' },
      { name: 'In Review', value: safeNumber(summary.inReviewReports), color: '#3b82f6' },
      { name: 'Resolved/Dismissed', value: resolvedLike, color: '#22c55e' },
    ];
    return rows.filter((row) => row.value > 0);
  }, [summary.inReviewReports, summary.openReports, summary.totalReports]);

  const roleRadarData = useMemo(() => {
    const renterActiveRate = ratioPercent(rolePerformance.renter.activeLast30d, rolePerformance.renter.total);
    const landlordActiveRate = ratioPercent(rolePerformance.landlord.activeLast30d, rolePerformance.landlord.total);
    const renterSafetyScore = 100 - ratioPercent(rolePerformance.renter.openReportsRaised, rolePerformance.renter.reportsRaised);
    const landlordSafetyScore = 100 - ratioPercent(rolePerformance.landlord.openReportsAgainst, rolePerformance.landlord.reportsAgainst);

    return [
      {
        metric: 'Activity',
        renter: renterActiveRate,
        landlord: landlordActiveRate,
      },
      {
        metric: 'Conversion',
        renter: safeNumber(rolePerformance.renter.bookingConfirmationRate),
        landlord: safeNumber(rolePerformance.landlord.bookingAcceptanceRate),
      },
      {
        metric: 'Approval',
        renter: safeNumber(rolePerformance.renter.inquiryToBookingRate),
        landlord: safeNumber(rolePerformance.landlord.listingApprovalRate),
      },
      {
        metric: 'Safety Score',
        renter: Math.max(0, renterSafetyScore),
        landlord: Math.max(0, landlordSafetyScore),
      },
    ];
  }, [rolePerformance.landlord, rolePerformance.renter]);

  const topPerformerBarData = useMemo(() => {
    const rows = overviewRoleFocus === 'landlord'
      ? rolePerformance.topPerformers.landlordsByBookings
      : rolePerformance.topPerformers.rentersByBookings;

    return rows.map((entry, index) => ({
      id: String(entry?._id || entry?.email || `${overviewRoleFocus}-${index}`),
      name: compactLabel(entry?.name || entry?.email || 'Unknown'),
      confirmedBookings: safeNumber(entry?.confirmedBookings),
      totalBookings: safeNumber(entry?.totalBookings),
    }));
  }, [overviewRoleFocus, rolePerformance.topPerformers.landlordsByBookings, rolePerformance.topPerformers.rentersByBookings]);

  const chartMotion = useMemo(() => ({
    isAnimationActive: true,
    animationDuration: 850,
    animationEasing: 'ease-out',
  }), []);

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
  const nowLabel = new Date().toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const moderationCompletionRate = summary.totalListings
    ? Math.round((safeNumber(summary.approvedListings) / safeNumber(summary.totalListings)) * 100)
    : 0;
  const safetyResolveRate = summary.totalReports
    ? Math.round((Math.max(0, safeNumber(summary.totalReports) - safeNumber(summary.openReports) - safeNumber(summary.inReviewReports)) / safeNumber(summary.totalReports)) * 100)
    : 0;

  return (
    <div className="flex h-screen bg-[#fcfcfd] font-sans text-gray-800">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} summary={summary} onLogout={logout} />

      <main className="flex-1 min-h-0 overflow-y-auto p-5 md:p-8 lg:p-10">
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
          <section className="space-y-4">
            {overviewLoading ? (
              <article className="bg-white p-6 rounded-2xl shadow-sm text-sm text-gray-500">
                Loading overview...
              </article>
            ) : (
              <>
                <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-7">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-[#132238]">Today&apos;s Statistics</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">{nowLabel}</p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Live</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => goToListingsPanel(summary.pendingListings > 0 ? 'pending' : 'all')}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Pending Listings</p>
                      <p className="mt-1 text-2xl font-black text-slate-800">{metricValue(summary.pendingListings)}</p>
                      <p className="mt-1 text-xs text-slate-500">Awaiting moderation decision</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => goToReportsPanel(summary.openReports > 0 ? 'open' : 'in_review')}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/40"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Open Reports</p>
                      <p className="mt-1 text-2xl font-black text-slate-800">{metricValue(summary.openReports)}</p>
                      <p className="mt-1 text-xs text-slate-500">Active safety cases in queue</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => goToReportsPanel('in_review')}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">In Review</p>
                      <p className="mt-1 text-2xl font-black text-slate-800">{metricValue(summary.inReviewReports)}</p>
                      <p className="mt-1 text-xs text-slate-500">Cases under moderator review</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => goToUsersPanel('all')}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-rose-200 hover:bg-rose-50/40"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Suspended Users</p>
                      <p className="mt-1 text-2xl font-black text-slate-800">{metricValue(summary.suspendedUsers)}</p>
                      <p className="mt-1 text-xs text-slate-500">Accounts currently restricted</p>
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Listing Moderation Completion</span>
                        <span>{moderationCompletionRate}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white">
                        <div className="h-2 rounded-full bg-[#006aff]" style={{ width: `${moderationCompletionRate}%` }} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Safety Resolution</span>
                        <span>{safetyResolveRate}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${safetyResolveRate}%` }} />
                      </div>
                    </div>
                  </div>
                </article>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => goToUsersPanel('all')}
                    className="bg-white p-6 rounded-2xl shadow-sm text-left border border-transparent transition hover:border-slate-200"
                  >
                    <p className="text-sm font-medium text-gray-500">Total Managed Users</p>
                    <p className="mt-2 text-3xl font-black text-[#132238]">{metricValue(summary.totalUsers)}</p>
                    <p className="mt-1 text-xs text-slate-500">{metricValue(summary.renters)} renters • {metricValue(summary.landlords)} landlords</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToListingsPanel(summary.pendingListings > 0 ? 'pending' : 'all')}
                    className="bg-white p-6 rounded-2xl shadow-sm text-left border border-transparent transition hover:border-slate-200"
                  >
                    <p className="text-sm font-medium text-gray-500">Listing Health</p>
                    <p className="mt-2 text-3xl font-black text-[#132238]">{metricValue(summary.activeRooms)}</p>
                    <p className="mt-1 text-xs text-slate-500">active • {metricValue(summary.pendingListings)} pending • {metricValue(summary.rejectedListings)} rejected</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToReportsPanel(summary.openReports > 0 ? 'open' : 'in_review')}
                    className="bg-white p-6 rounded-2xl shadow-sm text-left border border-transparent transition hover:border-slate-200"
                  >
                    <p className="text-sm font-medium text-gray-500">Safety Queue</p>
                    <p className="mt-2 text-3xl font-black text-[#132238]">{metricValue(summary.openReports)}</p>
                    <p className="mt-1 text-xs text-slate-500">open reports • {metricValue(summary.inReviewReports)} in review</p>
                  </button>
                </div>

                <article
                  className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 transition-colors"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${overviewPalette.gradientFrom} 0%, ${overviewPalette.gradientTo} 100%)`,
                    borderColor: overviewPalette.border,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-[#132238]">Role Performance Board</h3>
                      <p className="text-sm text-slate-500">Switch role and timeline to inspect renter and landlord performance side by side.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {overviewRoleOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setOverviewRoleFocus(option.value)}
                          className={`inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                            overviewRoleFocus === option.value
                              ? 'text-white'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                          style={overviewRoleFocus === option.value ? { backgroundColor: overviewPalette.primary } : undefined}
                        >
                          {option.label}
                        </button>
                      ))}
                      {trendWindowOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setOverviewTrendWindow(option.value)}
                          className={`inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                            overviewTrendWindow === option.value
                              ? 'text-white'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                          style={overviewTrendWindow === option.value ? { backgroundColor: overviewPalette.secondary } : undefined}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {focusMetricCards.map((card) => (
                      <button
                        key={card.label}
                        type="button"
                        onClick={() => handleOverviewDrillDown(card.drillDown)}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-left transition"
                        style={{
                          backgroundColor: overviewPalette.surface,
                          borderColor: overviewPalette.border,
                        }}
                      >
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
                        <p className="mt-1 text-2xl font-black text-[#132238]">{card.value}</p>
                        <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <article
                      className="xl:col-span-2 rounded-2xl border border-slate-200 p-4"
                      style={{
                        borderColor: overviewPalette.border,
                        backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${overviewPalette.surface} 100%)`,
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#132238]">Daily Activity Trend</h4>
                        <p className="text-xs text-slate-500">{trendRows.length} days loaded</p>
                      </div>

                      {trendChartData.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">No trend data available yet.</p>
                      ) : (
                        <div className="mt-3 h-75 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendChartData} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
                              <defs>
                                {trendSeries.map((series) => (
                                  <linearGradient key={series.key} id={`${series.key}Gradient`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={series.color} stopOpacity={0.35} />
                                    <stop offset="95%" stopColor={series.color} stopOpacity={0.03} />
                                  </linearGradient>
                                ))}
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <XAxis dataKey="dayLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                              <Tooltip
                                formatter={(value, name) => [metricValue(value), name]}
                                labelFormatter={(label) => `Day ${label}`}
                                contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              {trendSeries.map((series) => (
                                <Area
                                  key={series.key}
                                  type="monotone"
                                  dataKey={series.key}
                                  name={series.label}
                                  stroke={series.color}
                                  fill={`url(#${series.key}Gradient)`}
                                  strokeWidth={2.5}
                                  isAnimationActive={chartMotion.isAnimationActive}
                                  animationDuration={chartMotion.animationDuration}
                                  animationEasing={chartMotion.animationEasing}
                                />
                              ))}
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-bold text-[#132238]">Composition Snapshot</h4>

                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User Mix</p>
                        <div className="h-36 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={userCompositionData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={30}
                                outerRadius={52}
                                paddingAngle={3}
                                isAnimationActive={chartMotion.isAnimationActive}
                                animationDuration={chartMotion.animationDuration}
                                animationEasing={chartMotion.animationEasing}
                              >
                                {userCompositionData.map((entry) => (
                                  <Cell key={`user-composition-${entry.name}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name) => [metricValue(value), name]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing Moderation</p>
                        <div className="h-36 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={listingModerationData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={28}
                                outerRadius={50}
                                paddingAngle={2}
                                isAnimationActive={chartMotion.isAnimationActive}
                                animationDuration={chartMotion.animationDuration}
                                animationEasing={chartMotion.animationEasing}
                              >
                                {listingModerationData.map((entry) => (
                                  <Cell key={`listing-moderation-${entry.name}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name) => [metricValue(value), name]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </article>
                  </div>
                </article>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <article className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-[#132238]">Role Strength Radar</h3>
                    <p className="mt-1 text-xs text-slate-500">Visual comparison of renter and landlord system health indicators.</p>
                    <div className="mt-3 h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={roleRadarData} outerRadius="72%">
                          <PolarGrid stroke="#cbd5e1" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#475569' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <Radar
                            name="Renters"
                            dataKey="renter"
                            stroke={overviewRoleFocus === 'renter' ? overviewPalette.primary : '#10b981'}
                            fill={overviewRoleFocus === 'renter' ? overviewPalette.primary : '#10b981'}
                            fillOpacity={0.28}
                            strokeWidth={2}
                            isAnimationActive={chartMotion.isAnimationActive}
                            animationDuration={chartMotion.animationDuration}
                            animationEasing={chartMotion.animationEasing}
                          />
                          <Radar
                            name="Landlords"
                            dataKey="landlord"
                            stroke={overviewRoleFocus === 'landlord' ? overviewPalette.primary : '#3b82f6'}
                            fill={overviewRoleFocus === 'landlord' ? overviewPalette.primary : '#3b82f6'}
                            fillOpacity={0.24}
                            strokeWidth={2}
                            isAnimationActive={chartMotion.isAnimationActive}
                            animationDuration={chartMotion.animationDuration}
                            animationEasing={chartMotion.animationEasing}
                          />
                          <Tooltip formatter={(value, name) => [percentValue(value), name]} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </article>

                  <article className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-[#132238]">Top Performer Comparison</h3>
                    <p className="mt-1 text-xs text-slate-500">{overviewRoleFocus === 'landlord' ? 'Landlords ranked by booking outcomes.' : 'Renters ranked by successful booking outcomes.'}</p>
                    {topPerformerBarData.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No top performer data available yet.</p>
                    ) : (
                      <div className="mt-3 h-75">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topPerformerBarData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip formatter={(value, name) => [metricValue(value), name]} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar
                              dataKey="confirmedBookings"
                              name="Confirmed Bookings"
                              fill={overviewPalette.primary}
                              radius={[8, 8, 0, 0]}
                              isAnimationActive={chartMotion.isAnimationActive}
                              animationDuration={chartMotion.animationDuration}
                              animationEasing={chartMotion.animationEasing}
                            />
                            <Bar
                              dataKey="totalBookings"
                              name="Total Bookings"
                              fill={overviewPalette.secondary}
                              radius={[8, 8, 0, 0]}
                              isAnimationActive={chartMotion.isAnimationActive}
                              animationDuration={chartMotion.animationDuration}
                              animationEasing={chartMotion.animationEasing}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </article>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <article className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-1">
                    <h3 className="text-base font-bold text-[#132238]">Safety Distribution</h3>
                    <div className="mt-2 h-55">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={safetyDistributionData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={46}
                            outerRadius={74}
                            paddingAngle={3}
                            isAnimationActive={chartMotion.isAnimationActive}
                            animationDuration={chartMotion.animationDuration}
                            animationEasing={chartMotion.animationEasing}
                          >
                            {safetyDistributionData.map((entry) => (
                              <Cell key={`safety-${entry.name}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [metricValue(value), name]} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </article>

                  <article className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 xl:col-span-2">
                    <h3 className="text-base font-bold text-[#132238]">Quick Drilldown Leaderboard</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Landlords</p>
                        {rolePerformance.topPerformers.landlordsByBookings.length === 0 ? (
                          <p className="text-sm text-slate-500">No landlord performance records yet.</p>
                        ) : rolePerformance.topPerformers.landlordsByBookings.map((entry, index) => (
                          <button
                            key={String(entry?._id || entry?.email || `landlord-${index}`)}
                            type="button"
                            onClick={() => goToUsersPanel('landlord', entry?.email || entry?.name || '')}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                          >
                            <p className="text-sm font-bold text-slate-800">{entry?.name || 'Unknown landlord'}</p>
                            <p className="text-xs text-slate-500">{entry?.email || '-'}</p>
                            <p className="mt-1 text-xs text-slate-600">
                              {metricValue(entry?.confirmedBookings)} confirmed • {metricValue(entry?.totalBookings)} total
                            </p>
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Renters</p>
                        {rolePerformance.topPerformers.rentersByBookings.length === 0 ? (
                          <p className="text-sm text-slate-500">No renter performance records yet.</p>
                        ) : rolePerformance.topPerformers.rentersByBookings.map((entry, index) => (
                          <button
                            key={String(entry?._id || entry?.email || `renter-${index}`)}
                            type="button"
                            onClick={() => goToUsersPanel('user', entry?.email || entry?.name || '')}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
                          >
                            <p className="text-sm font-bold text-slate-800">{entry?.name || 'Unknown renter'}</p>
                            <p className="text-xs text-slate-500">{entry?.email || '-'}</p>
                            <p className="mt-1 text-xs text-slate-600">
                              {metricValue(entry?.confirmedBookings)} confirmed • {metricValue(entry?.totalBookings)} total
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                </div>
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
          <section className="bg-white rounded-2xl shadow-sm">
            {/* HEADER */}
            <div className="p-6 md:p-8 border-b border-slate-200">
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">User Management</h2>
              <p className="text-slate-500 font-medium">
                Manage all users in one place. Control access, assign roles, and monitor activity across your platform.
              </p>
            </div>

            {/* TOOLBAR */}
            <div className="p-6 md:p-8 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  value={userSearchInput}
                  onChange={(event) => setUserSearchInput(event.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && applyUserSearch(e)}
                  placeholder="Search by name or email..." 
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full w-full outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>
              
              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-full text-sm font-bold hover:bg-slate-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-700 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 text-left">Full Name</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Role</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Joined</th>
                    <th className="p-4 text-left">Last Active</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    <tr><td className="p-4 text-slate-500 text-center" colSpan={7}>Loading users...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td className="p-4 text-slate-500 text-center" colSpan={7}>No users found.</td></tr>
                  ) : users.map((entry) => {
                    const id = String(entry?.id || '');
                    const status = String(entry?.accountStatus || 'active').toLowerCase();
                    const busy = actionBusyId === `user:${id}`;
                    const isLandlord = entry?.role === 'landlord';
                    const isRenter = entry?.role === 'user';
                    const userName = entry?.name || 'Unknown user';
                    const initials = userName.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
                    const avatarBg = isLandlord ? 'bg-indigo-100 text-indigo-600' : isRenter ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600';
                    const roleDisplay = isLandlord ? 'Landlord' : isRenter ? 'Renter' : (entry?.role || 'user').charAt(0).toUpperCase() + (entry?.role || 'user').slice(1);
                    const lastActive = entry?.lastLoginAt ? formatDateTime(entry.lastLoginAt) : 'Never';

                    return (
                      <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                        {/* FULL NAME */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${avatarBg}`}>
                              {initials || '?'}
                            </div>
                            <span className="font-bold text-slate-700">{userName}</span>
                          </div>
                        </td>
                        {/* EMAIL */}
                        <td className="p-4 text-slate-600 font-medium text-sm">{entry?.email || '-'}</td>
                        {/* ROLE */}
                        <td className="p-4 text-slate-600 font-semibold text-sm">{roleDisplay}</td>
                        {/* STATUS */}
                        <td className="p-4">
                          {status === 'active' ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">Active</span>
                          ) : status === 'suspended' ? (
                            <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">Suspended</span>
                          ) : status === 'shadow_banned' ? (
                            <span className="px-3 py-1 rounded-full bg-slate-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">S-Banned</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">Banned</span>
                          )}
                        </td>
                        {/* JOINED DATE */}
                        <td className="p-4 text-slate-500 font-medium text-sm">{formatDateTime(entry?.createdAt)}</td>
                        {/* LAST ACTIVE */}
                        <td className="p-4 text-slate-500 font-medium text-sm">{lastActive}</td>
                        {/* ACTIONS */}
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-3">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openUserStatusModal(entry, 'active')}
                              className="text-slate-400 hover:text-blue-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                              title="Edit user"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openUserStatusModal(entry, 'banned')}
                              className="text-slate-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete/Ban user"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FOOTER INFO */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm font-medium text-slate-500 bg-slate-50/30">
              <span>Total: <span className="font-bold text-slate-700">{users.length} users</span></span>
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
