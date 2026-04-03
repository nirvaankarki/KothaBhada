import { Favorite } from '../models/favoriteModel.js';
import { ViewHistory } from '../models/viewHistoryModel.js';
import { Inquiry } from '../models/inquiryModel.js';
import { Booking } from '../models/bookingModel.js';
import { Chat } from '../models/chatModel.js';
import { AiChatHistory } from '../models/aiChatHistoryModel.js';
import { Room } from '../models/roomModel.js';
import { Notification } from '../models/notificationModel.js';

async function resolveRoomOwner(listingId) {
    if (!listingId) {
        return null;
    }

    const room = await Room.findById(listingId).select('ownerId ownerName ownerPhone ownerEmail title location price image');
    if (!room) {
        return null;
    }

    return room;
}

async function createNotification({ userId, role, type, title, message, metadata = {} }) {
    if (!userId || !role || !type || !title || !message) return;

    await Notification.create({
        userId,
        role,
        type,
        title,
        message,
        metadata
    });
}

const RECOMMENDER_STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'between', 'by', 'for', 'from', 'give', 'home', 'house', 'i', 'in',
    'is', 'it', 'like', 'listing', 'me', 'my', 'near', 'need', 'of', 'on', 'or', 'place', 'please', 'property',
    'recommend', 'recommendation', 'room', 'show', 'that', 'the', 'to', 'tour', 'want', 'with'
]);

function extractNumericValues(text) {
    const matches = String(text || '').match(/\d[\d,]*/g) || [];
    return matches
        .map((rawValue) => Number(rawValue.replaceAll(',', '')))
        .filter((value) => Number.isFinite(value) && value > 0);
}

function parseBudgetPreferences(messageText, fallbackPrice = 0) {
    const normalizedText = String(messageText || '').toLowerCase();
    const values = extractNumericValues(normalizedText);
    const preferences = {
        minPrice: null,
        maxPrice: null,
        targetPrice: Number.isFinite(Number(fallbackPrice)) && Number(fallbackPrice) > 0
            ? Number(fallbackPrice)
            : null,
    };

    if (!values.length) {
        return preferences;
    }

    const first = values[0];
    const second = values[1];

    if (/between|range|from/.test(normalizedText) && /to|and|-/.test(normalizedText) && Number.isFinite(second)) {
        preferences.minPrice = Math.min(first, second);
        preferences.maxPrice = Math.max(first, second);
        preferences.targetPrice = Math.round((preferences.minPrice + preferences.maxPrice) / 2);
        return preferences;
    }

    if (/under|below|less than|max|maximum|upto|up to/.test(normalizedText)) {
        preferences.maxPrice = first;
        preferences.targetPrice = first;
        return preferences;
    }

    if (/above|over|more than|min|minimum|at least/.test(normalizedText)) {
        preferences.minPrice = first;
        preferences.targetPrice = first;
        return preferences;
    }

    preferences.targetPrice = first;
    return preferences;
}

function parseCountPreference(messageText, patterns) {
    const normalizedText = String(messageText || '').toLowerCase();
    for (const pattern of patterns) {
        const match = normalizedText.match(pattern);
        if (match?.[1]) {
            const parsedValue = Number(match[1]);
            if (Number.isFinite(parsedValue) && parsedValue >= 0) {
                return parsedValue;
            }
        }
    }
    return null;
}

function normalizeSearchText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s,.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractLocationPhrase(messageText) {
    const normalized = normalizeSearchText(messageText);
    const locationMatch = normalized.match(/(?:in|at|near|around)\s+([a-z][a-z\s,-]{1,80})/i);
    if (!locationMatch?.[1]) {
        return '';
    }

    const candidate = String(locationMatch[1])
        .split(/\b(under|below|less than|above|over|between|with|for|price|budget|rent|available|is|are|any|looking|need|want|bed|bath)\b/i)[0]
        .replace(/[,.-]+$/g, '')
        .trim();

    return candidate;
}

function extractPlainLocationCandidate(messageText) {
    const normalized = normalizeSearchText(messageText);
    if (!normalized) return '';

    const parts = normalized.split(/\b(under|below|less than|above|over|between|with|for|budget|price|rent|available|availability)\b/i);
    const candidate = String(parts?.[0] || '').trim();

    if (!candidate || candidate.length < 2) {
        return '';
    }

    const blockedTokens = new Set([
        'i', 'need', 'want', 'looking', 'searching', 'find', 'show', 'recommend',
        'room', 'rooms', 'flat', 'apartment', 'house', 'property', 'listing', 'listings',
    ]);

    const tokens = candidate
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .filter((token) => !blockedTokens.has(token));

    if (!tokens.length || tokens.length > 4) {
        return '';
    }

    // Avoid treating generic requests as location-only inputs.
    if (tokens.every((token) => RECOMMENDER_STOP_WORDS.has(token))) {
        return '';
    }

    return tokens.join(' ');
}

function findMentionedKnownLocation(messageText, knownLocations) {
    const normalizedMessage = normalizeSearchText(messageText);

    let matchedLocation = '';
    for (const locationItem of knownLocations) {
        const normalizedLocation = normalizeSearchText(locationItem);
        if (!normalizedLocation) continue;
        if (!normalizedMessage.includes(normalizedLocation)) continue;

        if (normalizedLocation.length > normalizeSearchText(matchedLocation).length) {
            matchedLocation = locationItem;
        }
    }

    return matchedLocation;
}

function countTokenHits(searchText, tokens) {
    if (!tokens.length) return 0;
    const normalized = normalizeSearchText(searchText);
    return tokens.filter((token) => normalized.includes(token)).length;
}

