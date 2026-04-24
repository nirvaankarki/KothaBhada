import React from 'react';
import { MessageSquare } from 'lucide-react';

const InquiriesSection = ({
  sourceListings,
  inquiryForm,
  setInquiryForm,
  inquiries,
  replyDrafts,
  setReplyDrafts,
  handleListingSelectForInquiry,
  handleCreateInquiry,
  handleSendReply,
  statusPill,
  formatStatusLabel,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 shadow-sm rounded-sm p-4">
        <h2 className="text-lg font-extrabold text-[#1a222e] mb-4">Send Inquiry to Landlord</h2>
        <form onSubmit={handleCreateInquiry} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Select Property</label>
            <select
              value={inquiryForm.listingId}
              onChange={(event) => handleListingSelectForInquiry(event.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3b66ff]/25"
              required
            >
              <option value="">Choose property</option>
              {sourceListings.map((item) => (
                <option key={item.listingId} value={item.listingId}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Owner Name"
              value={inquiryForm.ownerName}
              onChange={(event) => setInquiryForm((prev) => ({ ...prev, ownerName: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Owner Contact"
              value={inquiryForm.ownerContact}
              onChange={(event) => setInquiryForm((prev) => ({ ...prev, ownerContact: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
          </div>

          <textarea
            rows={4}
            placeholder="Write your message to landlord"
            value={inquiryForm.message}
            onChange={(event) => setInquiryForm((prev) => ({ ...prev, message: event.target.value }))}
            className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm"
            required
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-sm bg-[#3b66ff] text-white text-sm font-bold hover:bg-[#2f55d4]"
          >
            Send Inquiry
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#1a222e] inline-flex items-center gap-2">
          <MessageSquare size={18} /> Previous Inquiries
        </h2>

        {inquiries.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-sm p-8 text-center text-gray-500">
            No inquiries sent yet.
          </div>
        ) : (
          inquiries.map((inquiry) => {
            const hasMessages = Array.isArray(inquiry.messages) && inquiry.messages.length > 0;

            return (
              <div key={inquiry._id} className="bg-white border border-gray-100 shadow-sm rounded-sm p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#1a222e]">{inquiry.title}</h3>
                    <p className="text-xs text-gray-500">{inquiry.location}</p>
                  </div>
                  <span className={`inline-flex w-fit text-[11px] px-2 py-1 rounded-full font-semibold ${statusPill(inquiry.status)}`}>
                    {formatStatusLabel(inquiry.status)}
                  </span>
                </div>

                <div className="mt-3 text-sm text-gray-700 space-y-2">
                  <p><span className="font-semibold">Your message:</span> {inquiry.message}</p>
                  {hasMessages && (
                    <div className="bg-gray-50 border border-gray-100 rounded-sm p-3 space-y-2">
                      {inquiry.messages.map((msg) => (
                        <div key={msg._id} className="text-xs text-gray-700">
                          <span className="font-semibold">{msg.senderRole === 'landlord' ? 'Landlord' : 'You'}:</span> {msg.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {inquiry.status !== 'closed' && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={replyDrafts[inquiry._id] || ''}
                      onChange={(event) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [inquiry._id]: event.target.value,
                        }))
                      }
                      placeholder="Reply message"
                      className="flex-1 border border-gray-200 rounded-sm px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendReply(inquiry._id)}
                      className="px-3 py-2 text-sm font-bold rounded-sm bg-[#3b66ff] text-white hover:bg-[#2f55d4] sm:w-auto w-full"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InquiriesSection;
