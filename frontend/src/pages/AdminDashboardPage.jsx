import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Bell,
  Bot,
  ChevronDown,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  SendHorizontal,
  ShieldAlert,
  Trash2,
  UserCircle2,
  Users,
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

const defaultSummary = {
  totalUsers: 0,
  activeRooms: 0,
  pending3dModels: 0,
  totalInquiries: 0,
  renters: 0,
  landlords: 0,
  suspendedUsers: 0,
  bannedUsers: 0,
  totalListings: 0,
  pendingListings: 0,
  approvedListings: 0,
  rejectedListings: 0,
  openReports: 0,
  inReviewReports: 0,
};

const summaryCards = [
  { key: 'totalUsers', label: 'Total Users', accent: 'text-[#1f2937]' },
  { key: 'activeRooms', label: 'Active Rooms', accent: 'text-[#0f766e]' },
  { key: 'pending3dModels', label: 'Pending 3D Models', accent: 'text-[#b45309]' },
  { key: 'totalInquiries', label: 'Total Inquiries', accent: 'text-[#2563eb]' },
];

const listingFilterOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

const userFilterOptions = [
  { label: 'All Users', value: 'all' },
  { label: 'Renters', value: 'user' },
  { label: 'Landlords', value: 'landlord' },
];

const reportFilterOptions = [
  { label: 'Open', value: 'open' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
  { label: 'All', value: 'all' },
];

const kycFilterOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

const adminPanelNavItems = [
  {
    id: 'overview',
    label: 'Overview',
    subtitle: 'Platform snapshot',
    icon: LayoutDashboard,
  },
  {
    id: 'listings',
    label: 'Approval Queue',
    subtitle: 'Approve pending listings',
    icon: Home,
  },
  {
    id: 'users',
    label: 'User Accounts',
    subtitle: 'Renter and landlord control',
    icon: Users,
  },
  {
    id: 'reports',
    label: 'Reported Content',
    subtitle: 'Delete or warn actions',
    icon: ShieldAlert,
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    subtitle: 'Admin action history',
    icon: ClipboardList,
  },
];

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString();
}

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
}

function moderationBadgeClass(status) {
  if (status === 'approved') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-50 border-rose-200 text-rose-700';
  return 'bg-amber-50 border-amber-200 text-amber-700';
}