function isLocationMatch(searchText, tokens) {
    if (!tokens.length) return true;
    const hitCount = countTokenHits(searchText, tokens);
    if (tokens.length === 1) {
        return hitCount >= 1;
    }

    return hitCount >= Math.min(2, tokens.length);
}

function isGreetingOnlyMessage(messageText) {
    const normalizedMessage = normalizeSearchText(messageText);
    if (!normalizedMessage) return false;

    const greetingPattern = /^(hi|hello|hey|namaste|good\s+morning|good\s+afternoon|good\s+evening|yo|hola)\b/i;
    if (!greetingPattern.test(normalizedMessage)) {
        return false;
    }

    // Treat short greeting messages as small-talk, not listing search intent.
    return normalizedMessage.split(' ').length <= 8;
}

function hasRentalSearchIntent({
    messageText,
    extractedLocation,
    matchedKnownLocation,
    budget,
    bedrooms,
    bathrooms,
    require3DModel,
}) {
    const normalizedMessage = normalizeSearchText(messageText);
    const rentalKeywordPattern = /(rent|rental|room|flat|apartment|house|property|listing|available|availability|budget|price|cost|monthly|per\s+month|bed|bedroom|bath|bathroom|sq\s*ft|area|furnished|parking|3d|tour|lease|visit)/i;

    if (rentalKeywordPattern.test(normalizedMessage)) {
        return true;
    }

    if (budget.maxPrice !== null || budget.minPrice !== null) {
        return true;
    }

    if (Number.isFinite(bedrooms) && bedrooms !== null) {
        return true;
    }

    if (Number.isFinite(bathrooms) && bathrooms !== null) {
        return true;
    }

    if (require3DModel) {
        return true;
    }

    if (String(extractedLocation || '').trim() || String(matchedKnownLocation || '').trim()) {
        return true;
    }

    return false;
}

function hasStrongRentalSignal({ messageText, budget, bedrooms, bathrooms, require3DModel, availabilityIntent }) {
    const normalizedMessage = normalizeSearchText(messageText);
    const rentalKeywordPattern = /(rent|rental|room|flat|apartment|house|property|listing|available|availability|budget|price|cost|monthly|per\s+month|bed|bedroom|bath|bathroom|sq\s*ft|furnished|parking|3d|tour|lease|visit|owner|landlord)/i;

    if (rentalKeywordPattern.test(normalizedMessage)) return true;
    if (availabilityIntent) return true;
    if (budget.maxPrice !== null || budget.minPrice !== null) return true;
    if (Number.isFinite(bedrooms) && bedrooms !== null) return true;
    if (Number.isFinite(bathrooms) && bathrooms !== null) return true;
    if (require3DModel) return true;

    return false;
}

function isOutOfDomainMessage({ messageText, greetingIntent, strongRentalSignal }) {
    const normalizedMessage = normalizeSearchText(messageText);
    if (!normalizedMessage || greetingIntent || strongRentalSignal) {
        return false;
    }

    const outOfDomainPattern = /(weather|temperature|forecast|news|politics|election|cricket|football|sports?|movie|song|music|joke|poem|story|recipe|cook|translate|translation|code|coding|program|javascript|python|java|c\+\+|math|equation|solve|history|science|medical|doctor|disease|stock|bitcoin|crypto|flight|hotel|restaurant|school|college|exam)/i;
    if (outOfDomainPattern.test(normalizedMessage)) {
        return true;
    }

    const tokenCount = normalizedMessage.split(/\s+/).filter(Boolean).length;
    return tokenCount >= 7;
}

function buildClarificationReply({ hasLocationPreference, hasBudgetPreference, hasRoomPreference }) {
    const missing = [];
    if (!hasLocationPreference) {
        missing.push('preferred location');
    }
    if (!hasBudgetPreference) {
        missing.push('monthly budget');
    }
    if (!hasRoomPreference) {
        missing.push('room details (bedrooms/bathrooms)');
    }

    const missingText = missing.length
        ? `Please share your ${missing.join(', ')} first.`
        : 'Please share a bit more detail first.';

    return `Sure, I can help you find a room. ${missingText} Example: Room in Baneshwor under Rs 25,000 with 2 bedrooms.`;
}

function tokenizeQueryText(messageText) {
    return String(messageText || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !RECOMMENDER_STOP_WORDS.has(token))
        .slice(0, 14);
}

function buildRoomSearchText(room) {
    const fields = [
        room?.title,
        room?.location,
        room?.description,
        ...(Array.isArray(room?.keyFeatures) ? room.keyFeatures : []),
        ...(Array.isArray(room?.areaHighlights) ? room.areaHighlights : []),
    ];

    return fields
        .map((field) => String(field || '').toLowerCase())
        .join(' ');
}

