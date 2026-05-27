// services/partnerMarketplace.js - Partner Marketplace
// Marketplace for telecom, insurance, recovery, and verification partners

import { PartnerListing, User, Organization } from "../db/index.js";

// ── Partner Listing Management ───────────────────────────────────────────────────
export async function createPartnerListing(data) {
  const {
    userId,
    organizationId,
    name,
    category,
    description,
    services,
    countries,
    regions,
    pricingModel,
    pricingDetails,
    website,
    email,
    phone,
  } = data;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (organizationId) {
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new Error("Organization not found");
  }

  const listing = await PartnerListing.create({
    user: userId,
    organization: organizationId,
    name,
    category,
    description,
    services: services || [],
    countries: countries || [],
    regions: regions || [],
    pricingModel,
    pricingDetails,
    website,
    email,
    phone,
    status: "pending",
  });

  return listing;
}

export async function getPartnerListing(listingId) {
  const listing = await PartnerListing.findById(listingId)
    .populate("user", "name email")
    .populate("organization", "name slug")
    .populate("verifiedBy", "name email");

  return listing;
}

export async function getPartnerListingsByUser(userId) {
  const listings = await PartnerListing.find({ user: userId })
    .sort({ createdAt: -1 });

  return listings;
}

export async function updatePartnerListing(listingId, updates) {
  const listing = await PartnerListing.findById(listingId);
  if (!listing) throw new Error("Partner listing not found");

  const allowedUpdates = [
    "name",
    "category",
    "description",
    "services",
    "countries",
    "regions",
    "pricingModel",
    "pricingDetails",
    "website",
    "email",
    "phone",
  ];

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      listing[key] = updates[key];
    }
  }

  listing.updatedAt = new Date();
  await listing.save();

  return listing;
}

export async function deletePartnerListing(listingId) {
  const listing = await PartnerListing.findByIdAndDelete(listingId);
  if (!listing) throw new Error("Partner listing not found");

  return listing;
}

// ── Partner Verification ───────────────────────────────────────────────────────
export async function verifyPartnerListing(listingId, verifiedBy) {
  const listing = await PartnerListing.findById(listingId);
  if (!listing) throw new Error("Partner listing not found");

  listing.verified = true;
  listing.verifiedAt = new Date();
  listing.verifiedBy = verifiedBy;
  listing.status = "approved";
  listing.updatedAt = new Date();
  await listing.save();

  return listing;
}

export async function rejectPartnerListing(listingId) {
  const listing = await PartnerListing.findById(listingId);
  if (!listing) throw new Error("Partner listing not found");

  listing.status = "rejected";
  listing.updatedAt = new Date();
  await listing.save();

  return listing;
}

export async function suspendPartnerListing(listingId) {
  const listing = await PartnerListing.findById(listingId);
  if (!listing) throw new Error("Partner listing not found");

  listing.status = "suspended";
  listing.updatedAt = new Date();
  await listing.save();

  return listing;
}

// ── Partner Discovery ───────────────────────────────────────────────────────────
export async function searchPartnerListings(query) {
  const listings = await PartnerListing.find({
    status: "approved",
    $or: [
      { name: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { services: { $regex: query, $options: "i" } },
    ],
  })
    .populate("user", "name email")
    .populate("organization", "name slug")
    .sort({ verified: -1, views: -1 })
    .limit(50);

  return listings;
}

export async function getPartnersByCategory(category) {
  const listings = await PartnerListing.find({
    category,
    status: "approved",
  })
    .populate("user", "name email")
    .populate("organization", "name slug")
    .sort({ verified: -1, views: -1 });

  return listings;
}

export async function getPartnersByCountry(country) {
  const listings = await PartnerListing.find({
    countries: country,
    status: "approved",
  })
    .populate("user", "name email")
    .populate("organization", "name slug")
    .sort({ verified: -1, views: -1 });

  return listings;
}

export async function getVerifiedPartners() {
  const listings = await PartnerListing.find({
    verified: true,
    status: "approved",
  })
    .populate("user", "name email")
    .populate("organization", "name slug")
    .sort({ views: -1 });

  return listings;
}

export async function getPendingVerifications() {
  const listings = await PartnerListing.find({
    status: "pending",
  })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return listings;
}

// ── Partner Metrics ─────────────────────────────────────────────────────────────
export async function incrementPartnerViews(listingId) {
  const listing = await PartnerListing.findById(listingId);
  if (!listing) throw new Error("Partner listing not found");

  listing.views += 1;
  listing.updatedAt = new Date();
  await listing.save();

  return listing;
}

export async function incrementPartnerClicks(listingId) {
  const listing = await PartnerListing.findById(listingId);
  if (!listing) throw new Error("Partner listing not found");

  listing.clicks += 1;
  listing.updatedAt = new Date();
  await listing.save();

  return listing;
}

export async function incrementPartnerInquiries(listingId) {
  const listing = await PartnerListing.findById(listingId);
  if (!listing) throw new Error("Partner listing not found");

  listing.inquiries += 1;
  listing.updatedAt = new Date();
  await listing.save();

  return listing;
}

// ── Marketplace Statistics ───────────────────────────────────────────────────────
export async function getMarketplaceStatistics() {
  const [
    totalListings,
    verifiedListings,
    pendingListings,
    approvedListings,
    rejectedListings,
    suspendedListings,
    totalViews,
    totalClicks,
    totalInquiries,
    listingsByCategory,
    listingsByCountry,
  ] = await Promise.all([
    PartnerListing.countDocuments(),
    PartnerListing.countDocuments({ verified: true }),
    PartnerListing.countDocuments({ status: "pending" }),
    PartnerListing.countDocuments({ status: "approved" }),
    PartnerListing.countDocuments({ status: "rejected" }),
    PartnerListing.countDocuments({ status: "suspended" }),
    PartnerListing.aggregate([
      { $group: { _id: null, total: { $sum: "$views" } } },
    ]),
    PartnerListing.aggregate([
      { $group: { _id: null, total: { $sum: "$clicks" } } },
    ]),
    PartnerListing.aggregate([
      { $group: { _id: null, total: { $sum: "$inquiries" } } },
    ]),
    PartnerListing.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    PartnerListing.aggregate([
      { $unwind: "$countries" },
      { $group: { _id: "$countries", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    totalListings,
    verifiedListings,
    pendingListings,
    approvedListings,
    rejectedListings,
    suspendedListings,
    totalViews: totalViews[0]?.total || 0,
    totalClicks: totalClicks[0]?.total || 0,
    totalInquiries: totalInquiries[0]?.total || 0,
    listingsByCategory: listingsByCategory.map(l => ({ category: l._id, count: l.count })),
    listingsByCountry: listingsByCountry.map(l => ({ country: l._id, count: l.count })),
  };
}
