/**
 * Onboarding interests.
 *
 * A Sho-vee account is not split into buyer and creator silos: one person can hire creators, show
 * their own work and pick up gigs. These are preferences that tune the first-run experience, and
 * none of them is exclusive. Creator Profile activation is a separate, reversible decision recorded
 * by the existence of a `creator_profile` row.
 */

export type MarketplaceInterests = {
  hireCreators: boolean;
  showcaseWork: boolean;
  findGigs: boolean;
};

export const NO_INTERESTS: MarketplaceInterests = {
  hireCreators: false,
  showcaseWork: false,
  findGigs: false,
};

export type InterestId = keyof MarketplaceInterests;

export const INTERESTS: {
  id: InterestId;
  label: string;
  description: string;
}[] = [
  {
    id: "hireCreators",
    label: "Hire creators",
    description: "Book photographers, videographers and editors for your shoots.",
  },
  {
    id: "showcaseWork",
    label: "Showcase my work",
    description: "Publish a creator profile with your portfolio and services.",
  },
  {
    id: "findGigs",
    label: "Find gigs & collaborate",
    description: "Pick up short-term crew work posted by other creators.",
  },
];

export function countInterests(interests: MarketplaceInterests): number {
  return INTERESTS.reduce((total, { id }) => total + (interests[id] ? 1 : 0), 0);
}