function scoreRoomMatch(room, preferences) {
    const roomPrice = Number(room?.price || 0);
    const roomBedrooms = Number(room?.bedrooms || 0);
    const roomBathrooms = Number(room?.bathrooms || 0);
    const has3DModel = Boolean(String(room?.model3dUrl || '').trim());
    const roomLocation = String(room?.location || '').toLowerCase();
    const roomSearchText = buildRoomSearchText(room);

    let score = 0;
    const reasons = [];

    if (Number.isFinite(preferences.maxPrice) && preferences.maxPrice !== null) {
        if (roomPrice <= preferences.maxPrice) {
            score += 24;
            reasons.push(`fits your budget (Rs ${roomPrice.toLocaleString()})`);
        } else {
            score -= 8;
        }
    }

    if (Number.isFinite(preferences.minPrice) && preferences.minPrice !== null) {
        if (roomPrice >= preferences.minPrice) {
            score += 16;
            if (!reasons.length) {
                reasons.push(`matches your expected budget range (Rs ${roomPrice.toLocaleString()})`);
            }
        } else {
            score -= 8;
        }
    }

    if (Number.isFinite(preferences.targetPrice) && preferences.targetPrice !== null && preferences.targetPrice > 0) {
        const targetGap = Math.abs(roomPrice - preferences.targetPrice) / Math.max(preferences.targetPrice, 1);
        if (targetGap <= 0.12) {
            score += 12;
        } else if (targetGap <= 0.25) {
            score += 6;
        }
    }

    if (Number.isFinite(preferences.bedrooms) && preferences.bedrooms !== null) {
        if (roomBedrooms === preferences.bedrooms) {
            score += 20;
            reasons.push(`${roomBedrooms} bedroom match`);
        } else if (Math.abs(roomBedrooms - preferences.bedrooms) === 1) {
            score += 8;
        } else {
            score -= 4;
        }
    }

    if (Number.isFinite(preferences.bathrooms) && preferences.bathrooms !== null) {
        if (roomBathrooms === preferences.bathrooms) {
            score += 10;
        } else if (Math.abs(roomBathrooms - preferences.bathrooms) === 1) {
            score += 4;
        }
    }

    if (preferences.require3DModel) {
        if (has3DModel) {
            score += 12;
            reasons.push('includes 3D tour support');
        } else {
            score -= 10;
        }
    }

    if (preferences.locationTokens.length) {
        const locationHits = preferences.locationTokens.filter((token) => roomLocation.includes(token)).length;
        if (locationHits > 0) {
            score += 10 + (locationHits * 4);
            reasons.push('close to your preferred location');
        }
    }

    if (preferences.keywordTokens.length) {
        const keywordHits = preferences.keywordTokens.filter((token) => roomSearchText.includes(token)).length;
        if (keywordHits > 0) {
            score += Math.min(24, keywordHits * 6);
            reasons.push('contains requested features');
        }
    }

    const createdAt = new Date(room?.createdAt || 0).getTime();
    if (Number.isFinite(createdAt) && createdAt > 0) {
        score += 2;
    }

    return {
        score,
        reasons,
    };
}

function toSafeAiRecommendations(items) {
    if (!Array.isArray(items)) return [];

    return items.slice(0, 5).map((item, index) => ({
        rank: Number(item?.rank || index + 1),
        listingId: String(item?.listingId || '').trim(),
        title: String(item?.title || '').trim(),
        location: String(item?.location || '').trim(),
        price: Number(item?.price || 0),
        reason: String(item?.reason || '').trim(),
        model3dUrl: String(item?.model3dUrl || '').trim(),
    }));
}

