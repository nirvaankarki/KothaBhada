import { PlatformSetting } from '../../models/platformSettingModel.js';
import { logAdminAction } from '../../utils/adminAuditLogger.js';

const TAG_CATALOG_KEY = 'listing_tag_catalog';
const DEFAULT_TAGS = [
  'Student-friendly',
  'Pet-friendly',
  'Parking available',
  'Family-friendly',
  'Near public transport',
  'Furnished',
  'Utilities included',
];

function normalizeTags(input) {
  if (!Array.isArray(input)) return [];

  return Array.from(new Set(input
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .slice(0, 80)));
}

export async function getListingTagCatalog(req, res) {
  try {
    const doc = await PlatformSetting.findOne({ key: TAG_CATALOG_KEY }).lean();
    const tags = normalizeTags(doc?.value);

    return res.status(200).json({
      tags: tags.length ? tags : DEFAULT_TAGS,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load listing tag catalog',
      error: error.message,
    });
  }
}

export async function updateListingTagCatalog(req, res) {
  try {
    const tags = normalizeTags(req.body?.tags);

    if (!tags.length) {
      return res.status(400).json({ message: 'Please provide at least one listing tag' });
    }

    const updated = await PlatformSetting.findOneAndUpdate(
      { key: TAG_CATALOG_KEY },
      {
        key: TAG_CATALOG_KEY,
        value: tags,
        updatedBy: req.user?.userId || null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    await logAdminAction({
      adminUser: req.user,
      action: 'update_listing_tag_catalog',
      targetType: 'platform_setting',
      targetId: String(updated?._id || ''),
      targetLabel: TAG_CATALOG_KEY,
      metadata: {
        count: tags.length,
      },
    });

    return res.status(200).json({
      message: 'Listing tag catalog updated successfully',
      tags,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update listing tag catalog',
      error: error.message,
    });
  }
}
