import React from 'react';
import LandlordSidebar from '../components/landlordDashboard/LandlordSidebar';
import DashboardHeader from '../components/landlordDashboard/DashboardHeader';
import DashboardOverviewTab from '../components/landlordDashboard/DashboardOverviewTab';
import ListingsTab from '../components/landlordDashboard/ListingsTab';
import ChatTab from '../components/landlordDashboard/ChatTab';
import BookingsTab from '../components/landlordDashboard/BookingsTab';
import ProfileTab from '../components/landlordDashboard/ProfileTab';
import { useLandlordDashboardController } from '../hooks/useLandlordDashboardController';

const LandlordDashboardPage = () => {
  const { state, refs, handlers } = useLandlordDashboardController();

  return (
    <div className="flex min-h-screen bg-[#f4f7fe] font-sans text-gray-800">
      <LandlordSidebar
        activeTab={state.activeTab}
        setActiveTab={handlers.setActiveTab}
        stats={state.stats}
      />

      <main className="flex-1 p-5 md:p-8 overflow-y-auto">
        <DashboardHeader profilePhoto={state.profileForm.profilePhoto} profileName={state.profileForm.name} />

        {state.error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{state.error}</div>
        )}
        {state.success && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{state.success}</div>
        )}

        {state.activeTab === 'dashboard' && (
          <DashboardOverviewTab stats={state.stats} ownerBookings={state.ownerBookings} />
        )}

        {state.activeTab === 'listings' && (
          <ListingsTab
            stats={state.stats}
            form={state.form}
            handleChange={handlers.handleChange}
            handleSubmit={handlers.handleSubmit}
            submitting={state.submitting}
            fileInputRef={refs.fileInputRef}
            handleImageSelect={handlers.handleImageSelect}
            openImagePicker={handlers.openImagePicker}
            clearSelectedImage={handlers.clearSelectedImage}
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
            ownerInquiries={state.ownerInquiries}
            chatDrafts={state.chatDrafts}
            setChatDrafts={handlers.setChatDrafts}
            handleOwnerReply={handlers.handleOwnerReply}
            sendingInquiryId={state.sendingInquiryId}
          />
        )}

        {state.activeTab === 'bookings' && <BookingsTab ownerBookings={state.ownerBookings} />}

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