async function persistAiTurn({ userId, userText, assistantText, recommendations }) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return;

    const normalizedUserText = String(userText || '').trim();
    const normalizedAssistantText = String(assistantText || '').trim();
    if (!normalizedUserText || !normalizedAssistantText) return;

    const safeRecommendations = toSafeAiRecommendations(recommendations);
    const now = new Date();

    const turnMessages = [
        {
            senderType: 'user',
            text: normalizedUserText,
            recommendations: [],
            sentAt: now,
        },
        {
            senderType: 'assistant',
            text: normalizedAssistantText,
            recommendations: safeRecommendations,
            sentAt: now,
        },
    ];

    try {
        await AiChatHistory.findOneAndUpdate(
            { userId: normalizedUserId },
            {
                $set: { lastMessageAt: now },
                $push: {
                    messages: {
                        $each: turnMessages,
                        $slice: -120,
                    },
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (error) {
        // Do not fail recommendation response when chat history persistence fails.
        console.error('Failed to persist AI chat history:', error.message);
    }
}

function formatAiHistoryMessage(messageItem) {
    const sentAt = messageItem?.sentAt ? new Date(messageItem.sentAt) : null;
    return {
        id: String(messageItem?._id || ''),
        sender: messageItem?.senderType === 'user' ? 'user' : 'assistant',
        text: String(messageItem?.text || '').trim(),
        sentAt: sentAt && !Number.isNaN(sentAt.getTime()) ? sentAt.toISOString() : '',
        recommendations: toSafeAiRecommendations(messageItem?.recommendations),
    };
}

export async function getAiChatHistory(req, res) {
    try {
        const history = await AiChatHistory.findOne({ userId: req.user.userId })
            .select('messages lastMessageAt')
            .lean();

        const messages = Array.isArray(history?.messages)
            ? history.messages.map(formatAiHistoryMessage).filter((item) => item.text)
            : [];

        return res.status(200).json({ messages });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load AI chat history', error: error.message });
    }
}

export async function getAiRecommendations(req, res) {
    try {
        const message = String(req.body?.message || '').trim();
        const listingId = String(req.body?.listingId || '').trim();
        const requestedLimit = Number(req.body?.limit || 3);
        const recommendationLimit = Math.min(Math.max(requestedLimit, 1), 5);
        const authenticatedUserId = String(req.user?.userId || '').trim();

        const respondWithAiReply = async ({ reply, recommendations = [] }) => {
            if (authenticatedUserId) {
                await persistAiTurn({
                    userId: authenticatedUserId,
                    userText: message,
                    assistantText: reply,
                    recommendations,
                });
            }

            return res.status(200).json({ reply, recommendations });
        };

        if (!message) {
            return res.status(400).json({ message: 'message is required' });
        }

        let referenceListing = null;
        if (listingId) {
            referenceListing = await Room.findById(listingId)
                .select('title location price bedrooms bathrooms keyFeatures areaHighlights')
                .lean();
        }

        const activeRooms = await Room.find({ status: 'active' })
            .select('title location price bedrooms bathrooms areaSqFt image images model3dUrl keyFeatures areaHighlights createdAt')
            .sort({ createdAt: -1 })
            .limit(150)
            .lean();

        if (!activeRooms.length) {
            return respondWithAiReply({
                reply: 'No active listings are available right now. Please try again later.',
                recommendations: [],
            });
        }

        const messageLower = message.toLowerCase();
        const knownLocations = Array.from(new Set(
            activeRooms
                .map((room) => String(room?.location || '').trim())
                .filter(Boolean)
        ));

        const extractedLocation = extractLocationPhrase(message);
        const matchedKnownLocation = findMentionedKnownLocation(message, knownLocations);
        const plainLocationCandidate = extractPlainLocationCandidate(message);
        const preferredLocation = extractedLocation
            || matchedKnownLocation
            || plainLocationCandidate
            || String(referenceListing?.location || '').trim();

        const budget = parseBudgetPreferences(message, referenceListing?.price || 0);
        const bedrooms = parseCountPreference(message, [/(\d+)\s*(?:bed|bedroom|bhk|rk)/i]);
        const bathrooms = parseCountPreference(message, [/(\d+)\s*(?:bath|bathroom)/i]);
        const locationTokens = tokenizeQueryText(preferredLocation).slice(0, 8);
        const keywordTokens = tokenizeQueryText(message).filter((token) => !locationTokens.includes(token));
        const availabilityIntent = /(available|availability|is there|any\s+(room|flat|house|listing)|rent.*available|have.*(room|flat|listing))/i.test(messageLower);
        const require3DModel = /3d|virtual|tour|model/.test(messageLower);
        const hasLocationPreference = Boolean(String(extractedLocation || matchedKnownLocation || plainLocationCandidate || '').trim());
        const hasBudgetPreference = budget.maxPrice !== null || budget.minPrice !== null;
        const hasRoomPreference = (Number.isFinite(bedrooms) && bedrooms !== null) || (Number.isFinite(bathrooms) && bathrooms !== null);
        const hasFeaturePreference = require3DModel || keywordTokens.length > 0;
        const preferenceSignalCount = [hasLocationPreference, hasBudgetPreference, hasRoomPreference, hasFeaturePreference]
            .filter(Boolean)
            .length;

        const greetingIntent = isGreetingOnlyMessage(message);
        const strongRentalSignal = hasStrongRentalSignal({
            messageText: message,
            budget,
            bedrooms,
            bathrooms,
            require3DModel,
            availabilityIntent,
        });
        const outOfDomainIntent = isOutOfDomainMessage({
            messageText: message,
            greetingIntent,
            strongRentalSignal,
        });
        const rentalIntent = hasRentalSearchIntent({
            messageText: message,
            extractedLocation,
            matchedKnownLocation,
            budget,
            bedrooms,
            bathrooms,
            require3DModel,
        });

        if (outOfDomainIntent) {
            return respondWithAiReply({
                reply: 'I can only help with rental services in KothaBhada, such as room availability, location, budget, bedrooms, bathrooms, and 3D tours. Please ask a rental-related question.',
                recommendations: [],
            });
        }

        if (!rentalIntent) {
            const reply = greetingIntent
                ? "Namaste! I'm KothaBhada Chatbot. Ask me about room rent availability by location, budget, bedrooms, bathrooms, or 3D tour support."
                : 'I can help with rental availability and recommendations. Please share your preferred location, budget, or room type.';

            return respondWithAiReply({
                reply,
                recommendations: [],
            });
        }

        const broadRentalRequest = preferenceSignalCount === 0
            || (preferenceSignalCount === 1 && !hasLocationPreference && !hasBudgetPreference && !availabilityIntent);

        if (broadRentalRequest) {
            return respondWithAiReply({
                reply: buildClarificationReply({
                    hasLocationPreference,
                    hasBudgetPreference,
                    hasRoomPreference,
                }),
                recommendations: [],
            });
        }

        const preferences = {
            minPrice: budget.minPrice,
            maxPrice: budget.maxPrice,
            targetPrice: budget.targetPrice,
            bedrooms,
            bathrooms,
            keywordTokens,
            locationTokens,
            require3DModel,
        };

        const strictMatches = activeRooms.filter((room) => {
            if (String(room?._id || '') === listingId) return false;

            const roomPrice = Number(room?.price || 0);
            if (budget.maxPrice !== null && roomPrice > budget.maxPrice) return false;
            if (budget.minPrice !== null && roomPrice < budget.minPrice) return false;

            if (Number.isFinite(bedrooms) && bedrooms !== null) {
                if (Number(room?.bedrooms || 0) !== bedrooms) return false;
            }

            if (Number.isFinite(bathrooms) && bathrooms !== null) {
                if (Number(room?.bathrooms || 0) !== bathrooms) return false;
            }

            if (preferences.require3DModel && !String(room?.model3dUrl || '').trim()) return false;
            if (!isLocationMatch(room?.location, locationTokens)) return false;

            return true;
        });

        const locationSuffix = preferredLocation ? ` in ${preferredLocation}` : '';
        let budgetSuffix = '';
        if (budget.maxPrice !== null) {
            budgetSuffix = ` within Rs ${Number(budget.maxPrice).toLocaleString()}`;
        } else if (budget.minPrice !== null) {
            budgetSuffix = ` above Rs ${Number(budget.minPrice).toLocaleString()}`;
        }

        if (!strictMatches.length) {
            const bedroomSuffix = Number.isFinite(bedrooms) && bedrooms !== null
                ? ` with ${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}`
                : '';
            const bathroomSuffix = Number.isFinite(bathrooms) && bathrooms !== null
                ? ` and ${bathrooms} bathroom${bathrooms === 1 ? '' : 's'}`
                : '';
            const threeDSuffix = require3DModel ? ' with 3D tour support' : '';

            return respondWithAiReply({
                reply: `I could not find an active listing${locationSuffix}${budgetSuffix}${bedroomSuffix}${bathroomSuffix}${threeDSuffix} in our database right now. Please try another location or adjust your filters.`,
                recommendations: [],
            });
        }

        const rankingPool = strictMatches;

        const ranked = rankingPool
            .map((room) => {
                const scoring = scoreRoomMatch(room, preferences);
                return {
                    room,
                    score: scoring.score,
                    reasonText: scoring.reasons.slice(0, 2).join(', ') || 'Good overall match for your request.',
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, recommendationLimit);

        const recommendations = ranked.map((entry, index) => {
            const room = entry.room;
            const primaryImage = String(room?.image || room?.images?.[0] || '').trim();
            return {
                rank: index + 1,
                listingId: String(room?._id || ''),
                title: String(room?.title || 'Untitled Listing').trim(),
                location: String(room?.location || 'Location not specified').trim(),
                price: Number(room?.price || 0),
                bedrooms: Number(room?.bedrooms || 0),
                bathrooms: Number(room?.bathrooms || 0),
                areaSqFt: Number(room?.areaSqFt || 0),
                image: primaryImage,
                model3dUrl: String(room?.model3dUrl || '').trim(),
                reason: entry.reasonText,
                score: entry.score,
            };
        });

        const summaryParts = [];
        if (availabilityIntent) {
            if (strictMatches.length > 0) {
                summaryParts.push(`Yes, ${strictMatches.length} listing${strictMatches.length === 1 ? '' : 's'} ${strictMatches.length === 1 ? 'is' : 'are'} currently available${locationSuffix}${budgetSuffix}.`);
            }
        } else {
            summaryParts.push(`I found ${recommendations.length} recommendation${recommendations.length === 1 ? '' : 's'} for you${locationSuffix}.`);
            if (budget.maxPrice !== null) {
                summaryParts.push(`Budget focus: up to Rs ${Number(budget.maxPrice).toLocaleString()}.`);
            } else if (budget.minPrice !== null) {
                summaryParts.push(`Budget focus: above Rs ${Number(budget.minPrice).toLocaleString()}.`);
            }
        }

        if (Number.isFinite(bedrooms) && bedrooms !== null) {
            summaryParts.push(`Bedroom preference: ${bedrooms}.`);
        }

        if (preferences.require3DModel) {
            summaryParts.push('Prioritizing listings with 3D tour support.');
        }

        return respondWithAiReply({
            reply: summaryParts.join(' '),
            recommendations,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to generate AI recommendations', error: error.message });
    }
}

export async function getFavorites(req, res) {
    try {
        const favorites = await Favorite.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ favorites });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch favorites', error: error.message });
    }
}

export async function toggleFavorite(req, res) {
    try {
        const { listingId, title, location, price, image, model3dUrl, source } = req.body;

        if (!listingId || !title) {
            return res.status(400).json({ message: 'listingId and title are required' });
        }

        const existing = await Favorite.findOne({ userId: req.user.userId, listingId });
        if (existing) {
            await Favorite.findByIdAndDelete(existing._id);
            return res.status(200).json({ message: 'Removed from favorites', isFavorite: false });
        }

        await Favorite.create({
            userId: req.user.userId,
            listingId,
            title,
            location: location || '',
            price: Number(price) || 0,
            image: image || '',
            model3dUrl: String(model3dUrl || '').trim(),
            source: source || 'web'
        });

        return res.status(201).json({ message: 'Added to favorites', isFavorite: true });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update favorite', error: error.message });
    }
}

export async function addViewHistory(req, res) {
    try {
        const { listingId, title, location, price, image, model3dUrl, source } = req.body;

        if (!listingId || !title) {
            return res.status(400).json({ message: 'listingId and title are required' });
        }

        await ViewHistory.create({
            userId: req.user.userId,
            listingId,
            title,
            location: location || '',
            price: Number(price) || 0,
            image: image || '',
            model3dUrl: String(model3dUrl || '').trim(),
            source: source || 'web',
            viewedAt: new Date()
        });

        return res.status(201).json({ message: 'View history tracked' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to track view history', error: error.message });
    }
}

export async function getViewHistory(req, res) {
    try {
        const history = await ViewHistory.find({ userId: req.user.userId })
            .sort({ viewedAt: -1 })
            .limit(100);

        return res.status(200).json({ history });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch view history', error: error.message });
    }
}

export async function clearViewHistory(req, res) {
    try {
        const result = await ViewHistory.deleteMany({ userId: req.user.userId });
        return res.status(200).json({
            message: 'Viewing history cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to clear view history', error: error.message });
    }
}

export async function createInquiry(req, res) {
    try {
        const {
            listingId,
            title,
            location,
            price,
            image,
            ownerName,
            ownerContact,
            message
        } = req.body;

        if (!listingId || !title || !message || !message.trim()) {
            return res.status(400).json({ message: 'listingId, title and message are required' });
        }

        const room = await resolveRoomOwner(listingId);

        const inquiry = await Inquiry.create({
            userId: req.user.userId,
            ownerId: room?.ownerId || null,
            listingId,
            title: room?.title || title,
            location: room?.location || location || '',
            price: room?.price || Number(price) || 0,
            image: room?.image || image || '',
            ownerName: room?.ownerName || ownerName || 'Property Owner',
            ownerContact: room?.ownerPhone || ownerContact || '',
            status: 'open',
            messages: [
                {
                    senderType: 'user',
                    text: message.trim(),
                    sentAt: new Date()
                }
            ],
            lastMessageAt: new Date()
        });

        await createNotification({
            userId: inquiry.ownerId,
            role: 'landlord',
            type: 'inquiry_created',
            title: 'New inquiry received',
            message: `${req.user.name || 'A renter'} sent an inquiry for ${inquiry.title || 'your property'}.`,
            metadata: {
                inquiryId: inquiry._id,
                listingId: inquiry.listingId
            }
        });

        return res.status(201).json({ message: 'Inquiry sent successfully', inquiry });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create inquiry', error: error.message });
    }
}

export async function getInquiries(req, res) {
    try {
        const inquiries = await Inquiry.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
        return res.status(200).json({ inquiries });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch inquiries', error: error.message });
    }
}

export async function addInquiryMessage(req, res) {
    try {
        const { inquiryId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const inquiry = await Inquiry.findOne({ _id: inquiryId, userId: req.user.userId });
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        inquiry.messages.push({
            senderType: 'user',
            text: message.trim(),
            sentAt: new Date()
        });
        inquiry.lastMessageAt = new Date();
        await inquiry.save();

        await createNotification({
            userId: inquiry.ownerId,
            role: 'landlord',
            type: 'inquiry_message',
            title: 'New inquiry message',
            message: `${req.user.name || 'A renter'} sent a follow-up message on ${inquiry.title || 'a property inquiry'}.`,
            metadata: {
                inquiryId: inquiry._id,
                listingId: inquiry.listingId
            }
        });

        return res.status(200).json({ message: 'Message sent', inquiry });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
}

export async function createBooking(req, res) {
    try {
        const {
            listingId,
            title,
            location,
            price,
            image,
            ownerName,
            ownerContact,
            preferredVisitDate,
            preferredTime,
            fullName,
            email,
            phone,
            occupation,
            monthlyIncome,
            moveInDate,
            stayDurationMonths,
            occupants,
            hasPets,
            reasonForMoving,
            note
        } = req.body;

        if (
            !listingId ||
            !preferredVisitDate ||
            !preferredTime ||
            !fullName ||
            !email ||
            !phone ||
            !occupation ||
            !monthlyIncome ||
            !moveInDate ||
            !stayDurationMonths ||
            !occupants ||
            !hasPets ||
            !reasonForMoving
        ) {
            return res.status(400).json({
                message: 'All booking fields are required except additional notes'
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        const normalizedPhone = String(phone).trim();
        if (normalizedPhone.length < 7) {
            return res.status(400).json({ message: 'Please enter a valid phone number' });
        }

        const normalizedStayDuration = Number(stayDurationMonths);
        const normalizedOccupants = Number(occupants);
        if (!Number.isFinite(normalizedStayDuration) || normalizedStayDuration < 1) {
            return res.status(400).json({ message: 'Stay duration must be at least 1 month' });
        }

        if (!Number.isFinite(normalizedOccupants) || normalizedOccupants < 1) {
            return res.status(400).json({ message: 'Occupants must be at least 1' });
        }

        const normalizedHasPets = String(hasPets).toLowerCase();
        if (!['yes', 'no'].includes(normalizedHasPets)) {
            return res.status(400).json({ message: 'hasPets must be either yes or no' });
        }

        const room = await resolveRoomOwner(listingId);
        if (!room) {
            return res.status(404).json({ message: 'Property not found' });
        }

        const booking = await Booking.create({
            userId: req.user.userId,
            ownerId: room?.ownerId || null,
            listingId,
            title: room?.title || title,
            location: room?.location || location || '',
            price: room?.price || Number(price) || 0,
            image: room?.image || image || '',
            ownerName: room?.ownerName || ownerName || 'Property Owner',
            ownerContact: room?.ownerPhone || ownerContact || '',
            preferredVisitDate,
            preferredTime: String(preferredTime).trim(),
            fullName: String(fullName).trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            occupation: String(occupation).trim(),
            monthlyIncome: String(monthlyIncome).trim(),
            moveInDate,
            stayDurationMonths: normalizedStayDuration,
            occupants: normalizedOccupants,
            hasPets: normalizedHasPets,
            reasonForMoving: String(reasonForMoving).trim(),
            note: note || '',
            status: 'pending'
        });

        await createNotification({
            userId: booking.ownerId,
            role: 'landlord',
            type: 'booking_created',
            title: 'New booking request',
            message: `${booking.fullName || req.user.name || 'A renter'} requested a visit for ${booking.title || 'your property'}.`,
            metadata: {
                bookingId: booking._id,
                listingId: booking.listingId
            }
        });

        return res.status(201).json({ message: 'Booking request sent', booking });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create booking request', error: error.message });
    }
}

export async function getBookings(req, res) {
    try {
        const bookings = await Booking.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ bookings });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
    }
}

export async function updateBookingRequest(req, res) {
    try {
        const { bookingId } = req.params;
        const payload = req.body || {};

        const booking = await Booking.findOne({ _id: bookingId, userId: req.user.userId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking request not found' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending booking requests can be edited' });
        }

        const updates = {};

        if (Object.prototype.hasOwnProperty.call(payload, 'preferredVisitDate')) {
            const preferredVisitDate = new Date(payload.preferredVisitDate);
            if (Number.isNaN(preferredVisitDate.getTime())) {
                return res.status(400).json({ message: 'Please provide a valid preferred visit date' });
            }
            updates.preferredVisitDate = preferredVisitDate;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'preferredTime')) {
            const preferredTime = String(payload.preferredTime || '').trim();
            if (!preferredTime) {
                return res.status(400).json({ message: 'Preferred time is required' });
            }
            updates.preferredTime = preferredTime;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'fullName')) {
            const fullName = String(payload.fullName || '').trim();
            if (!fullName) {
                return res.status(400).json({ message: 'Full name is required' });
            }
            updates.fullName = fullName;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
            const normalizedEmail = String(payload.email || '').trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                return res.status(400).json({ message: 'Please provide a valid email address' });
            }
            updates.email = normalizedEmail;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'phone')) {
            const phone = String(payload.phone || '').trim();
            if (phone.length < 7) {
                return res.status(400).json({ message: 'Please provide a valid phone number' });
            }
            updates.phone = phone;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'occupation')) {
            const occupation = String(payload.occupation || '').trim();
            if (!occupation) {
                return res.status(400).json({ message: 'Occupation is required' });
            }
            updates.occupation = occupation;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'monthlyIncome')) {
            const monthlyIncome = String(payload.monthlyIncome || '').trim();
            if (!monthlyIncome) {
                return res.status(400).json({ message: 'Monthly income is required' });
            }
            updates.monthlyIncome = monthlyIncome;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'moveInDate')) {
            const moveInDate = new Date(payload.moveInDate);
            if (Number.isNaN(moveInDate.getTime())) {
                return res.status(400).json({ message: 'Please provide a valid move-in date' });
            }
            updates.moveInDate = moveInDate;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'stayDurationMonths')) {
            const stayDurationMonths = Number(payload.stayDurationMonths);
            if (!Number.isFinite(stayDurationMonths) || stayDurationMonths < 1) {
                return res.status(400).json({ message: 'Stay duration must be at least 1 month' });
            }
            updates.stayDurationMonths = stayDurationMonths;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'occupants')) {
            const occupants = Number(payload.occupants);
            if (!Number.isFinite(occupants) || occupants < 1) {
                return res.status(400).json({ message: 'Occupants must be at least 1' });
            }
            updates.occupants = occupants;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'hasPets')) {
            const hasPets = String(payload.hasPets || '').trim().toLowerCase();
            if (!['yes', 'no'].includes(hasPets)) {
                return res.status(400).json({ message: 'hasPets must be either yes or no' });
            }
            updates.hasPets = hasPets;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'reasonForMoving')) {
            const reasonForMoving = String(payload.reasonForMoving || '').trim();
            if (!reasonForMoving) {
                return res.status(400).json({ message: 'Reason for moving is required' });
            }
            updates.reasonForMoving = reasonForMoving;
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'note')) {
            updates.note = String(payload.note || '').trim();
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: 'No editable fields were provided' });
        }

        Object.assign(booking, updates);
        await booking.save();

        await createNotification({
            userId: booking.ownerId,
            role: 'landlord',
            type: 'booking_updated_by_user',
            title: 'Booking request updated',
            message: `${booking.fullName || 'A renter'} updated their booking request for ${booking.title || 'your property'}.`,
            metadata: {
                bookingId: booking._id,
                listingId: booking.listingId,
            }
        });

        return res.status(200).json({
            message: 'Booking request updated',
            booking,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to edit booking request', error: error.message });
    }
}

