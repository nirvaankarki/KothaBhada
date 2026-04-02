import React from 'react';
import {
  PlusCircle,
  ImagePlus,
  X,
  XCircle,
  Box,
  CheckCircle2,
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
  handleAddKeyFeature,
  handleRemoveKeyFeature,
  handleSubmit,
  submitting,
  locating,
  fileInputRef,
  modelInputRef,
  handleImageSelect,
  handleModelSelect,
  openImagePicker,
  openModelPicker,
  handleUseCurrentLocation,
  clearSelectedImage,
  clearSelectedModel,
  handleRemoveSelectedImage,
  handleStartNewListing,
  imageName,
  modelName,
  uploadingModel,
  uploadingModelProgress,
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
  const [featureInput, setFeatureInput] = React.useState('');
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [modelSuccessPulse, setModelSuccessPulse] = React.useState(false);
  const modelReadyRef = React.useRef(false);

  const keyFeatures = Array.isArray(form.keyFeatures)
    ? form.keyFeatures
    : String(form.keyFeatures || '')
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const hasUploadedModel = Boolean(String(form.model3dUrl || '').trim()) && !uploadingModel;
  const highlightLoadedModelText = hasUploadedModel && modelName === 'Loaded 3D model from listing';

  React.useEffect(() => {
    if (hasUploadedModel && !modelReadyRef.current) {
      modelReadyRef.current = true;
      setModelSuccessPulse(true);

      const timer = setTimeout(() => {
        setModelSuccessPulse(false);
      }, 900);

      return () => clearTimeout(timer);
    }

    if (!hasUploadedModel) {
      modelReadyRef.current = false;
      setModelSuccessPulse(false);
    }

    return undefined;
  }, [hasUploadedModel]);

  React.useEffect(() => {
    if (!isCreateModalOpen || typeof document === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCreateModalOpen]);

  const listingImages = React.useMemo(() => {
    const imageList = [];

    if (Array.isArray(form.images)) {
      form.images.forEach((item) => {
        const cleaned = String(item || '').trim();
        if (cleaned) imageList.push(cleaned);
      });
    }

    const primaryImage = String(form.image || '').trim();
    if (primaryImage) imageList.push(primaryImage);

    return Array.from(new Set(imageList));
  }, [form.images, form.image]);

  React.useEffect(() => {
    if (!listingImages.length) {
      setActiveImageIndex(0);
      return;
    }

    if (activeImageIndex > listingImages.length - 1) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, listingImages.length]);

  const openCreateModal = () => {
    handleStartNewListing();
    setFeatureInput('');
    setActiveImageIndex(0);
    setIsCreateModalOpen(true);
  };
  const closeCreateModal = () => {
    setFeatureInput('');
    setActiveImageIndex(0);
    setIsCreateModalOpen(false);
  };

  const handleEditAndOpenForm = (item) => {
    handleEditDraft(item);
    setFeatureInput('');
    setActiveImageIndex(0);
    setIsCreateModalOpen(true);
  };

  const addFeatureFromInput = () => {
    const candidate = featureInput.trim();
    if (!candidate) return;
    handleAddKeyFeature(candidate);
    setFeatureInput('');
  };

  const handleFeatureKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addFeatureFromInput();
    }
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
                {listings.map((item) => {
                  const has2DRoom = Boolean(String(item?.image || '').trim() || (Array.isArray(item?.images) && item.images.length));
                  const has3DRoomTour = Boolean(String(item?.model3dUrl || '').trim());

                  return (
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
                  );
                })}
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
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={handleChange('title')}
                      placeholder="e.g. Modern 2BHK Flat in Baneshwor"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 space-y-2">
                      <input
                        type="text"
                        value={form.location}
                        onChange={handleChange('location')}
                        placeholder="e.g. Kalopul, Kathmandu"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                      />

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={locating || submitting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                        >
                          <MapPin size={13} /> {locating ? 'Detecting...' : 'Use Current Location'}
                        </button>

                        {(form.latitude || form.longitude) && (
                          <p className="text-[11px] text-gray-500 text-right">
                            {form.latitude || '-'}, {form.longitude || '-'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Monthly Rent (Rs) <span className="text-red-500">*</span>
                    </label>
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
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Bedrooms <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.bedrooms}
                      onChange={handleChange('bedrooms')}
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Bathrooms <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.bathrooms}
                      onChange={handleChange('bathrooms')}
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Area (sq.ft) <span className="text-red-500">*</span>
                    </label>
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
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.ownerPhone}
                      onChange={handleChange('ownerPhone')}
                      placeholder="e.g. +977-98XXXXXXXX"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={handleChange('description')}
                      rows={4}
                      placeholder="Describe the property, amenities, and neighborhood."
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Key Features <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="flex flex-wrap gap-2 mb-3 min-h-6">
                        {keyFeatures.length === 0 ? (
                          <p className="text-xs text-gray-500">No features added yet.</p>
                        ) : (
                          keyFeatures.map((feature) => (
                            <span
                              key={feature}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700"
                            >
                              {feature}
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyFeature(feature)}
                                className="text-blue-600 hover:text-blue-800"
                                aria-label={`Remove ${feature}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={featureInput}
                          onChange={(e) => setFeatureInput(e.target.value)}
                          onKeyDown={handleFeatureKeyDown}
                          placeholder="Type a feature and press Enter"
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <button
                          type="button"
                          onClick={addFeatureFromInput}
                          className="px-3 py-2 rounded-lg bg-[#2563eb] text-white text-xs font-semibold hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">Add multiple features to show property highlights on listing details.</p>
                  </div>

                </div>

                <div className="lg:col-span-4">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Room Images</label>
                  <div className="mt-1 p-3 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <button
                      type="button"
                      onClick={openImagePicker}
                      className="h-44 w-full rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors"
                    >
                      {listingImages.length ? (
                        <img src={listingImages[activeImageIndex]} alt="Selected room" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-gray-500 text-xs">
                          <ImagePlus size={22} className="mx-auto mb-2 text-gray-400" />
                          <p>No images selected</p>
                          <p className="mt-1 text-[11px] text-gray-400">Click here to upload multiple room images</p>
                        </div>
                      )}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {listingImages.length > 0 && (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        <button
                          type="button"
                          onClick={openImagePicker}
                          className="h-14 w-full overflow-hidden rounded-lg border border-dashed border-blue-300 bg-blue-50/60 text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                          aria-label="Add more room images"
                          title="Add more images"
                        >
                          <PlusCircle size={18} />
                        </button>

                        {listingImages.map((imageUrl, index) => (
                          <div key={`${imageUrl}-${index}`} className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveImageIndex(index)}
                              className={`h-14 w-full overflow-hidden rounded-lg border ${
                                activeImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                              }`}
                              aria-label={`Preview image ${index + 1}`}
                            >
                              <img src={imageUrl} alt={`Room preview ${index + 1}`} className="h-full w-full object-cover" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedImage(imageUrl)}
                              className="absolute -top-1.5 -right-1.5 rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-50 p-0.5"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {listingImages.length > 0 && (
                        <button
                          type="button"
                          onClick={clearSelectedImage}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                        >
                          <XCircle size={14} /> Remove All
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500">{imageName || 'PNG, JPG, JPEG up to 5MB each (max 8 images)'}</p>
                  </div>

                  <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-500">3D Model (GLB/GLTF)</label>
                  <div className="mt-1 p-3 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <button
                      type="button"
                      onClick={openModelPicker}
                      disabled={uploadingModel}
                      className="h-36 w-full rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors"
                    >
                      <div
                        className={`text-center text-xs text-gray-500 rounded-lg px-3 py-2 transition-all duration-300 ${
                          highlightLoadedModelText
                            ? 'bg-emerald-100/80 border border-emerald-200'
                            : ''
                        } ${modelSuccessPulse ? 'scale-105 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]' : 'scale-100'}`}
                      >
                        {hasUploadedModel ? (
                          <CheckCircle2
                            size={20}
                            className={`mx-auto mb-1.5 text-emerald-600 ${modelSuccessPulse ? 'animate-bounce' : ''}`}
                          />
                        ) : (
                          <Box size={20} className="mx-auto mb-1.5 text-gray-400" />
                        )}
                        <p className={highlightLoadedModelText ? 'text-emerald-700 font-semibold' : ''}>
                          {uploadingModel ? 'Uploading 3D model...' : (modelName || 'Upload 3D model file')}
                        </p>
                        <p className={`mt-0.5 text-[11px] ${highlightLoadedModelText ? 'text-emerald-700' : 'text-gray-400'}`}>
                          Only .glb or .gltf files are allowed
                        </p>
                      </div>
                    </button>

                    <input
                      ref={modelInputRef}
                      type="file"
                      accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                      onChange={handleModelSelect}
                      className="hidden"
                    />

                    {form.model3dUrl && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={clearSelectedModel}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                        >
                          <XCircle size={14} /> Remove 3D Model
                        </button>
                      </div>
                    )}

                    {uploadingModel && (
                      <div className="mt-3">
                        <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-200"
                            style={{ width: `${uploadingModelProgress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-blue-700 font-semibold">Uploading: {uploadingModelProgress}%</p>
                      </div>
                    )}

                    <p className="mt-2 text-[11px] text-gray-500">Only 3D formats accepted (.glb/.gltf). Max size 512MB.</p>
                  </div>

                  <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-500">Custom 3D Tour Points (Optional)</label>
                  <div className="mt-1 p-3 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <textarea
                      rows={8}
                      value={form.tourPoints || ''}
                      onChange={handleChange('tourPoints')}
                      placeholder={'[{"label":"Entry","x":2.6,"y":1.4,"z":0.2,"lookAtX":0,"lookAtY":0.82,"lookAtZ":0}]'}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <p className="mt-2 text-[11px] text-gray-500">
                      Use JSON array format. Each point requires x, y, z. Optional: label, lookAtX, lookAtY, lookAtZ.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || uploadingModel}
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