function userBadgeClass(role) {
  if (role === 'landlord') return 'bg-violet-50 text-violet-700 border-violet-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

function accountStatusBadgeClass(status) {
  const normalized = String(status || 'active').toLowerCase();
  if (normalized === 'banned') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (normalized === 'suspended') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function reportStatusBadgeClass(status) {
  const normalized = String(status || 'open').toLowerCase();
  if (normalized === 'resolved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (normalized === 'dismissed') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (normalized === 'in_review') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function userActivityLabel(user) {
  const activity = user?.activity || {};
  if (user?.role === 'landlord') {
    return `${activity.landlordListings || 0} listings (${activity.landlordActiveListings || 0} active), ${activity.landlordBookings || 0} bookings, ${activity.landlordInquiries || 0} inquiries`;
  }

  return `${activity.renterBookings || 0} bookings, ${activity.renterInquiries || 0} inquiries`;
}

function getAdminPanelFromNotification(notification) {
  const type = String(notification?.type || '').toLowerCase();

  if (type.includes('report')) return 'reports';
  if (type.includes('listing') || type.includes('moderation')) return 'listings';
  if (type.includes('account') || type.includes('user') || type.includes('suspend') || type.includes('ban')) return 'users';
  if (type.includes('audit') || type.includes('admin')) return 'audit';
  return 'overview';
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  const [activePanel, setActivePanel] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearNotificationsConfirm, setShowClearNotificationsConfirm] = useState(false);

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [summary, setSummary] = useState(defaultSummary);

  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState('');
  const [listings, setListings] = useState([]);
  const [listingFilter, setListingFilter] = useState('pending');
  const [listingSearchInput, setListingSearchInput] = useState('');
  const [listingSearchApplied, setListingSearchApplied] = useState('');
  const [processingListingId, setProcessingListingId] = useState('');

  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearchApplied, setUserSearchApplied] = useState('');
  const [userActionProcessingId, setUserActionProcessingId] = useState('');

  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('open');
  const [reportSearchInput, setReportSearchInput] = useState('');
  const [reportSearchApplied, setReportSearchApplied] = useState('');
  const [reportActionProcessingId, setReportActionProcessingId] = useState('');

  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearchInput, setAuditSearchInput] = useState('');
  const [auditSearchApplied, setAuditSearchApplied] = useState('');

  const [kycLoading, setKycLoading] = useState(true);
  const [kycError, setKycError] = useState('');
  const [kycQueue, setKycQueue] = useState([]);
  const [kycFilter, setKycFilter] = useState('pending');
  const [kycSearchInput, setKycSearchInput] = useState('');
  const [kycSearchApplied, setKycSearchApplied] = useState('');
  const [kycActionProcessingId, setKycActionProcessingId] = useState('');

  const [chatbotInsightsLoading, setChatbotInsightsLoading] = useState(true);
  const [chatbotInsightsError, setChatbotInsightsError] = useState('');
  const [chatbotQuestions, setChatbotQuestions] = useState([]);

  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [rejectModalListing, setRejectModalListing] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [accountActionModal, setAccountActionModal] = useState({
    open: false,
    user: null,
    nextStatus: '',
    reason: '',
    suspensionDays: '7',
  });
  const [reportStatusModal, setReportStatusModal] = useState({
    open: false,
    report: null,
    nextStatus: '',
    adminNote: '',
  });
  const [reportedListingActionModal, setReportedListingActionModal] = useState({
    open: false,
    report: null,
    action: '',
    adminNote: '',
  });
  const [kycReviewModal, setKycReviewModal] = useState({
    open: false,
    landlord: null,
    decision: '',
    reviewNote: '',
  });

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');

    try {
      const response = await api.get('/admin/overview');
      setSummary({
        totalUsers: Number(response.data?.summary?.totalUsers || 0),
        activeRooms: Number(response.data?.summary?.activeRooms || 0),
        pending3dModels: Number(response.data?.summary?.pending3dModels || 0),
        totalInquiries: Number(response.data?.summary?.totalInquiries || 0),
        renters: Number(response.data?.summary?.renters || 0),
        landlords: Number(response.data?.summary?.landlords || 0),
        suspendedUsers: Number(response.data?.summary?.suspendedUsers || 0),
        bannedUsers: Number(response.data?.summary?.bannedUsers || 0),
        totalListings: Number(response.data?.summary?.totalListings || 0),
        pendingListings: Number(response.data?.summary?.pendingListings || 0),
        approvedListings: Number(response.data?.summary?.approvedListings || 0),
        rejectedListings: Number(response.data?.summary?.rejectedListings || 0),
        openReports: Number(response.data?.summary?.openReports || 0),
        inReviewReports: Number(response.data?.summary?.inReviewReports || 0),
      });
    } catch (err) {
      setOverviewError(err?.response?.data?.message || 'Could not load admin overview.');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchModerationListings = useCallback(async () => {
    setListingsLoading(true);
    setListingsError('');

    try {
      const params = new URLSearchParams();
      if (listingFilter !== 'all') params.set('moderationStatus', listingFilter);
      if (listingSearchApplied) params.set('search', listingSearchApplied);
      params.set('limit', '100');

      const response = await api.get(`/admin/listings?${params.toString()}`);
      setListings(Array.isArray(response.data?.listings) ? response.data.listings : []);
    } catch (err) {
      setListings([]);
      setListingsError(err?.response?.data?.message || 'Could not load moderation listings.');
    } finally {
      setListingsLoading(false);
    }
  }, [listingFilter, listingSearchApplied]);

  const fetchManagedUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');

    try {
      const params = new URLSearchParams();
      if (userFilter !== 'all') params.set('role', userFilter);
      if (userSearchApplied) params.set('search', userSearchApplied);
      params.set('limit', '80');

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(Array.isArray(response.data?.users) ? response.data.users : []);
    } catch (err) {
      setUsers([]);
      setUsersError(err?.response?.data?.message || 'Could not load users list.');
    } finally {
      setUsersLoading(false);
    }
  }, [userFilter, userSearchApplied]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError('');

    try {
      const params = new URLSearchParams();
      if (reportFilter !== 'all') params.set('status', reportFilter);
      if (reportSearchApplied) params.set('search', reportSearchApplied);
      params.set('limit', '80');

      const response = await api.get(`/admin/reports?${params.toString()}`);
      setReports(Array.isArray(response.data?.reports) ? response.data.reports : []);
    } catch (err) {
      setReports([]);
      setReportsError(err?.response?.data?.message || 'Could not load reports.');
    } finally {
      setReportsLoading(false);
    }
  }, [reportFilter, reportSearchApplied]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError('');

    try {
      const params = new URLSearchParams();
      if (auditSearchApplied) params.set('search', auditSearchApplied);
      params.set('limit', '80');

      const response = await api.get(`/admin/audit-logs?${params.toString()}`);
      setAuditLogs(Array.isArray(response.data?.logs) ? response.data.logs : []);
    } catch (err) {
      setAuditLogs([]);
      setAuditError(err?.response?.data?.message || 'Could not load audit logs.');
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearchApplied]);

  const fetchKycQueue = useCallback(async () => {
    setKycLoading(true);
    setKycError('');

    try {
      const params = new URLSearchParams();
      if (kycFilter !== 'all') params.set('status', kycFilter);
      if (kycSearchApplied) params.set('search', kycSearchApplied);
      params.set('limit', '80');

      const response = await api.get(`/admin/landlords/kyc?${params.toString()}`);
      setKycQueue(Array.isArray(response.data?.landlords) ? response.data.landlords : []);
    } catch (err) {
      setKycQueue([]);
      setKycError(err?.response?.data?.message || 'Could not load landlord KYC queue.');
    } finally {
      setKycLoading(false);
    }
  }, [kycFilter, kycSearchApplied]);

  const fetchChatbotInsights = useCallback(async () => {
    setChatbotInsightsLoading(true);
    setChatbotInsightsError('');

    try {
      const response = await api.get('/admin/chatbot-insights?limit=10');
      setChatbotQuestions(Array.isArray(response.data?.questions) ? response.data.questions : []);
    } catch (err) {
      setChatbotQuestions([]);
      setChatbotInsightsError(err?.response?.data?.message || 'Could not load chatbot insights.');
    } finally {
      setChatbotInsightsLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await api.get('/user/notifications');
      setNotifications(Array.isArray(response.data?.notifications) ? response.data.notifications : []);
      setUnreadNotifications(Number(response.data?.unreadCount || 0));
    } catch {
      // Keep dashboard usable even if notifications fail.
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    let stopped = false;

    const pullNotifications = async () => {
      if (stopped) return;
      await refreshNotifications();
    };

    pullNotifications();
    const intervalId = setInterval(pullNotifications, 15000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchModerationListings();
  }, [fetchModerationListings]);

  useEffect(() => {
    fetchManagedUsers();
  }, [fetchManagedUsers]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    fetchKycQueue();
  }, [fetchKycQueue]);

  useEffect(() => {
    fetchChatbotInsights();
  }, [fetchChatbotInsights]);

  const listingCountLabel = useMemo(() => `${listings.length} listings shown`, [listings.length]);
  const userCountLabel = useMemo(() => `${users.length} users shown`, [users.length]);
  const reportsCountLabel = useMemo(() => `${reports.length} reports shown`, [reports.length]);
  const auditCountLabel = useMemo(() => `${auditLogs.length} logs shown`, [auditLogs.length]);
  const kycCountLabel = useMemo(() => `${kycQueue.length} landlords shown`, [kycQueue.length]);
  const chatbotCountLabel = useMemo(() => `${chatbotQuestions.length} recent questions`, [chatbotQuestions.length]);
  const activePanelMeta = useMemo(
    () => adminPanelNavItems.find((item) => item.id === activePanel) || adminPanelNavItems[0],
    [activePanel]
  );

  const handlePanelChange = (panelId) => {
    setActivePanel(panelId);

    if (panelId === 'overview') {
      fetchOverview();
      fetchChatbotInsights();
    }
    if (panelId === 'listings') fetchModerationListings();
    if (panelId === 'users') {
      fetchManagedUsers();
      fetchKycQueue();
    }
    if (panelId === 'reports') fetchReports();
    if (panelId === 'audit') fetchAuditLogs();
  };

  const markNotificationAsRead = async (notificationId) => {
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
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadNotifications(0);

    try {
      await api.post('/user/notifications/read-all');
    } catch {
      refreshNotifications();
    }
  };

  const clearAllNotifications = async () => {
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
  };

  const handleNotificationNavigate = (notification) => {
    const panelId = getAdminPanelFromNotification(notification);
    handlePanelChange(panelId);
  };

  const handleLogoutRequest = () => {
    setIsProfileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleClearNotificationsRequest = () => {
    setShowClearNotificationsConfirm(true);
  };

  const handleConfirmClearNotifications = async () => {
    await clearAllNotifications();
    setShowClearNotificationsConfirm(false);
    setIsNotificationOpen(false);
  };

  const handleAdminLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setIsProfileMenuOpen(false);
    navigate('/', { state: { logoutSuccess: true } });
  };

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

  const applyAuditSearch = (event) => {
    event.preventDefault();
    setAuditSearchApplied(auditSearchInput.trim());
  };

  const applyKycSearch = (event) => {
    event.preventDefault();
    setKycSearchApplied(kycSearchInput.trim());
  };

  const handleModerationDecision = async (listing, moderationStatus, providedModerationNote = '') => {
    const listingId = String(listing?._id || '');
    if (!listingId) return false;

    const moderationNote = String(providedModerationNote || '').trim();

    if (moderationStatus === 'rejected' && !moderationNote) {
      setFeedbackError('Please provide a rejection reason so the landlord can fix and resubmit.');
      return false;
    }

    const currentModerationStatus = String(listing?.moderationStatus || 'pending').toLowerCase();
    if (currentModerationStatus !== 'pending') {
      setFeedbackError('This listing is already finalized. Ask landlord to edit and resubmit for another review cycle.');
      return false;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setProcessingListingId(listingId);

    let success = false;

    try {
      await api.patch(`/admin/listings/${listingId}/moderation`, {
        moderationStatus,
        moderationNote,
      });

      setFeedbackSuccess(
        moderationStatus === 'approved'
          ? `Listing "${listing.title}" approved. It is now eligible to be visible to renters.`
          : `Listing "${listing.title}" rejected and landlord has been notified.`
      );

      await Promise.all([fetchOverview(), fetchModerationListings(), fetchAuditLogs()]);
      success = true;
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || 'Could not update listing moderation status.');
    } finally {
      setProcessingListingId('');
    }

    return success;
  };

  const openRejectModal = (listing) => {
    setRejectModalListing(listing);
    setRejectReasonInput('');
    setFeedbackError('');
    setFeedbackSuccess('');
  };

  const closeRejectModal = () => {
    setRejectModalListing(null);
    setRejectReasonInput('');
  };

  const confirmRejectWithReason = async () => {
    if (!rejectModalListing) return;

    const trimmedReason = String(rejectReasonInput || '').trim();
    if (!trimmedReason) {
      setFeedbackError('Please provide a rejection reason so the landlord can fix and resubmit.');
      return;
    }

    const didReject = await handleModerationDecision(rejectModalListing, 'rejected', trimmedReason);
    if (didReject) {
      closeRejectModal();
    }
  };

  const handleUserAccountAction = async (user, nextStatus, options = {}) => {
    const userId = String(user?.id || '');
    if (!userId) return;

    const reason = String(options.reason || '').trim();
    const rawDays = Number(options.suspensionDays);
    const suspensionDays = Number.isFinite(rawDays) && rawDays > 0
      ? Math.min(365, Math.floor(rawDays))
      : 7;

    if (nextStatus === 'suspended' && !reason) {
      setFeedbackError('Suspension reason is required.');
      return;
    }

    if (nextStatus === 'banned' && !reason) {
      setFeedbackError('Ban reason is required.');
      return;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setUserActionProcessingId(userId);

    try {
      await api.patch(`/admin/users/${userId}/account-status`, {
        accountStatus: nextStatus,
        reason,
        suspensionDays,
      });

      setFeedbackSuccess(`Account status updated to ${nextStatus} for ${user?.name || user?.email || 'user'}.`);
      await Promise.all([fetchOverview(), fetchManagedUsers(), fetchAuditLogs()]);
      return true;
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || 'Could not update account status.');
      return false;
    } finally {
      setUserActionProcessingId('');
    }
  };

  const openAccountActionModal = (user, nextStatus) => {
    const normalizedStatus = String(nextStatus || '').toLowerCase();
    if (!['suspended', 'banned'].includes(normalizedStatus)) {
      handleUserAccountAction(user, normalizedStatus || 'active');
      return;
    }

    setAccountActionModal({
      open: true,
      user,
      nextStatus: normalizedStatus,
      reason: normalizedStatus === 'banned' ? 'Severe policy violation.' : 'Policy violation detected.',
      suspensionDays: '7',
    });
  };

  const closeAccountActionModal = () => {
    if (userActionProcessingId) return;
    setAccountActionModal({
      open: false,
      user: null,
      nextStatus: '',
      reason: '',
      suspensionDays: '7',
    });
  };

  const confirmAccountActionModal = async () => {
    const { user, nextStatus, reason, suspensionDays } = accountActionModal;
    const normalizedStatus = String(nextStatus || '').toLowerCase();
    if (!user || !normalizedStatus) return;

    const success = await handleUserAccountAction(user, normalizedStatus, { reason, suspensionDays });
    if (success) {
      closeAccountActionModal();
    }
  };

  const handleLandlordKycReview = async (landlord, decision, reviewNoteInput = '') => {
    const landlordId = String(landlord?.id || '');
    if (!landlordId || !['verify', 'reject'].includes(String(decision || '').toLowerCase())) return false;

    const reviewNote = String(reviewNoteInput || '').trim();
    if (decision === 'reject' && !reviewNote) {
      setFeedbackError('Rejection reason is required for KYC rejection.');
      return false;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setKycActionProcessingId(landlordId);

    try {
      await api.patch(`/admin/landlords/${landlordId}/kyc`, {
        decision,
        reviewNote,
      });

      setFeedbackSuccess(
        decision === 'verify'
          ? `Landlord ${landlord?.name || landlord?.email || ''} marked as verified.`
          : `Landlord ${landlord?.name || landlord?.email || ''} KYC rejected.`
      );

      await Promise.all([fetchKycQueue(), fetchManagedUsers(), fetchAuditLogs()]);
      return true;
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || 'Could not update landlord KYC status.');
      return false;
    } finally {
      setKycActionProcessingId('');
    }
  };

  const openKycReviewModal = (landlord, decision) => {
    const normalizedDecision = String(decision || '').toLowerCase();
    if (!landlord || !['verify', 'reject'].includes(normalizedDecision)) return;

    setKycReviewModal({
      open: true,
      landlord,
      decision: normalizedDecision,
      reviewNote: normalizedDecision === 'reject'
        ? 'Document is unclear. Please upload a clear image.'
        : '',
    });
  };

  const closeKycReviewModal = () => {
    if (kycActionProcessingId) return;
    setKycReviewModal({
      open: false,
      landlord: null,
      decision: '',
      reviewNote: '',
    });
  };

  const confirmKycReviewModal = async () => {
    const { landlord, decision, reviewNote } = kycReviewModal;
    if (!landlord || !decision) return;

    const success = await handleLandlordKycReview(landlord, decision, reviewNote);
    if (success) {
      closeKycReviewModal();
    }
  };

  const openReportedListingActionModal = (report, action) => {
    const normalizedAction = String(action || '').toLowerCase();
    if (!['delete_listing', 'warn_landlord'].includes(normalizedAction)) return;

    setReportedListingActionModal({
      open: true,
      report,
      action: normalizedAction,
      adminNote: normalizedAction === 'delete_listing'
        ? 'Listing removed after renter report validation.'
        : 'Please update this listing immediately to avoid removal.',
    });
  };

  const closeReportedListingActionModal = (force = false) => {
    if (!force && reportActionProcessingId) return;

    setReportedListingActionModal({
      open: false,
      report: null,
      action: '',
      adminNote: '',
    });
  };

  const confirmReportedListingActionModal = async () => {
    const { report, action, adminNote } = reportedListingActionModal;
    const reportId = String(report?._id || '');
    const note = String(adminNote || '').trim();

    if (!reportId || !action) return;
    if (!note) {
      setFeedbackError('Please provide an admin note for this action.');
      return;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setReportActionProcessingId(reportId);

    try {
      await api.patch(`/admin/reports/${reportId}/listing-action`, {
        action,
        adminNote: note,
      });

      setFeedbackSuccess(
        action === 'delete_listing'
          ? 'Reported listing deleted successfully.'
          : 'Warning sent to landlord successfully.'
      );

      await Promise.all([fetchOverview(), fetchReports(), fetchModerationListings(), fetchAuditLogs()]);
      closeReportedListingActionModal(true);
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || 'Could not apply reported content action.');
    } finally {
      setReportActionProcessingId('');
    }
  };

  const handleReportStatusUpdate = async (report, nextStatus, options = {}) => {
    const reportId = String(report?._id || '');
    if (!reportId) return;

    const adminNote = String(options.adminNote || '').trim();
    if ((nextStatus === 'resolved' || nextStatus === 'dismissed') && !adminNote) {
      setFeedbackError('Resolution note is required for this status change.');
      return;
    }

    setFeedbackError('');
    setFeedbackSuccess('');
    setReportActionProcessingId(reportId);

    try {
      await api.patch(`/admin/reports/${reportId}/status`, {
        status: nextStatus,
        adminNote,
      });

      setFeedbackSuccess(`Report status updated to ${nextStatus.replace('_', ' ')}.`);
      await Promise.all([fetchOverview(), fetchReports(), fetchAuditLogs()]);
      return true;
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || 'Could not update report status.');
      return false;
    } finally {
      setReportActionProcessingId('');
    }
  };

  const openReportStatusModal = (report, nextStatus) => {
    const normalizedStatus = String(nextStatus || '').toLowerCase();
    if (!['resolved', 'dismissed'].includes(normalizedStatus)) {
      handleReportStatusUpdate(report, normalizedStatus);
      return;
    }

    setReportStatusModal({
      open: true,
      report,
      nextStatus: normalizedStatus,
      adminNote: 'Reviewed by admin.',
    });
  };

  const closeReportStatusModal = () => {
    if (reportActionProcessingId) return;
    setReportStatusModal({
      open: false,
      report: null,
      nextStatus: '',
      adminNote: '',
    });
  };

  const confirmReportStatusModal = async () => {
    const { report, nextStatus, adminNote } = reportStatusModal;
    if (!report || !nextStatus) return;

    const success = await handleReportStatusUpdate(report, nextStatus, { adminNote });
    if (success) {
      closeReportStatusModal();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fe] font-sans text-gray-800">
      <aside className="hidden h-screen w-72 shrink-0 flex-col overflow-hidden bg-[#0f172a] text-white lg:flex lg:sticky lg:top-0">
        <div className="p-8">
          <h1 className="text-2xl font-black text-white">Kotha<span className="text-blue-500">Bhada</span></h1>
          <p className="mt-2 text-[11px] uppercase tracking-widest text-slate-400">Admin Panel</p>
        </div>

        <nav className="flex-1">
          {adminPanelNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePanel === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePanelChange(item.id)}
                className={`w-full px-6 py-3 text-left flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800/70'
                }`}
              >
                <Icon size={18} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{item.label}</p>
                  <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-5">
          <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Admin'}</p>
          <p className="mt-1 text-[11px] text-slate-400 truncate">{user?.email || 'admin@kothabhada.com'}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-5 md:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black text-gray-800">{activePanelMeta.label}</h2>
              <p className="mt-1 text-sm text-gray-500">Moderate listings, manage user accounts, review abuse reports, and track admin actions.</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative" ref={notificationMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className="relative p-2 text-gray-400 hover:text-gray-600"
                >
                  <Bell size={22} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1.5 bg-red-500 text-white text-[10px] rounded-full border-2 border-white inline-flex items-center justify-center">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-96 max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] p-3 z-20">
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800">Notifications</h4>
                      <div className="flex items-center gap-3">
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearNotificationsRequest}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Clear all
                          </button>
                        )}
                        {unreadNotifications > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsAsRead}
                            className="text-xs font-semibold text-[#3b66ff] hover:text-[#2346c7]"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 max-h-80 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-slate-500 px-2 py-6 text-center">No notifications yet.</p>
                      ) : (
                        notifications.map((item) => (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => {
                              if (!item.isRead) {
                                markNotificationAsRead(item._id);
                              }
                              handleNotificationNavigate(item);
                              setIsNotificationOpen(false);
                            }}
                            className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                              item.isRead
                                ? 'border-slate-200 bg-white'
                                : 'border-blue-200 bg-blue-50/60'
                            }`}
                          >
                            <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                            <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{item.message}</p>
                            <p className="mt-1 text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  aria-label="Open admin profile menu"
                >
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user?.name || 'Admin'} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                      <UserCircle2 size={20} className="text-slate-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-700 max-w-40 truncate">{user?.name || 'Admin'}</p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] p-3 z-20">
                    <div className="rounded-xl bg-linear-to-r from-[#f3f7ff] to-[#eef4ff] border border-blue-100 px-3 py-3">
                      <div className="flex items-center gap-3">
                        {user?.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user?.name || 'Admin'} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
                            <UserCircle2 size={22} className="text-slate-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'Admin'}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email || 'admin@kothabhada.com'}</p>
                        </div>
                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2.5 bg-white">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Role</p>
                        <p className="text-sm font-semibold text-slate-700">Admin</p>
                      </div>
                      <div className="px-3 py-2.5 border-t border-slate-100 bg-white">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Contact</p>
                        <p className="text-sm font-semibold text-slate-700 truncate">{user?.phone || 'Not set'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogoutRequest}
                      className="mt-3 w-full kb-btn kb-btn-soft-danger"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
            {adminPanelNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePanel === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePanelChange(item.id)}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                    isActive
                      ? 'bg-[#132238] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={14} /> {item.label}
                </button>
              );
            })}
          </div>

        {overviewError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {overviewError}
          </div>
        )}

        {activePanel === 'overview' && (
          <div id="overview" className="space-y-8">
            <section className="mt-6 grid scroll-mt-24 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <article key={card.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className={`mt-2 text-3xl font-black ${card.accent}`}>
                    {overviewLoading ? '--' : Number(summary[card.key] || 0).toLocaleString()}
                  </p>
                </article>
              ))}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[#1f2937] inline-flex items-center gap-2">
                    <Bot size={18} className="text-[#3A5AFF]" /> ChatBot Insights
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">Last 10 user questions to monitor AI assistant performance.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchChatbotInsights}
                  className="kb-btn kb-btn-secondary"
                >
                  Refresh
                </button>
              </div>

              <p className="mt-3 text-xs font-medium text-slate-500">{chatbotCountLabel}</p>

              {chatbotInsightsError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
                  {chatbotInsightsError}
                </div>
              )}

              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Question</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Asked At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chatbotInsightsLoading ? (
                      <tr>
                        <td className="px-4 py-4 text-slate-500" colSpan={3}>Loading chatbot insights...</td>
                      </tr>
                    ) : chatbotQuestions.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-slate-500" colSpan={3}>No recent chatbot questions found.</td>
                      </tr>
                    ) : (
                      chatbotQuestions.map((entry, index) => (
                        <tr key={`${entry?.userId || 'user'}-${entry?.askedAt || index}`}>
                          <td className="px-4 py-4 align-top text-xs text-slate-600">
                            <p className="font-semibold text-slate-700">{entry?.userName || 'User'}</p>
                            <p>{entry?.userEmail || '-'}</p>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-slate-700 leading-relaxed">
                            {entry?.question || '-'}
                          </td>
                          <td className="px-4 py-4 align-top text-xs text-slate-600">
                            {formatDateTime(entry?.askedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activePanel === 'listings' && (
          <section id="listings" className="mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#1f2937]">Approval Queue</h2>
              <p className="mt-1 text-sm text-slate-600">Most important: approve or reject pending listings before they go live.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                fetchOverview();
                fetchModerationListings();
              }}
              className="kb-btn kb-btn-secondary"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {listingFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setListingFilter(option.value)}
                className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                  listingFilter === option.value
                    ? 'bg-[#3A5AFF] text-white shadow-[0_8px_20px_rgba(58,90,255,0.25)]'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={applyListingSearch} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={listingSearchInput}
              onChange={(event) => setListingSearchInput(event.target.value)}
              placeholder="Search by listing title, owner, email, or location"
              className="h-11 grow rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#3A5AFF]/40"
            />
            <button
              type="submit"
              className="kb-btn kb-btn-primary"
            >
              Apply Search
            </button>
          </form>

          <p className="mt-3 text-xs font-medium text-slate-500">{listingCountLabel}</p>

          {feedbackError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {feedbackError}
            </div>
          )}

          {feedbackSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              {feedbackSuccess}
            </div>
          )}

          {listingsError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {listingsError}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Listing</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listingsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-slate-500">Loading listings...</td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-slate-500">No listings found for selected moderation filter.</td>
                  </tr>
                ) : (
                  listings.map((listing) => {
                    const listingId = String(listing?._id || '');
                    const moderationStatus = String(listing?.moderationStatus || 'pending').toLowerCase();
                    const isProcessing = processingListingId === listingId;
                    const canModerate = moderationStatus === 'pending';

                    return (
                      <tr key={listingId}>
                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-slate-800">{listing.title || 'Untitled listing'}</p>
                          <p className="text-xs text-slate-500">{listing.location || 'No location'}</p>
                          <p className="text-xs font-semibold text-[#1d4ed8]">Rs {Number(listing.price || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-700">{listing.ownerName || 'Unknown landlord'}</p>
                          <p className="text-xs text-slate-500">{listing.ownerEmail || 'No email'}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${moderationBadgeClass(moderationStatus)}`}>
                            {moderationStatus}
                          </span>
                          {listing.moderationNote ? (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{listing.moderationNote}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          {formatDate(listing.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button
                              type="button"
                              disabled={isProcessing || !canModerate}
                              onClick={() => handleModerationDecision(listing, 'approved')}
                              className="kb-btn kb-btn-success kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {isProcessing ? 'Saving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing || !canModerate}
                              onClick={() => {
                                if (canModerate) openRejectModal(listing);
                              }}
                              className="kb-btn kb-btn-danger kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {isProcessing ? 'Saving...' : 'Reject'}
                            </button>
                          </div>
                          {!canModerate && (
                            <p className="mt-2 text-[11px] font-medium text-slate-500">Decision finalized for this cycle</p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          </section>
        )}

        {rejectModalListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#1f2937]">Reject Listing</h3>
              <p className="mt-1 text-sm text-slate-600">
                Please enter a reason for rejecting "{rejectModalListing?.title || 'this listing'}".
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This note is shown to the landlord to help them fix and resubmit.
              </p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rejection Reason
                <textarea
                  value={rejectReasonInput}
                  onChange={(event) => setRejectReasonInput(event.target.value)}
                  placeholder="Write rejection reason for landlord"
                  rows={4}
                  maxLength={1200}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                />
                <p className="mt-1 text-[11px] text-slate-500 text-right">{String(rejectReasonInput || '').length}/1200</p>
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="kb-btn kb-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRejectWithReason}
                  className="kb-btn kb-btn-danger"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {accountActionModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#1f2937]">
                {accountActionModal.nextStatus === 'banned' ? 'Ban User Account' : 'Suspend User Account'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {accountActionModal.nextStatus === 'banned'
                  ? `Provide ban reason for ${accountActionModal.user?.name || accountActionModal.user?.email || 'this user'}.`
                  : `Provide suspension reason for ${accountActionModal.user?.name || accountActionModal.user?.email || 'this user'}.`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {accountActionModal.nextStatus === 'banned'
                  ? 'Ban immediately blocks future login and access.'
                  : 'Suspension blocks access until duration expires or admin reactivates the account.'}
              </p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action Reason
                <textarea
                  value={accountActionModal.reason}
                  onChange={(event) => setAccountActionModal((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="Write reason"
                  rows={4}
                  maxLength={1200}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                />
                <p className="mt-1 text-[11px] text-slate-500 text-right">{String(accountActionModal.reason || '').length}/1200</p>
              </label>

              {accountActionModal.nextStatus === 'suspended' && (
                <div className="mt-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suspension Days</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={accountActionModal.suspensionDays}
                    onChange={(event) => setAccountActionModal((prev) => ({ ...prev, suspensionDays: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                  />
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAccountActionModal}
                  disabled={Boolean(userActionProcessingId)}
                  className="kb-btn kb-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAccountActionModal}
                  disabled={Boolean(userActionProcessingId)}
                  className={`kb-btn ${
                    accountActionModal.nextStatus === 'banned' ? 'kb-btn-danger' : 'kb-btn-warning'
                  }`}
                >
                  {userActionProcessingId ? 'Saving...' : accountActionModal.nextStatus === 'banned' ? 'Confirm Ban' : 'Confirm Suspension'}
                </button>
              </div>
            </div>
          </div>
        )}

        {reportStatusModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#1f2937]">
                {reportStatusModal.nextStatus === 'dismissed' ? 'Dismiss Report' : 'Resolve Report'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Provide admin note for report status: {String(reportStatusModal.nextStatus || '').replace('_', ' ')}.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This note is visible to the reporter for transparency.
              </p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Admin Note
                <textarea
                  value={reportStatusModal.adminNote}
                  onChange={(event) => setReportStatusModal((prev) => ({ ...prev, adminNote: event.target.value }))}
                  placeholder="Write admin note"
                  rows={4}
                  maxLength={1200}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                />
                <p className="mt-1 text-[11px] text-slate-500 text-right">{String(reportStatusModal.adminNote || '').length}/1200</p>
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReportStatusModal}
                  disabled={Boolean(reportActionProcessingId)}
                  className="kb-btn kb-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReportStatusModal}
                  disabled={Boolean(reportActionProcessingId)}
                  className={`kb-btn ${
                    reportStatusModal.nextStatus === 'dismissed' ? 'kb-btn-danger' : 'kb-btn-success'
                  }`}
                >
                  {reportActionProcessingId ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {reportedListingActionModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#1f2937]">
                {reportedListingActionModal.action === 'delete_listing' ? 'Delete Reported Listing' : 'Warn Landlord'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {reportedListingActionModal.action === 'delete_listing'
                  ? 'This will remove the listing from the platform and resolve the report.'
                  : 'This sends a warning message to the landlord and resolves the report.'}
              </p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Admin Note
                <textarea
                  value={reportedListingActionModal.adminNote}
                  onChange={(event) => setReportedListingActionModal((prev) => ({ ...prev, adminNote: event.target.value }))}
                  placeholder="Write action note"
                  rows={4}
                  maxLength={1200}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                />
                <p className="mt-1 text-[11px] text-slate-500 text-right">{String(reportedListingActionModal.adminNote || '').length}/1200</p>
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReportedListingActionModal}
                  disabled={Boolean(reportActionProcessingId)}
                  className="kb-btn kb-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReportedListingActionModal}
                  disabled={Boolean(reportActionProcessingId)}
                  className={`kb-btn ${
                    reportedListingActionModal.action === 'delete_listing'
                      ? 'kb-btn-danger'
                      : 'kb-btn-warning'
                  }`}
                >
                  {reportedListingActionModal.action === 'delete_listing' ? <Trash2 size={14} /> : <SendHorizontal size={14} />}
                  {reportActionProcessingId
                    ? 'Saving...'
                    : reportedListingActionModal.action === 'delete_listing'
                      ? 'Confirm Delete'
                      : 'Send Warning'}
                </button>
              </div>
            </div>
          </div>
        )}

        {kycReviewModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#1f2937]">
                {kycReviewModal.decision === 'verify' ? 'Verify Landlord KYC' : 'Reject Landlord KYC'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {kycReviewModal.decision === 'verify'
                  ? `Confirm verification for ${kycReviewModal.landlord?.name || kycReviewModal.landlord?.email || 'this landlord'}?`
                  : `Provide rejection reason for ${kycReviewModal.landlord?.name || kycReviewModal.landlord?.email || 'this landlord'}.`}
              </p>

              {kycReviewModal.decision === 'reject' && (
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rejection Note
                  <textarea
                    value={kycReviewModal.reviewNote}
                    onChange={(event) => setKycReviewModal((prev) => ({ ...prev, reviewNote: event.target.value }))}
                    placeholder="Write rejection note for landlord"
                    rows={4}
                    maxLength={1200}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 text-right">{String(kycReviewModal.reviewNote || '').length}/1200</p>
                </label>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeKycReviewModal}
                  disabled={Boolean(kycActionProcessingId)}
                  className="kb-btn kb-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmKycReviewModal}
                  disabled={Boolean(kycActionProcessingId)}
                  className={`kb-btn ${kycReviewModal.decision === 'verify' ? 'kb-btn-success' : 'kb-btn-danger'}`}
                >
                  {kycActionProcessingId
                    ? 'Saving...'
                    : kycReviewModal.decision === 'verify'
                      ? 'Confirm Verify'
                      : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={showLogoutConfirm}
          title="Confirm Logout"
          message="Are you sure you want to logout from your admin account?"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleAdminLogout}
          cancelLabel="Cancel"
          confirmLabel="Logout"
          confirmVariant="danger"
        />

        <ConfirmModal
          open={showClearNotificationsConfirm}
          title="Clear all notifications"
          message="This will permanently remove all notifications. This action cannot be undone."
          onCancel={() => setShowClearNotificationsConfirm(false)}
          onConfirm={handleConfirmClearNotifications}
          cancelLabel="Cancel"
          confirmLabel="Clear all"
          confirmVariant="danger"
        />

        {activePanel === 'users' && (
          <section id="users" className="mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-bold tracking-tight text-[#1f2937]">Renter and Landlord Accounts</h2>
          <p className="mt-1 text-sm text-slate-600">Manage account access controls for renter and landlord users.</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {userFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setUserFilter(option.value)}
                className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                  userFilter === option.value
                    ? 'bg-[#1f2937] text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={applyUserSearch} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={userSearchInput}
              onChange={(event) => setUserSearchInput(event.target.value)}
              placeholder="Search user by name or email"
              className="h-11 grow rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#3A5AFF]/40"
            />
            <button
              type="submit"
              className="kb-btn kb-btn-secondary"
            >
              Search Users
            </button>
          </form>

          <p className="mt-3 text-xs font-medium text-slate-500">{userCountLabel}</p>

          {usersError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {usersError}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={6}>Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={6}>No users found for selected filter.</td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const userId = String(user.id || '');
                    const isProcessing = userActionProcessingId === userId;
                    const accountStatus = String(user.accountStatus || 'active').toLowerCase();

                    return (
                      <tr key={userId}>
                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-slate-800">{user.name || 'Unnamed User'}</p>
                          <p className="text-xs text-slate-500">{user.email || 'No email'}</p>
                          {user.phone ? <p className="text-xs text-slate-500">{user.phone}</p> : null}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${userBadgeClass(user.role)}`}>
                            {user.role === 'landlord' ? 'Landlord' : 'Renter'}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${accountStatusBadgeClass(accountStatus)}`}>
                            {accountStatus}
                          </span>
                          {user.suspensionUntil ? (
                            <p className="mt-1 text-[11px] text-slate-500">Until: {formatDateTime(user.suspensionUntil)}</p>
                          ) : null}
                          {user.accountActionReason ? (
                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">Reason: {user.accountActionReason}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          {userActivityLabel(user)}
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isProcessing || accountStatus === 'active'}
                              onClick={() => handleUserAccountAction(user, 'active')}
                              className="kb-btn kb-btn-soft-success kb-btn-sm disabled:cursor-not-allowed"
                            >
                              Activate
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing || accountStatus === 'suspended'}
                              onClick={() => openAccountActionModal(user, 'suspended')}
                              className="kb-btn kb-btn-soft-warning kb-btn-sm disabled:cursor-not-allowed"
                            >
                              Suspend
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing || accountStatus === 'banned'}
                              onClick={() => openAccountActionModal(user, 'banned')}
                              className="kb-btn kb-btn-soft-danger kb-btn-sm disabled:cursor-not-allowed"
                            >
                              Ban
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#1f2937] inline-flex items-center gap-2">
                  <BadgeCheck size={16} className="text-emerald-600" /> Landlord KYC Verification
                </h3>
                <p className="mt-1 text-xs text-slate-600">Review Citizenship/License uploads and assign verified landlord badges.</p>
              </div>
              <button
                type="button"
                onClick={fetchKycQueue}
                className="kb-btn kb-btn-secondary kb-btn-sm"
              >
                Refresh KYC
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {kycFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setKycFilter(option.value)}
                  className={`inline-flex h-8 items-center justify-center rounded-xl px-3 text-[11px] font-bold uppercase tracking-wide transition ${
                    kycFilter === option.value
                      ? 'bg-[#132238] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <form onSubmit={applyKycSearch} className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
              <input
                type="text"
                value={kycSearchInput}
                onChange={(event) => setKycSearchInput(event.target.value)}
                placeholder="Search landlord by name, email, or document type"
                className="h-10 grow rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#3A5AFF]/40"
              />
              <button
                type="submit"
                className="kb-btn kb-btn-secondary"
              >
                Search KYC
              </button>
            </form>

            <p className="mt-2 text-xs font-medium text-slate-500">{kycCountLabel}</p>

            {kycError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
                {kycError}
              </div>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Landlord</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kycLoading ? (
                    <tr>
                      <td className="px-4 py-4 text-slate-500" colSpan={4}>Loading KYC queue...</td>
                    </tr>
                  ) : kycQueue.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-slate-500" colSpan={4}>No landlord KYC submissions found.</td>
                    </tr>
                  ) : (
                    kycQueue.map((landlord) => {
                      const landlordId = String(landlord.id || '');
                      const isProcessing = kycActionProcessingId === landlordId;
                      const status = String(landlord.landlordKycStatus || 'pending').toLowerCase();

                      return (
                        <tr key={landlordId}>
                          <td className="px-4 py-4 align-top">
                            <p className="font-semibold text-slate-800">{landlord.name || 'Landlord'}</p>
                            <p className="text-xs text-slate-500">{landlord.email || '-'}</p>
                            {landlord.phone ? <p className="text-xs text-slate-500">{landlord.phone}</p> : null}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{landlord.landlordKycDocumentType || 'document'}</p>
                            {landlord.landlordKycDocumentImage ? (
                              <a
                                href={landlord.landlordKycDocumentImage}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex text-xs font-semibold text-[#3A5AFF] hover:underline"
                              >
                                Open ID Image
                              </a>
                            ) : (
                              <p className="mt-1 text-xs text-slate-500">No document image</p>
                            )}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                              status === 'verified'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : status === 'rejected'
                                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}>
                              {status.replace('_', ' ')}
                            </span>
                            {landlord.landlordKycReviewNote ? (
                              <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">Note: {landlord.landlordKycReviewNote}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={isProcessing || status === 'verified'}
                                onClick={() => openKycReviewModal(landlord, 'verify')}
                                className="kb-btn kb-btn-soft-success kb-btn-sm"
                              >
                                {isProcessing ? 'Saving...' : 'Verify Badge'}
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing || status === 'rejected'}
                                onClick={() => openKycReviewModal(landlord, 'reject')}
                                className="kb-btn kb-btn-soft-danger kb-btn-sm"
                              >
                                {isProcessing ? 'Saving...' : 'Reject ID'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </section>
        )}

        {activePanel === 'reports' && (
          <section id="reports" className="mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#1f2937]">Reported Content (Trash Folder)</h2>
              <p className="mt-1 text-sm text-slate-600">Handle fake, already-rented, or spam listings by deleting the listing or warning the landlord.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                fetchOverview();
                fetchReports();
              }}
              className="kb-btn kb-btn-secondary"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {reportFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setReportFilter(option.value)}
                className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition ${
                  reportFilter === option.value
                    ? 'bg-[#1f2937] text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={applyReportSearch} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={reportSearchInput}
              onChange={(event) => setReportSearchInput(event.target.value)}
              placeholder="Search report by description, category, or target"
              className="h-11 grow rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#3A5AFF]/40"
            />
            <button
              type="submit"
              className="kb-btn kb-btn-secondary"
            >
              Search Reports
            </button>
          </form>

          <p className="mt-3 text-xs font-medium text-slate-500">{reportsCountLabel}</p>

          {reportsError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {reportsError}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportsLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={6}>Loading reports...</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={6}>No reports found for selected filter.</td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const reportId = String(report?._id || '');
                    const status = String(report?.status || 'open').toLowerCase();
                    const isProcessing = reportActionProcessingId === reportId;
                    const isListingReport = String(report?.targetType || '').toLowerCase() === 'listing';
                    const isFinalized = ['resolved', 'dismissed'].includes(status);

                    return (
                      <tr key={reportId}>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-700">{report?.reporterId?.name || 'Unknown user'}</p>
                          <p className="text-xs text-slate-500">{report?.reporterId?.email || '-'}</p>
                          <p className="text-[11px] text-slate-500 capitalize">{report?.reporterRole || '-'}</p>
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          <p className="font-semibold capitalize text-slate-700">{report?.targetType || 'other'}</p>
                          <p>{report?.targetListingId?.title || report?.targetId || '-'}</p>
                          {report?.targetListingId?.location ? <p className="mt-0.5 text-[11px] text-slate-500">{report.targetListingId.location}</p> : null}
                          {report?.targetOwnerId?.email ? <p className="mt-0.5 text-[11px] text-slate-500">Owner: {report.targetOwnerId.email}</p> : null}
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          <p className="capitalize font-semibold text-slate-700">{report?.reasonCategory || 'other'}</p>
                          <p className="mt-1 line-clamp-2">{report?.description || '-'}</p>
                          {report?.landlordResponseNote ? <p className="mt-1 text-indigo-700">Landlord response: {report.landlordResponseNote}</p> : null}
                          {report?.adminNote ? <p className="mt-1 text-slate-500">Admin note: {report.adminNote}</p> : null}
                          {report?.adminDecisionSeverity && report.adminDecisionSeverity !== 'none' ? (
                            <p className="mt-1 text-[11px] text-slate-600">Decision: {String(report.adminDecisionSeverity).toUpperCase()} ({String(report.adminDecisionAction || 'none').replace('_', ' ')})</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${reportStatusBadgeClass(status)}`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top text-xs text-slate-600">
                          {formatDate(report?.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isProcessing || status === 'in_review'}
                              onClick={() => handleReportStatusUpdate(report, 'in_review')}
                              className="kb-btn kb-btn-soft-info kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {isProcessing ? 'Saving...' : 'In Review'}
                            </button>
                            {!isListingReport && (
                              <button
                                type="button"
                                disabled={isProcessing || status === 'resolved'}
                                onClick={() => openReportStatusModal(report, 'resolved')}
                                className="kb-btn kb-btn-soft-success kb-btn-sm disabled:cursor-not-allowed"
                              >
                                {isProcessing ? 'Saving...' : 'Resolve'}
                              </button>
                            )}
                            {isListingReport && (
                              <>
                                <button
                                  type="button"
                                  disabled={isProcessing || isFinalized}
                                  onClick={() => openReportedListingActionModal(report, 'warn_landlord')}
                                  className="kb-btn kb-btn-soft-warning kb-btn-sm disabled:cursor-not-allowed"
                                >
                                  {isProcessing ? 'Saving...' : 'Warn Landlord'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing || isFinalized}
                                  onClick={() => openReportedListingActionModal(report, 'delete_listing')}
                                  className="kb-btn kb-btn-soft-danger kb-btn-sm disabled:cursor-not-allowed"
                                >
                                  {isProcessing ? 'Saving...' : 'Delete Listing'}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              disabled={isProcessing || status === 'dismissed'}
                              onClick={() => openReportStatusModal(report, 'dismissed')}
                              className="kb-btn kb-btn-soft-danger kb-btn-sm disabled:cursor-not-allowed"
                            >
                              {isProcessing ? 'Saving...' : 'Dismiss'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          </section>
        )}

        {activePanel === 'audit' && (
          <section id="audit" className="mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#1f2937]">Admin Audit Logs</h2>
              <p className="mt-1 text-sm text-slate-600">Track who performed what action and when.</p>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="kb-btn kb-btn-secondary"
            >
              Refresh
            </button>
          </div>

          <form onSubmit={applyAuditSearch} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={auditSearchInput}
              onChange={(event) => setAuditSearchInput(event.target.value)}
              placeholder="Search by action, target, admin email, or reason"
              className="h-11 grow rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#3A5AFF]/40"
            />
            <button
              type="submit"
              className="kb-btn kb-btn-secondary"
            >
              Search Logs
            </button>
          </form>

          <p className="mt-3 text-xs font-medium text-slate-500">{auditCountLabel}</p>

          {auditError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {auditError}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={5}>Loading audit logs...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={5}>No audit logs found.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={String(log?._id)}>
                      <td className="px-4 py-4 align-top text-xs text-slate-700">
                        <p className="font-semibold capitalize">{String(log?.action || '').replace(/_/g, ' ') || '-'}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-600">
                        <p className="capitalize font-semibold text-slate-700">{log?.targetType || '-'}</p>
                        <p>{log?.targetLabel || log?.targetId || '-'}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-600">
                        {log?.adminEmail || '-'}
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-600 line-clamp-2">
                        {log?.reason || '-'}
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-600">
                        {formatDateTime(log?.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </section>
        )}
      </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