export async function getOwnerInquiries(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can access owner inquiries' });
        }

        const inquiries = await Inquiry.find({ ownerId: req.user.userId })
            .populate('userId', 'name email')
            .sort({ updatedAt: -1 });

        return res.status(200).json({ inquiries });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch owner inquiries', error: error.message });
    }
}

export async function addOwnerInquiryMessage(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can reply to inquiries' });
        }

        const { inquiryId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const inquiry = await Inquiry.findOne({ _id: inquiryId, ownerId: req.user.userId }).populate('userId', 'name email');
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        inquiry.messages.push({
            senderType: 'owner',
            text: message.trim(),
            sentAt: new Date()
        });
        inquiry.status = 'responded';
        inquiry.lastMessageAt = new Date();
        await inquiry.save();

        await createNotification({
            userId: inquiry.userId?._id || inquiry.userId,
            role: 'user',
            type: 'inquiry_reply',
            title: 'Owner replied to your inquiry',
            message: `You received a reply for ${inquiry.title || 'your property inquiry'}.`,
            metadata: {
                inquiryId: inquiry._id,
                listingId: inquiry.listingId
            }
        });

        return res.status(200).json({ message: 'Reply sent', inquiry });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send owner reply', error: error.message });
    }
}

export async function getOwnerBookings(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can access owner bookings' });
        }

        const bookings = await Booking.find({ ownerId: req.user.userId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({ bookings });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch owner bookings', error: error.message });
    }
}

