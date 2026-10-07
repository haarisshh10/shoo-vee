import { defineRelations } from "drizzle-orm";

import * as schema from "./";

export const relations = defineRelations(schema, (r) => ({
  creatorProfile: {
    user: r.one.user({ from: r.creatorProfile.userId, to: r.user.id }),
    portfolioItems: r.many.portfolioItem({
      from: r.creatorProfile.id,
      to: r.portfolioItem.creatorId,
    }),
    services: r.many.service({
      from: r.creatorProfile.id,
      to: r.service.creatorId,
    }),
    equipment: r.many.creatorEquipment({
      from: r.creatorProfile.id,
      to: r.creatorEquipment.creatorId,
    }),
    posts: r.many.post({
      from: r.creatorProfile.id,
      to: r.post.creatorId,
    }),
    bookings: r.many.booking({
      from: r.creatorProfile.id,
      to: r.booking.creatorId,
    }),
    reviews: r.many.review({
      from: r.creatorProfile.id,
      to: r.review.creatorId,
    }),
  },
  portfolioItem: {
    creator: r.one.creatorProfile({
      from: r.portfolioItem.creatorId,
      to: r.creatorProfile.id,
    }),
  },
  service: {
    creator: r.one.creatorProfile({
      from: r.service.creatorId,
      to: r.creatorProfile.id,
    }),
  },
  equipment: {
    creators: r.many.creatorEquipment({
      from: r.equipment.id,
      to: r.creatorEquipment.equipmentId,
    }),
  },
  creatorEquipment: {
    creator: r.one.creatorProfile({
      from: r.creatorEquipment.creatorId,
      to: r.creatorProfile.id,
    }),
    equipment: r.one.equipment({
      from: r.creatorEquipment.equipmentId,
      to: r.equipment.id,
    }),
  },
  post: {
    creator: r.one.creatorProfile({
      from: r.post.creatorId,
      to: r.creatorProfile.id,
    }),
  },
  booking: {
    customer: r.one.user({ from: r.booking.customerId, to: r.user.id }),
    creator: r.one.creatorProfile({
      from: r.booking.creatorId,
      to: r.creatorProfile.id,
    }),
    service: r.one.service({
      from: r.booking.serviceId,
      to: r.service.id,
      optional: true,
    }),
  },
  gig: {
    poster: r.one.user({ from: r.gig.posterId, to: r.user.id }),
    applications: r.many.gigApplication({
      from: r.gig.id,
      to: r.gigApplication.gigId,
    }),
  },
  gigApplication: {
    gig: r.one.gig({ from: r.gigApplication.gigId, to: r.gig.id }),
    applicant: r.one.user({ from: r.gigApplication.applicantId, to: r.user.id }),
  },
  review: {
    creator: r.one.creatorProfile({
      from: r.review.creatorId,
      to: r.creatorProfile.id,
    }),
    reviewer: r.one.user({ from: r.review.reviewerId, to: r.user.id }),
    booking: r.one.booking({ from: r.review.bookingId, to: r.booking.id }),
  },
  notification: {
    user: r.one.user({ from: r.notification.userId, to: r.user.id }),
  },
}));
