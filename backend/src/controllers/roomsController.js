import { Room } from '../models/roomModel.js';
import { User } from '../models/userModel.js';
import { Booking } from '../models/bookingModel.js';
import { extname } from 'path';
import { unlink } from 'fs/promises';
import { isCloudinaryConfigured, uploadDataUriToCloudinary, uploadLargeFileToCloudinary } from '../config/cloudinary.js';

const OVERPASS_ENDPOINTS = [
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter',
    'https://overpass-api.de/api/interpreter',
];

const PLACE_TYPE_PRIORITY = {
    hospital: 1,
    clinic: 1,
    pharmacy: 2,
    school: 2,
    college: 2,
    university: 2,
    bus_station: 3,
    station: 3,
    supermarket: 4,
    marketplace: 4,
    mall: 4,
    bank: 5,
    police: 5,
    restaurant: 6,
    cafe: 6,
};

const IMPORTANT_CATEGORY_ORDER = ['health', 'education', 'transport', 'shopping', 'safety'];

const TYPE_TO_CATEGORY = {
    hospital: 'health',
    clinic: 'health',
    pharmacy: 'health',
    school: 'education',
    college: 'education',
    university: 'education',
    bus_station: 'transport',
    station: 'transport',
    supermarket: 'shopping',
    marketplace: 'shopping',
    mall: 'shopping',
    convenience: 'shopping',
    bank: 'safety',
    police: 'safety',
    restaurant: 'dining',
    cafe: 'dining',
};

const CATEGORY_LABELS = {
    health: 'Health',
    education: 'Education',
    transport: 'Transport',
    shopping: 'Shopping',
    safety: 'Safety',
    dining: 'Dining',
    other: 'Other',
};

function toRad(value) {
    return (value * Math.PI) / 180;
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earthRadius * c);
}

function buildOverpassQuery(lat, lon, radiusMeters = 1500) {
    return `[out:json][timeout:25];
(
  node(around:${radiusMeters},${lat},${lon})[amenity~"hospital|clinic|pharmacy|school|college|university|bus_station|bank|police|restaurant|cafe|marketplace"];
  way(around:${radiusMeters},${lat},${lon})[amenity~"hospital|clinic|pharmacy|school|college|university|bus_station|bank|police|restaurant|cafe|marketplace"];
  node(around:${radiusMeters},${lat},${lon})[shop~"supermarket|mall|convenience"];
  way(around:${radiusMeters},${lat},${lon})[shop~"supermarket|mall|convenience"];
  node(around:${radiusMeters},${lat},${lon})[public_transport~"station"];
  way(around:${radiusMeters},${lat},${lon})[public_transport~"station"];
);
out center;`;
}

function normalizeOverpassElement(element) {
    const tags = element?.tags || {};
    const lat = Number(element?.lat ?? element?.center?.lat);
    const lon = Number(element?.lon ?? element?.center?.lon);
    const name = String(tags.name || '').trim();
    const type = String(tags.amenity || tags.shop || tags.public_transport || '').trim().toLowerCase();

    if (!name || !type || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
    }

    return { name, type, lat, lon };
}

function getCategoryByType(type) {
    const normalizedType = String(type || '').toLowerCase();
    return TYPE_TO_CATEGORY[normalizedType] || 'other';
}