export async function updateOwnerBookingStatus(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can update booking requests' });
        }

        const { bookingId } = req.params;
        const { status, ownerResponse } = req.body;
        const normalizedStatus = String(status || '').toLowerCase();

        if (!['confirmed', 'declined'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'Status must be confirmed or declined' });
        }

        if (normalizedStatus === 'declined' && !String(ownerResponse || '').trim()) {
            return res.status(400).json({ message: 'A reason is required when declining a booking' });
        }

        const booking = await Booking.findOne({ _id: bookingId, ownerId: req.user.userId }).populate('userId', 'name email');
        if (!booking) {
            return res.status(404).json({ message: 'Booking request not found' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: 'This booking has already been reviewed' });
        }

        booking.status = normalizedStatus;
        booking.ownerResponse = String(ownerResponse || '').trim();
        await booking.save();

        await createNotification({
            userId: booking.userId?._id || booking.userId,
            role: 'user',
            type: normalizedStatus === 'confirmed' ? 'booking_confirmed' : 'booking_declined',
            title: normalizedStatus === 'confirmed' ? 'Booking request accepted' : 'Booking request rejected',
            message: normalizedStatus === 'confirmed'
                ? `Your booking request for ${booking.title || 'the property'} was accepted.`
                : `Your booking request for ${booking.title || 'the property'} was rejected.`,
            metadata: {
                bookingId: booking._id,
                listingId: booking.listingId
            }
        });

        return res.status(200).json({
            message: normalizedStatus === 'confirmed' ? 'Booking request accepted' : 'Booking request declined',
            booking
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update booking status', error: error.message });
    }
}

