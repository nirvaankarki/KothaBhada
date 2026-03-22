import React from 'react';
import { Send } from 'lucide-react';

const ChatTab = ({ ownerInquiries, chatDrafts, setChatDrafts, handleOwnerReply, sendingInquiryId }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold text-[#132238] mb-4">Renter Inquiries</h3>

        {ownerInquiries.length === 0 ? (
          <p className="text-sm text-gray-500">No renter inquiries yet.</p>
        ) : (
          <div className="space-y-4">
            {ownerInquiries.map((inquiry) => (
              <article key={inquiry._id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-base font-bold text-[#132238]">{inquiry.title}</h4>
                    <p className="text-xs text-gray-500">Renter: {inquiry.userId?.name || 'Unknown'} ({inquiry.userId?.email || 'N/A'})</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${inquiry.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {inquiry.status}
                  </span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mb-3">
                  {(inquiry.messages || []).map((msg, idx) => (
                    <div
                      key={`${inquiry._id}-${idx}`}
                      className={`p-2 rounded-lg text-sm ${msg.senderType === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'}`}
                    >
                      <p className="text-[11px] font-bold uppercase opacity-70 mb-1">{msg.senderType}</p>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatDrafts[inquiry._id] || ''}
                    onChange={(e) => setChatDrafts((prev) => ({ ...prev, [inquiry._id]: e.target.value }))}
                    placeholder="Reply to renter..."
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleOwnerReply(inquiry._id)}
                    disabled={sendingInquiryId === inquiry._id}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-[#1f2937] text-white rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-60"
                  >
                    <Send size={14} /> {sendingInquiryId === inquiry._id ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatTab;