function formatPlaceType(type) {
    return String(type || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function fetchOverpassWithFallback(query, { timeoutMs = 12000, retriesPerEndpoint = 1 } = {}) {
    let lastError = null;

    for (const endpoint of OVERPASS_ENDPOINTS) {
        for (let attempt = 0; attempt <= retriesPerEndpoint; attempt += 1) {
            const requestController = new AbortController();
            const timeoutId = setTimeout(() => {
                requestController.abort();
            }, timeoutMs + (attempt * 1500));

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    signal: requestController.signal,
                    headers: {
                        'Content-Type': 'text/plain;charset=UTF-8',
                    },
                    body: query,
                });

                if (!response.ok) {
                    throw new Error(`Nearby places lookup failed with status ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                lastError = error;
            } finally {
                clearTimeout(timeoutId);
            }
        }
    }

    throw lastError || new Error('Nearby places lookup failed on all providers');
}

function buildHighlightsFromOverpassElements(rawElements, lat, lon) {
    const uniqueByName = new Map();
    rawElements.forEach((element) => {
        const normalized = normalizeOverpassElement(element);
        if (!normalized) return;

        const dedupeKey = `${normalized.name.toLowerCase()}-${normalized.type}`;
        if (uniqueByName.has(dedupeKey)) return;

        const distance = getDistanceInMeters(lat, lon, normalized.lat, normalized.lon);
        uniqueByName.set(dedupeKey, {
            name: normalized.name,
            type: normalized.type,
            category: getCategoryByType(normalized.type),
            distance,
            typeLabel: formatPlaceType(normalized.type),
            label: normalized.name,
        });
    });

    const rankedPlaces = Array.from(uniqueByName.values()).sort((a, b) => {
        const aCategoryPriority = IMPORTANT_CATEGORY_ORDER.indexOf(a.category);
        const bCategoryPriority = IMPORTANT_CATEGORY_ORDER.indexOf(b.category);
        const aCategoryRank = aCategoryPriority === -1 ? 99 : aCategoryPriority;
        const bCategoryRank = bCategoryPriority === -1 ? 99 : bCategoryPriority;
        if (aCategoryRank !== bCategoryRank) return aCategoryRank - bCategoryRank;

        const aPriority = PLACE_TYPE_PRIORITY[a.type] ?? 99;
        const bPriority = PLACE_TYPE_PRIORITY[b.type] ?? 99;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.distance - b.distance;
    });

    const selected = [];
    const selectedCategories = new Set();

    IMPORTANT_CATEGORY_ORDER.forEach((category) => {
        const match = rankedPlaces.find((placeItem) => placeItem.category === category && !selectedCategories.has(category));
        if (!match || selected.length >= 5) return;

        selected.push({
            ...match,
            categoryLabel: CATEGORY_LABELS[category] || 'Other',
        });
        selectedCategories.add(category);
    });

    if (selected.length < 5) {
        rankedPlaces.forEach((placeItem) => {
            if (selected.length >= 5) return;
            if (selectedCategories.has(placeItem.category)) return;

            selected.push({
                ...placeItem,
                categoryLabel: CATEGORY_LABELS[placeItem.category] || 'Other',
            });
            selectedCategories.add(placeItem.category);
        });
    }

    return selected;
}

async function fetchDynamicAreaHighlightsByCoordinates(lat, lon) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        throw new Error('Valid coordinates are required');
    }

    const overpassData = await fetchOverpassWithFallback(buildOverpassQuery(lat, lon));
    const rawElements = Array.isArray(overpassData?.elements) ? overpassData.elements : [];
    return buildHighlightsFromOverpassElements(rawElements, lat, lon);
}

async function fetchDynamicAreaHighlightsByLocation(locationText) {
    const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(locationText)}`,
        {
            headers: {
                Accept: 'application/json',
                'Accept-Language': 'en',
                'User-Agent': 'KothaBhada/1.0 (NearbyHighlightsService)',
            },
        }
    );

    if (!geocodeResponse.ok) {
        throw new Error('Geocoding failed');
    }

    const geocodeData = await geocodeResponse.json();
    const place = Array.isArray(geocodeData) ? geocodeData[0] : null;
    const lat = Number(place?.lat);
    const lon = Number(place?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        throw new Error('Coordinates not found for listing location');
    }
    return fetchDynamicAreaHighlightsByCoordinates(lat, lon);
}

function getUploadedModelFile(req) {
    if (req?.file) {
        return req.file;
    }

    if (Array.isArray(req?.files) && req.files.length > 0) {
        return req.files[0];
    }

    const fileBuckets = req?.files && typeof req.files === 'object'
        ? req.files
        : null;

    if (!fileBuckets) {
        return null;
    }

    const preferredFields = ['model', 'file', 'modelFile', 'model3d'];
    for (const field of preferredFields) {
        const fileList = fileBuckets[field];
        if (Array.isArray(fileList) && fileList.length > 0) {
            return fileList[0];
        }
    }

    const firstFieldFiles = Object.values(fileBuckets).find((value) => Array.isArray(value) && value.length > 0);
    return Array.isArray(firstFieldFiles) ? firstFieldFiles[0] : null;
}

export async function uploadRoomModel(req, res) {
    let temporaryFilePath = '';

    try {
        if (req.user?.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can upload 3D models' });
        }

        if (!isCloudinaryConfigured()) {
            return res.status(500).json({
                message: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend environment.',
            });
        }

        const uploadedFile = getUploadedModelFile(req);
        if (!uploadedFile) {
            return res.status(400).json({ message: 'No 3D model file uploaded' });
        }

        temporaryFilePath = String(uploadedFile.path || '').trim();
        if (!temporaryFilePath) {
            return res.status(400).json({ message: 'Uploaded file path is missing' });
        }

        const originalName = String(uploadedFile.originalname || '').trim();
        const extension = extname(originalName).replace('.', '').toLowerCase() || 'glb';
        const baseName = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase() || 'room-model';
        const publicId = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${baseName}.${extension}`;

        const modelUrl = await uploadLargeFileToCloudinary(temporaryFilePath, {
            folder: 'kothabhada/rooms/models',
            resourceType: 'raw',
            publicId,
            chunkSize: 20 * 1024 * 1024,
            timeoutMs: 4 * 60 * 1000,
        });

        if (!modelUrl) {
            return res.status(500).json({ message: 'Cloudinary upload failed for 3D model' });
        }

        return res.status(201).json({
            message: '3D model uploaded successfully',
            modelUrl,
            fileName: originalName,
            size: uploadedFile.size,
        });
    } catch (error) {
        const upstreamStatus = Number(error?.http_code || error?.status || 0);
        const statusCode = upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 500;

        return res.status(statusCode).json({
            message: 'Error uploading 3D model',
            error: error?.message || 'Unknown upload error',
        });
    } finally {
        if (temporaryFilePath) {
            try {
                await unlink(temporaryFilePath);
            } catch {
                // Ignore cleanup errors to avoid masking upload response.
            }
        }
    }
}

function parseKeyFeatures(input) {
    if (Array.isArray(input)) {
        return input
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .slice(0, 20);
    }

    if (typeof input === 'string') {
        return input
            .split(/[,\n]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 20);
    }

    return [];
}

function parseAreaHighlights(input) {
    if (Array.isArray(input)) {
        return input
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .slice(0, 10);
    }

    if (typeof input === 'string') {
        return input
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 10);
    }

    return [];
}

function parseTourPointNumber(value, fallback = null) {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
        return fallback;
    }

    return Number(parsedValue.toFixed(4));
}

function parseTourPoints(input) {
    let rawPoints = input;

    if (typeof input === 'string') {
        const trimmed = String(input || '').trim();
        if (!trimmed) return [];

        try {
            rawPoints = JSON.parse(trimmed);
        } catch {
            return [];
        }
    }

    if (!Array.isArray(rawPoints)) {
        return [];
    }

    return rawPoints
        .map((point, index) => {
            if (!point || typeof point !== 'object') {
                return null;
            }

            const x = parseTourPointNumber(point.x ?? point.positionX ?? point.px);
            const y = parseTourPointNumber(point.y ?? point.positionY ?? point.py);
            const z = parseTourPointNumber(point.z ?? point.positionZ ?? point.pz);

            if (x === null || y === null || z === null) {
                return null;
            }

            const lookAtX = parseTourPointNumber(point.lookAtX ?? point.targetX ?? point.tx, 0);
            const lookAtY = parseTourPointNumber(point.lookAtY ?? point.targetY ?? point.ty, 0.82);
            const lookAtZ = parseTourPointNumber(point.lookAtZ ?? point.targetZ ?? point.tz, 0);

            const label = String(point.label || point.name || `Viewpoint ${index + 1}`).trim();

            return {
                label,
                x,
                y,
                z,
                lookAtX,
                lookAtY,
                lookAtZ,
            };
        })
        .filter(Boolean)
        .slice(0, 12);
}

function parseCoordinate(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseImages(input) {
    if (Array.isArray(input)) {
        return input
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .slice(0, 8);
    }

    if (typeof input === 'string') {
        const cleanedInput = String(input || '').trim();
        return cleanedInput ? [cleanedInput] : [];
    }

    return [];
}

function parseTags(input) {
    if (Array.isArray(input)) {
        return Array.from(new Set(input
            .map((tag) => String(tag || '').trim())
            .filter(Boolean)
            .slice(0, 20)));
    }

    if (typeof input === 'string') {
        return Array.from(new Set(String(input || '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 20)));
    }

    return [];
}

function isDataUri(value) {
    return /^data:[^;]+;base64,/.test(String(value || '').trim());
}

function getApprovedListingFilter() {
    return {
        status: 'active',
        $or: [
            { moderationStatus: 'approved' },
            { moderationStatus: { $exists: false } },
        ],
    };
}

async function resolveImageUrl(value) {
    const trimmedValue = String(value || '').trim();
    if (!trimmedValue) return '';

    if (!isDataUri(trimmedValue)) {
        return trimmedValue;
    }

    return uploadDataUriToCloudinary(trimmedValue, {
        folder: 'kothabhada/rooms/images',
        resourceType: 'image',
    });
}

async function resolveImageList(values) {
    const sanitized = parseImages(values);
    if (!sanitized.length) return [];

    const resolved = await Promise.all(sanitized.map((value) => resolveImageUrl(value)));
    return Array.from(new Set(resolved.filter(Boolean))).slice(0, 8);
}

export async function getAllRooms(req, res) {
    try {
        const rooms = await Room.find(getApprovedListingFilter()).sort({ isFeatured: -1, featuredRank: -1, createdAt: -1 }).lean();
        const confirmedListingIds = await Booking.distinct('listingId', { status: 'confirmed' });
        const confirmedSet = new Set(confirmedListingIds.map((id) => String(id)));
        const ownerIds = Array.from(new Set(rooms.map((room) => String(room.ownerId || '')).filter(Boolean)));

        const ownerRows = ownerIds.length
            ? await User.find({ _id: { $in: ownerIds } }).select('_id isLandlordVerified').lean()
            : [];
        const ownerVerificationMap = new Map(ownerRows.map((owner) => [String(owner._id), Boolean(owner.isLandlordVerified)]));

        const roomsWithAvailability = rooms.map((room) => ({
            ...room,
            isBooked: confirmedSet.has(String(room._id)),
            ownerIsVerified: ownerVerificationMap.get(String(room.ownerId || '')) || false,
        }));

        res.status(200).json(roomsWithAvailability);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
}

export async function getMyRooms(req, res) {
    try {
        if (req.user?.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can access their listings' });
        }

        const rooms = await Room.find({ ownerId: req.user.userId }).sort({ createdAt: -1 });
        return res.status(200).json(rooms);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching landlord rooms', error: error.message });
    }
}

export async function createRooms(req, res) {
    try {
        if (req.user?.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can create listings' });
        }

        const {
            title,
            price,
            description,
            location,
            latitude,
            longitude,
            bedrooms,
            bathrooms,
            areaSqFt,
            keyFeatures,
            areaHighlights,
            image,
            images,
            model3dUrl,
            tourPoints,
            ownerPhone,
            status,
            tags,
        } = req.body;

        if (!title || !String(title).trim()) {
            return res.status(400).json({ message: 'Listing title is required' });
        }

        if (!location || !String(location).trim()) {
            return res.status(400).json({ message: 'Location is required' });
        }

        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({ message: 'Price must be a valid number greater than 0' });
        }

        const parsedLatitude = parseCoordinate(latitude);
        const parsedLongitude = parseCoordinate(longitude);

        if ((parsedLatitude === null) !== (parsedLongitude === null)) {
            return res.status(400).json({ message: 'Both latitude and longitude are required for live location.' });
        }

        if (parsedLatitude !== null && (parsedLatitude < -90 || parsedLatitude > 90)) {
            return res.status(400).json({ message: 'Latitude must be between -90 and 90.' });
        }

        if (parsedLongitude !== null && (parsedLongitude < -180 || parsedLongitude > 180)) {
            return res.status(400).json({ message: 'Longitude must be between -180 and 180.' });
        }

        const parsedKeyFeatures = parseKeyFeatures(keyFeatures);
        if (!parsedKeyFeatures.length) {
            return res.status(400).json({ message: 'At least one key feature is required' });
        }

        const parsedAreaHighlights = parseAreaHighlights(areaHighlights);
        const parsedTourPoints = parseTourPoints(tourPoints);
        const parsedImages = await resolveImageList(images);
        const resolvedCoverImage = await resolveImageUrl(String(image || '').trim());
        const coverImage = resolvedCoverImage || parsedImages[0] || '';

        const owner = await User.findById(req.user.userId).select('name email phone');
        if (!owner) {
            return res.status(404).json({ message: 'Landlord account not found' });
        }

        const newRoom = new Room({
            ownerId: req.user.userId,
            ownerName: owner.name || 'Property Owner',
            ownerEmail: owner.email || '',
            ownerPhone: String(ownerPhone || owner.phone || '').trim(),
            title: String(title).trim(),
            price: numericPrice,
            description: String(description || '').trim(),
            location: String(location).trim(),
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            bedrooms: Number(bedrooms) || 1,
            bathrooms: Number(bathrooms) || 1,
            areaSqFt: Number(areaSqFt) || 0,
            keyFeatures: parsedKeyFeatures,
            areaHighlights: parsedAreaHighlights,
            image: coverImage,
            images: parsedImages.length ? parsedImages : (coverImage ? [coverImage] : []),
            model3dUrl: String(model3dUrl || '').trim(),
            tourPoints: parsedTourPoints,
            status: status === 'inactive' ? 'inactive' : 'active',
            moderationStatus: 'pending',
            moderationNote: '',
            moderationReviewedAt: null,
            moderationReviewedBy: null,
            model3dHealthStatus: model3dUrl ? 'unchecked' : 'unchecked',
            model3dHealthNote: '',
            model3dReviewedAt: null,
            model3dReviewedBy: null,
            tags: parseTags(tags),
        });

        await newRoom.save();
        res.status(201).json({ message: 'Room created successfully', room: newRoom });
    } catch (error) {
        res.status(500).json({ message: 'Error creating room', error: error.message });
    }
}

export async function updateRooms(req, res) {
    try {
        if (req.user?.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can update listings' });
        }

        const { id } = req.params;
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (String(room.ownerId) !== String(req.user.userId)) {
            return res.status(403).json({ message: 'You can update only your own listings' });
        }

        const allowedKeys = ['title', 'price', 'description', 'location', 'latitude', 'longitude', 'bedrooms', 'bathrooms', 'areaSqFt', 'keyFeatures', 'areaHighlights', 'image', 'images', 'model3dUrl', 'tourPoints', 'ownerPhone', 'status', 'tags'];
        const updates = {};
        for (const key of allowedKeys) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        if (updates.title !== undefined) updates.title = String(updates.title).trim();
        if (updates.location !== undefined) updates.location = String(updates.location).trim();
        if (updates.description !== undefined) updates.description = String(updates.description || '').trim();
        if (updates.image !== undefined) updates.image = await resolveImageUrl(String(updates.image || '').trim());
        if (updates.model3dUrl !== undefined) updates.model3dUrl = String(updates.model3dUrl || '').trim();
        if (updates.tourPoints !== undefined) updates.tourPoints = parseTourPoints(updates.tourPoints);
        if (updates.images !== undefined) updates.images = await resolveImageList(updates.images);
        if (updates.ownerPhone !== undefined) updates.ownerPhone = String(updates.ownerPhone || '').trim();
        if (updates.price !== undefined) updates.price = Number(updates.price);
        if (updates.bedrooms !== undefined) updates.bedrooms = Number(updates.bedrooms) || 0;
        if (updates.bathrooms !== undefined) updates.bathrooms = Number(updates.bathrooms) || 0;
        if (updates.areaSqFt !== undefined) updates.areaSqFt = Number(updates.areaSqFt) || 0;
        if (updates.keyFeatures !== undefined) {
            updates.keyFeatures = parseKeyFeatures(updates.keyFeatures);
            if (!updates.keyFeatures.length) {
                return res.status(400).json({ message: 'At least one key feature is required' });
            }
        }
        if (updates.areaHighlights !== undefined) {
            updates.areaHighlights = parseAreaHighlights(updates.areaHighlights);
        }
        if (updates.tags !== undefined) {
            updates.tags = parseTags(updates.tags);
        }

        if (updates.images !== undefined) {
            if (!updates.images.length && updates.image) {
                updates.images = [updates.image];
            }
            if (!updates.image) {
                updates.image = updates.images[0] || '';
            }
        } else if (updates.image !== undefined) {
            updates.images = updates.image ? [updates.image] : [];
        }

        // Any landlord edit requires fresh admin review before listing goes live again.
        updates.moderationStatus = 'pending';
        updates.moderationNote = '';
        updates.moderationReviewedAt = null;
        updates.moderationReviewedBy = null;
        if (updates.model3dUrl !== undefined) {
            updates.model3dHealthStatus = 'unchecked';
            updates.model3dHealthNote = '';
            updates.model3dReviewedAt = null;
            updates.model3dReviewedBy = null;
        }

        const latitudeProvided = req.body.latitude !== undefined;
        const longitudeProvided = req.body.longitude !== undefined;

        if (latitudeProvided || longitudeProvided) {
            const nextLatitude = latitudeProvided ? parseCoordinate(req.body.latitude) : (room.latitude ?? null);
            const nextLongitude = longitudeProvided ? parseCoordinate(req.body.longitude) : (room.longitude ?? null);

            if ((nextLatitude === null) !== (nextLongitude === null)) {
                return res.status(400).json({ message: 'Both latitude and longitude are required for live location.' });
            }

            if (nextLatitude !== null && (nextLatitude < -90 || nextLatitude > 90)) {
                return res.status(400).json({ message: 'Latitude must be between -90 and 90.' });
            }

            if (nextLongitude !== null && (nextLongitude < -180 || nextLongitude > 180)) {
                return res.status(400).json({ message: 'Longitude must be between -180 and 180.' });
            }

            updates.latitude = nextLatitude;
            updates.longitude = nextLongitude;
        }

        const updatedRoom = await Room.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        res.status(200).json({ message: 'Room updated successfully', room: updatedRoom });
    } catch (error) {
        res.status(500).json({ message: 'Error updating room', error: error.message });
    }
}

export async function deleteRooms(req, res) {
    try {
        if (req.user?.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can delete listings' });
        }

        const { id } = req.params;
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (String(room.ownerId) !== String(req.user.userId)) {
            return res.status(403).json({ message: 'You can delete only your own listings' });
        }

        await Room.findByIdAndDelete(id);
        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting room', error: error.message });
    }
}

export async function getRoomById(req, res) {
    try {
        const { id } = req.params;
        const room = await Room.findById(id).lean();

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const moderationStatus = String(room?.moderationStatus || '').toLowerCase();
        const isApprovedOrLegacy = moderationStatus === 'approved' || !moderationStatus;

        if (!isApprovedOrLegacy) {
            const requesterRole = String(req.user?.role || '').toLowerCase();
            const requesterId = String(req.user?.userId || '');
            const isOwner = requesterId && requesterId === String(room.ownerId || '');
            const isAdmin = requesterRole === 'admin' || requesterRole === 'moderator';

            if (!isOwner && !isAdmin) {
                return res.status(404).json({ message: 'Room not found' });
            }
        }

        const [hasConfirmedBooking, owner] = await Promise.all([
            Booking.exists({ listingId: String(room._id), status: 'confirmed' }),
            room.ownerId ? User.findById(room.ownerId).select('isLandlordVerified').lean() : null,
        ]);

        res.status(200).json({
            ...room,
            isBooked: Boolean(hasConfirmedBooking),
            ownerIsVerified: Boolean(owner?.isLandlordVerified),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room', error: error.message });
    }
}

export async function getNearbyAreaHighlights(req, res) {
    try {
        const locationText = String(req.query?.location || '').trim();
        const parsedLatitude = parseCoordinate(req.query?.latitude);
        const parsedLongitude = parseCoordinate(req.query?.longitude);
        const hasCoordinates = Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude);

        if (!hasCoordinates && !locationText) {
            return res.status(400).json({ message: 'location query is required', highlights: [] });
        }

        const highlights = hasCoordinates
            ? await fetchDynamicAreaHighlightsByCoordinates(parsedLatitude, parsedLongitude)
            : await fetchDynamicAreaHighlightsByLocation(locationText);

        return res.status(200).json({
            highlights,
            source: hasCoordinates ? 'live-coordinates' : 'live-location-geocode',
        });
    } catch (error) {
        return res.status(200).json({
            highlights: [],
            source: 'fallback',
            unavailable: true,
            message: 'Live nearby highlights are temporarily unavailable',
            error: error?.message || 'Unknown lookup error',
        });
    }
}