export async function sendChatMessage(req, res) {
    try {
        const { listingId, ownerId, message, title, location, price, image } = req.body;

        if (!listingId || !message || !message.trim()) {
            return res.status(400).json({ message: 'listingId and message are required' });
        }

        if (!ownerId) {
            return res.status(400).json({ message: 'ownerId is required' });
        }

        const room = await resolveRoomOwner(listingId);

        let chat = await Chat.findOne({
            userId: req.user.userId,
            ownerId,
            listingId
        });

        if (!chat) {
            chat = await Chat.create({
                userId: req.user.userId,
                ownerId,
                listingId,
                title: room?.title || title || 'Property Chat',
                location: room?.location || location || '',
                price: room?.price || Number(price) || 0,
                image: room?.image || image || '',
                messages: [
                    {
                        senderId: req.user.userId,
                        senderType: 'user',
                        text: message.trim(),
                        sentAt: new Date()
                    }
                ],
                lastMessageAt: new Date()
            });
        } else {
            chat.messages.push({
                senderId: req.user.userId,
                senderType: 'user',
                text: message.trim(),
                sentAt: new Date()
            });
            chat.lastMessageAt = new Date();
            await chat.save();
        }

        await chat.populate('ownerId', 'name email profilePhoto');

        await createNotification({
            userId: ownerId,
            role: 'landlord',
            type: 'chat_message',
            title: 'New chat message',
            message: `${req.user.name || 'A renter'} sent a new message about ${chat.title || 'your listing'}.`,
            metadata: {
                chatId: chat._id,
                listingId: chat.listingId
            }
        });

        return res.status(201).json({ message: 'Message sent', chat });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
}

export async function getUserChats(req, res) {
    try {
        const chats = await Chat.find({ userId: req.user.userId })
            .populate('ownerId', 'name email profilePhoto')
            .sort({ lastMessageAt: -1 });

        return res.status(200).json({ chats });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch chats', error: error.message });
    }
}

export async function getOwnerChats(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can access owner chats' });
        }

        const chats = await Chat.find({ ownerId: req.user.userId })
            .populate('userId', 'name email profilePhoto')
            .sort({ lastMessageAt: -1 });

        return res.status(200).json({ chats });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch owner chats', error: error.message });
    }
}

