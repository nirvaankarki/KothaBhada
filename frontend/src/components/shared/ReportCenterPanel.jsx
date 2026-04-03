import React from 'react';

const targetTypeOptions = [
  { value: 'listing', label: 'Listing' },
  { value: 'user', label: 'User' },
  { value: 'booking', label: 'Booking' },
  { value: 'chat', label: 'Chat' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
];

const reasonOptions = [
  { value: 'fraud', label: 'Fraud' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fake_listing', label: 'Fake Listing' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'other', label: 'Other' },
];

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
}

function reportStatusPillClass(status) {
  const normalized = String(status || 'open').toLowerCase();
  if (normalized === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized === 'dismissed') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (normalized === 'in_review') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

const ReportCenterPanel = ({
  title = 'Report and Abuse Center',
  subtitle = 'Submit a report and track your previous reports.',
  targetTypeOptions: targetTypeOptionsProp,
  reportForm,
  onReportFormChange,
  handleCreateReport,
  reportSubmitting,
  reports,
  reportsLoading,
  handleRefreshReports,
  emptyMessage = 'No reports submitted yet.',
}) => {
  const targetTypeItems = Array.isArray(targetTypeOptionsProp) && targetTypeOptionsProp.length
    ? targetTypeOptionsProp
    : targetTypeOptions;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-gray-100 shadow-sm rounded-sm p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#1a222e]">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          {typeof handleRefreshReports === 'function' ? (
            <button
              type="button"
              onClick={handleRefreshReports}
              className="px-3 py-2 rounded-sm text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              Refresh
            </button>
          ) : null}
        </div>

        <form onSubmit={handleCreateReport} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-gray-600">
              Target Type
              <select
                value={reportForm.targetType}
                onChange={(event) => onReportFormChange('targetType', event.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3b66ff]/25"
              >
                {targetTypeItems.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-gray-600">
              Reason Category
              <select
                value={reportForm.reasonCategory}
                onChange={(event) => onReportFormChange('reasonCategory', event.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3b66ff]/25"
              >
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold text-gray-600">
            Target ID (optional)
            <input
              type="text"
              value={reportForm.targetId}
              onChange={(event) => onReportFormChange('targetId', event.target.value)}
              placeholder="Example: listing id, booking id, or user id"
              className="w-full mt-1 border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3b66ff]/25"
            />
          </label>

          <label className="block text-xs font-semibold text-gray-600">
            Description
            <textarea
              rows={4}
              maxLength={1200}
              value={reportForm.description}
              onChange={(event) => onReportFormChange('description', event.target.value)}
              placeholder="Describe what happened and include important details."
              className="w-full mt-1 border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3b66ff]/25"
              required
            />
          </label>

          <button
            type="submit"
            disabled={reportSubmitting}
            className="px-4 py-2 rounded-sm bg-[#3b66ff] text-white text-sm font-bold hover:bg-[#2f55d4] disabled:opacity-60"
          >
            {reportSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#1a222e]">My Reports</h2>

        {reportsLoading ? (
          <div className="bg-white border border-gray-100 rounded-sm p-8 text-center text-gray-500">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-sm p-8 text-center text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          reports.map((report) => {
            const reportStatus = String(report?.status || 'open').toLowerCase();
            return (
              <article key={report?._id} className="bg-white border border-gray-100 shadow-sm rounded-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#1a222e] capitalize">
                      {String(report?.reasonCategory || 'other').replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Target: {report?.targetType || 'other'} {report?.targetListingId?.title || report?.targetId || ''}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full border font-semibold capitalize ${reportStatusPillClass(reportStatus)}`}>
                    {reportStatus.replace('_', ' ')}
                  </span>
                </div>

                <p className="mt-3 text-sm text-gray-700 leading-relaxed">{report?.description || '-'}</p>

                {report?.adminNote ? (
                  <div className="mt-3 rounded-sm border border-blue-100 bg-blue-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Admin Note</p>
                    <p className="mt-1 text-sm text-blue-800">{report.adminNote}</p>
                  </div>
                ) : null}

                <p className="mt-3 text-[11px] text-gray-500">
                  Submitted: {formatDateTime(report?.createdAt)}
                  {report?.resolvedAt ? ` | Resolved: ${formatDateTime(report.resolvedAt)}` : ''}
                </p>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default ReportCenterPanel;