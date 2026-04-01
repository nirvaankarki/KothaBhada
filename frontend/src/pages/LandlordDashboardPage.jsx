import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandlordSidebar from '../components/landlordDashboard/LandlordSidebar';
import DashboardHeader from '../components/landlordDashboard/DashboardHeader';
import DashboardOverviewTab from '../components/landlordDashboard/DashboardOverviewTab';
import ListingsTab from '../components/landlordDashboard/ListingsTab';
import ChatTab from '../components/landlordDashboard/ChatTab';
import BookingsTab from '../components/landlordDashboard/BookingsTab';
import ProfileTab from '../components/landlordDashboard/ProfileTab';
import { useLandlordDashboardController } from '../hooks/useLandlordDashboardController';
import { useToast } from '../context/ToastContext';
import { getNotificationTargetPath } from '../utils/notificationNavigation';

const LandlordDashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, refs, handlers } = useLandlordDashboardController();
  const { showToast } = useToast();

  useEffect(() => {
    if (!state.error) return;
    showToast({ type: 'error', title: 'Dashboard error', message: state.error });
  }, [state.error, showToast]);

  useEffect(() => {
    if (!state.success) return;
    showToast({ type: 'success', title: 'Success', message: state.success });
  }, [state.success, showToast]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const requestedTab = query.get('tab');
    const chatId = query.get('chatId');
    const allowedTabs = new Set(['dashboard', 'listings', 'chat', 'bookings', 'profile']);

    if (requestedTab && allowedTabs.has(requestedTab)) {
      handlers.setActiveTab(requestedTab);
    }

    if (requestedTab === 'chat' && chatId) {
      handlers.handleOpenOwnerChat(chatId);
    }
  }, [location.search, handlers]);

  const handleLandlordNotificationNavigate = (notification) => {
    const targetPath = getNotificationTargetPath({ notification, isLandlord: true });
    navigate(targetPath);
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fe] font-sans text-gray-800">
      <LandlordSidebar
        activeTab={state.activeTab}
        setActiveTab={handlers.setActiveTab}
        stats={state.stats}
      />

      <main className="flex-1 p-5 md:p-8 overflow-y-auto">
        <DashboardHeader
          profilePhoto={state.profileForm.profilePhoto}
          profileName={state.profileForm.name}
          notifications={state.notifications}
          unreadNotifications={state.unreadNotifications}
          onMarkNotificationRead={handlers.markNotificationAsRead}
          onMarkAllNotificationsRead={handlers.markAllNotificationsAsRead}
          onClearAllNotifications={handlers.clearAllNotifications}
          onNotificationNavigate={handleLandlordNotificationNavigate}
        />

        {state.activeTab === 'dashboard' && (
          <DashboardOverviewTab stats={state.stats} ownerBookings={state.ownerBookings} />
        )}

        {state.activeTab === 'listings' && (
          <ListingsTab
            stats={state.stats}
            form={state.form}
            editingListingId={state.editingListingId}
            handleChange={handlers.handleChange}
            handleAddKeyFeature={handlers.handleAddKeyFeature}
            handleRemoveKeyFeature={handlers.handleRemoveKeyFeature}
            handleAddAreaHighlight={handlers.handleAddAreaHighlight}
            handleRemoveAreaHighlight={handlers.handleRemoveAreaHighlight}
            handleSubmit={handlers.handleSubmit}
            submitting={state.submitting}
            fileInputRef={refs.fileInputRef}
            handleImageSelect={handlers.handleImageSelect}
            openImagePicker={handlers.openImagePicker}
            clearSelectedImage={handlers.clearSelectedImage}
            handleStartNewListing={handlers.handleStartNewListing}
            imageName={state.imageName}
            loading={state.loading}
            listings={state.listings}
            handleViewListing={handlers.handleViewListing}
            handleEditDraft={handlers.handleEditDraft}
            handleDelete={handlers.handleDelete}
            deletingId={state.deletingId}
            formatDate={handlers.formatDate}
          />
        )}

        {state.activeTab === 'chat' && (
          <ChatTab
            ownerChats={state.ownerChats}
            selectedOwnerChatId={state.selectedOwnerChatId}
            chatDrafts={state.chatDrafts}
            setChatDrafts={handlers.setChatDrafts}
            handleOpenOwnerChat={handlers.handleOpenOwnerChat}
            handleOwnerReply={handlers.handleOwnerReply}
            sendingChatId={state.sendingChatId}
            isChatUnread={handlers.isChatUnread}
          />
        )}

        {state.activeTab === 'bookings' && (
          <BookingsTab
            ownerBookings={state.ownerBookings}
            bookingResponseDrafts={state.bookingResponseDrafts}
            setBookingResponseDrafts={handlers.setBookingResponseDrafts}
            handleOwnerBookingDecision={handlers.handleOwnerBookingDecision}
            updatingBookingId={state.updatingBookingId}
          />
        )}

        {state.activeTab === 'profile' && (
          <ProfileTab
            profileForm={state.profileForm}
            handleProfileChange={handlers.handleProfileChange}
            handleProfileSubmit={handlers.handleProfileSubmit}
            savingProfile={state.savingProfile}
            profileImageInputRef={refs.profileImageInputRef}
            handleProfileImageSelect={handlers.handleProfileImageSelect}
            clearProfileImage={handlers.clearProfileImage}
          />
        )}
      </main>
    </div>
  );
};

export default LandlordDashboardPage;