export async function replyToChat(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can reply to chats' });
        }

        const { chatId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const chat = await Chat.findOne({ _id: chatId, ownerId: req.user.userId })
            .populate('userId', 'name email profilePhoto');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        chat.messages.push({
            senderId: req.user.userId,
            senderType: 'owner',
            text: message.trim(),
            sentAt: new Date()
        });
        chat.ownerLastSeenAt = new Date();
        chat.lastMessageAt = new Date();
        await chat.save();

        await createNotification({
            userId: chat.userId?._id || chat.userId,
            role: 'user',
            type: 'chat_reply',
            title: 'New reply from landlord',
            message: `You received a new message about ${chat.title || 'your property inquiry'}.`,
            metadata: {
                chatId: chat._id,
                listingId: chat.listingId
            }
        });

        return res.status(200).json({ message: 'Reply sent', chat });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send reply', error: error.message });
    }
}

export async function markOwnerChatSeen(req, res) {
    try {
        if (req.user.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can mark chats as seen' });
        }

        const { chatId } = req.params;

        const chat = await Chat.findOne({ _id: chatId, ownerId: req.user.userId })
            .populate('userId', 'name email profilePhoto');

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        chat.ownerLastSeenAt = new Date();
        await chat.save();

        return res.status(200).json({ message: 'Chat marked as seen', chat });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to mark chat as seen', error: error.message });
    }
}

export async function getNotifications(req, res) {
    try {
        const role = req.user.role === 'landlord' ? 'landlord' : 'user';
        const notifications = await Notification.find({ userId: req.user.userId, role })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = notifications.filter((item) => !item.isRead).length;

        return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
}

export async function markNotificationAsRead(req, res) {
    try {
        const role = req.user.role === 'landlord' ? 'landlord' : 'user';
        const { notificationId } = req.params;

        const notification = await Notification.findOne({
            _id: notificationId,
            userId: req.user.userId,
            role
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
        }

        return res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
    }
}

export async function markAllNotificationsAsRead(req, res) {
    try {
        const role = req.user.role === 'landlord' ? 'landlord' : 'user';

        await Notification.updateMany(
            { userId: req.user.userId, role, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
    }
}

export async function clearAllNotifications(req, res) {
    try {
        const role = req.user.role === 'landlord' ? 'landlord' : 'user';

        const result = await Notification.deleteMany({
            userId: req.user.userId,
            role
        });

        return res.status(200).json({
            message: 'All notifications cleared',
            deletedCount: result.deletedCount || 0
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
    }
}
