export type CreatorType =
  | "photographer"
  | "videographer"
  | "editor"
  | "drone_operator"
  | "product_creator"
  | "wedding_creator"
  | "event_creator"
  | "content_creator"
  | "other";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type AvailabilityStatus = "available" | "busy" | "unavailable";

export type PortfolioCategory =
  | "wedding"
  | "portrait"
  | "fashion"
  | "automotive"
  | "product"
  | "event"
  | "travel"
  | "food"
  | "real_estate"
  | "commercial"
  | "social_media"
  | "other";

export type MediaType = "image" | "video";

export type EquipmentCategory =
  | "camera"
  | "lens"
  | "lighting"
  | "audio"
  | "drone"
  | "gimbal"
  | "tripod"
  | "accessory"
  | "other";

export type PricingUnit = "hour" | "day" | "project" | "package";

export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";

export type GigStatus = "open" | "closed" | "cancelled";

export type GigApplicationStatus = "pending" | "accepted" | "rejected";

export type NotificationType =
  | "booking"
  | "gig"
  | "application"
  | "review"
  | "verification"
  | "report"
  | "system";
