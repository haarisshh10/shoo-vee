import { describe, expect, it } from "vite-plus/test";

import { createProfileSchema } from "./functions";

describe("createProfileSchema", () => {
  it("accepts a minimal valid profile and applies defaults", () => {
    const result = createProfileSchema.parse({ displayName: "Mumbai Shooter" });
    expect(result.currency).toBe("INR");
    expect(result.availabilityStatus).toBe("available");
    expect(result.specialties).toEqual([]);
    expect(result.creatorTypes).toEqual([]);
  });

  it("rejects an empty display name", () => {
    expect(() => createProfileSchema.parse({ displayName: " " })).toThrow();
  });

  it("rejects an unknown creator type", () => {
    expect(() =>
      createProfileSchema.parse({ displayName: "A", creatorTypes: ["pilot"] }),
    ).toThrow();
  });

  it("rejects a negative starting price", () => {
    expect(() => createProfileSchema.parse({ displayName: "A", startingPrice: -5 })).toThrow();
  });

  it("accepts a full valid profile", () => {
    const result = createProfileSchema.parse({
      displayName: "Frame Labs",
      bio: "Wedding and portrait studio",
      profileImageUrl: "https://example.com/p.jpg",
      location: "Mumbai",
      specialties: ["weddings"],
      creatorTypes: ["photographer", "drone_operator"],
      startingPrice: 25000,
      experienceYears: 6,
      socialLinks: { website: "https://example.com" },
      languages: ["English", "Hindi"],
      availabilityStatus: "busy",
    });
    expect(result.creatorTypes).toHaveLength(2);
  });
});
