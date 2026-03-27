import React from 'react';
import {
  PlusCircle,
  ImagePlus,
  X,
  XCircle,
  Building2,
  MapPin,
  Bed,
  Bath,
  Square,
  ArrowUpRight,
  CalendarDays,
  PencilLine,
  Eye,
  Trash2,
} from 'lucide-react';

const ListingsTab = ({
  stats,
  form,
  editingListingId,
  handleChange,
  handleSubmit,
  submitting,
  fileInputRef,
  handleImageSelect,
  openImagePicker,
  clearSelectedImage,
  handleStartNewListing,
  imageName,
  loading,
  listings,
  handleViewListing,
  handleEditDraft,
  handleDelete,
  deletingId,
  formatDate,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [deleteCandidate, setDeleteCandidate] = React.useState(null);

  const openCreateModal = () => {
    handleStartNewListing();
    setIsCreateModalOpen(true);
  };
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const handleEditAndOpenForm = (item) => {
    handleEditDraft(item);
    setIsCreateModalOpen(true);
  };

  const requestDelete = (item) => setDeleteCandidate(item);
  const cancelDelete = () => setDeleteCandidate(null);

  const confirmDelete = async () => {
    if (!deleteCandidate?._id) return;
    await handleDelete(deleteCandidate._id);
    setDeleteCandidate(null);
  };

  return (
    <>
      <section className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#132238]">My Listings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Total listings published by you: <span className="font-bold text-[#1d4ed8]">{stats.totalListings}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] text-white text-sm font-semibold hover:bg-blue-700"
          >
            <PlusCircle size={16} /> Create New Listing
          </button>
        </div>
      </section>

      <div className="space-y-6">
        <div className="space-y-6">
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-[#132238] mb-4">Your Listings</h3>

            {loading ? (
              <p className="text-sm text-gray-500">Loading your listings...</p>
            ) : listings.length === 0 ? (
              <p className="text-sm text-gray-500">You have not published any listings yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                {listings.map((item) => (
                  <article
                    key={item._id}
                    className="w-full h-full bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className="relative h-48 w-full shrink-0">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/45 to-transparent" />

                      <div className="absolute right-3 bottom-3 rounded-xl bg-white/95 px-3 py-1.5 shadow">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Monthly Rent</p>
                        <p className="text-base font-black text-[#1d4ed8]">Rs {Number(item.price || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-lg font-extrabold text-[#132238] line-clamp-2">{item.title || 'Untitled Listing'}</h4>
                        <ArrowUpRight size={16} className="text-blue-600 shrink-0 mt-1" />
                      </div>

                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={12} /> {item.location || 'Location not specified'}
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-center">
                          <Bed size={14} className="mx-auto text-blue-600" />
                          <p className="mt-1 text-[11px] font-semibold text-gray-700">{item.bedrooms ?? 0} Beds</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-center">
                          <Bath size={14} className="mx-auto text-blue-600" />
                          <p className="mt-1 text-[11px] font-semibold text-gray-700">{item.bathrooms ?? 0} Baths</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-center">
                          <Square size={14} className="mx-auto text-blue-600" />
                          <p className="mt-1 text-[11px] font-semibold text-gray-700">{item.areaSqFt ?? 0} sqft</p>
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {item.description || 'No description provided for this property yet.'}
                      </p>

                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <CalendarDays size={12} /> {formatDate(item.createdAt)}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.status === 'inactive' ? 'bg-gray-400' : 'bg-green-500'}`} />
                          <span className="text-sm font-medium text-gray-700 capitalize">{item.status || 'active'}</span>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleEditAndOpenForm(item)}
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                            aria-label="Edit listing"
                            title="Edit listing"
                          >
                            <PencilLine size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewListing(item)}
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                            aria-label="View listing"
                            title="View listing"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(item)}
                            disabled={deletingId === item._id}
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-60"
                            aria-label="Delete listing"
                            title="Delete listing"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px] p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center py-6">
            <section className="w-full max-w-5xl bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <PlusCircle size={18} className="text-[#2563eb]" />
                  <h3 className="text-xl font-bold text-[#132238]">{editingListingId ? 'Edit Listing' : 'Create New Listing'}</h3>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="Close create listing form"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={handleChange('title')}
                      placeholder="e.g. Modern 2BHK Flat in Baneshwor"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={handleChange('location')}
                      placeholder="e.g. Kalopul, Kathmandu"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Monthly Rent (Rs)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.price}
                      onChange={handleChange('price')}
                      placeholder="e.g. 25000"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bedrooms</label>
                    <input
                      type="number"
                      min="0"
                      value={form.bedrooms}
                      onChange={handleChange('bedrooms')}
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bathrooms</label>
                    <input
                      type="number"
                      min="0"
                      value={form.bathrooms}
                      onChange={handleChange('bathrooms')}
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Area (sq.ft)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.areaSqFt}
                      onChange={handleChange('areaSqFt')}
                      placeholder="e.g. 450"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact Number</label>
                    <input
                      type="text"
                      value={form.ownerPhone}
                      onChange={handleChange('ownerPhone')}
                      placeholder="e.g. +977-98XXXXXXXX"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</label>
                    <textarea
                      value={form.description}
                      onChange={handleChange('description')}
                      rows={4}
                      placeholder="Describe the property, amenities, and neighborhood."
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Room Image</label>
                  <div className="mt-1 p-3 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <button
                      type="button"
                      onClick={openImagePicker}
                      className="h-44 w-full rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors"
                    >
                      {form.image ? (
                        <img src={form.image} alt="Selected room" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-gray-500 text-xs">
                          <ImagePlus size={22} className="mx-auto mb-2 text-gray-400" />
                          <p>No image selected</p>
                          <p className="mt-1 text-[11px] text-gray-400">Click here to upload</p>
                        </div>
                      )}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {form.image && (
                        <button
                          type="button"
                          onClick={clearSelectedImage}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                        >
                          <XCircle size={14} /> Remove
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500">{imageName || 'PNG, JPG, JPEG up to 5MB'}</p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Building2 size={15} /> {submitting ? (editingListingId ? 'Saving...' : 'Publishing...') : (editingListingId ? 'Save Changes' : 'Publish Listing')}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px] p-4">
          <div className="min-h-full flex items-center justify-center">
            <section className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-[#132238]">Delete Listing?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete <span className="font-semibold text-gray-800">{deleteCandidate.title || 'this listing'}</span>? This action cannot be undone.
              </p>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deletingId === deleteCandidate._id}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingId === deleteCandidate._id}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingId === deleteCandidate._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
};

export default ListingsTab;
