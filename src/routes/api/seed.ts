import { createFileRoute } from "@tanstack/react-router";
import { ENV } from "varlock/env";

import { auth } from "#/lib/auth/auth.ts";
import { db } from "#/lib/db/index.ts";
import {
  booking,
  creatorEquipment,
  creatorProfile,
  equipment,
  gig,
  gigApplication,
  portfolioItem,
  post,
  review,
  service,
} from "#/lib/db/schema/index.ts";

const CREATORS: {
  name: string;
  email: string;
  types: string[];
  location: string;
  price: number;
  years: number;
  verified: boolean;
  specialties: string[];
}[] = [
  {
    name: "Asha Rao",
    email: "asha@example.dev",
    types: ["wedding_creator", "photographer"],
    location: "Mumbai",
    price: 45000,
    years: 8,
    verified: true,
    specialties: ["weddings", "portraits"],
  },
  {
    name: "Vikram Shah",
    email: "vikram@example.dev",
    types: ["videographer", "editor"],
    location: "Pune",
    price: 18000,
    years: 5,
    verified: true,
    specialties: ["commercials", "reels"],
  },
  {
    name: "Meera Iyer",
    email: "meera@example.dev",
    types: ["product_creator", "photographer"],
    location: "Mumbai",
    price: 8000,
    years: 4,
    verified: false,
    specialties: ["product", "food"],
  },
  {
    name: "Rahul Desai",
    email: "rahul@example.dev",
    types: ["drone_operator", "videographer"],
    location: "Mumbai",
    price: 22000,
    years: 6,
    verified: true,
    specialties: ["aerials", "events"],
  },
  {
    name: "Sara Khan",
    email: "sara@example.dev",
    types: ["photographer"] as string[],
    location: "Bangalore",
    price: 30000,
    years: 7,
    verified: true,
    specialties: ["fashion", "lookbooks"],
  },
  {
    name: "Arjun Nair",
    email: "arjun@example.dev",
    types: ["videographer"] as string[],
    location: "Mumbai",
    price: 15000,
    years: 3,
    verified: false,
    specialties: ["cars", "automotive"],
  },
  {
    name: "Priya Menon",
    email: "priya@example.dev",
    types: ["editor", "content_creator"] as string[],
    location: "Chennai",
    price: 6000,
    years: 5,
    verified: true,
    specialties: ["color grade", "youtube"],
  },
  {
    name: "Dev Patel",
    email: "dev@example.dev",
    types: ["event_creator", "photographer"] as string[],
    location: "Mumbai",
    price: 25000,
    years: 9,
    verified: true,
    specialties: ["events", "corporate"],
  },
  {
    name: "Naina Kapoor",
    email: "naina@example.dev",
    types: ["wedding_creator"],
    location: "Delhi NCR",
    price: 55000,
    years: 10,
    verified: false,
    specialties: ["weddings", "cinematic"],
  },
  {
    name: "Kabir Singh",
    email: "kabir@example.dev",
    types: ["photographer"] as string[],
    location: "Mumbai",
    price: 3000,
    years: 1,
    verified: false,
    specialties: ["portraits", "street"],
  },
];

const EQUIPMENT_CATALOG = [
  { name: "FX3", brand: "Sony", model: "ILME-FX3", category: "camera" },
  { name: "A7 IV", brand: "Sony", model: "ILCE-7M4", category: "camera" },
  { name: "R6 II", brand: "Canon", model: "EOS R6 Mark II", category: "camera" },
  { name: "24-70mm f/2.8 GM II", brand: "Sony", model: "SEL2470GM2", category: "lens" },
  { name: "35mm f/1.4", brand: "Sigma", model: "DG HSM Art", category: "lens" },
  { name: "Aputure 600d", brand: "Aputure", model: "600d Pro", category: "lighting" },
  { name: "Mavic 3 Pro", brand: "DJI", model: "Mavic 3 Pro", category: "drone" },
  { name: "RS 4 Pro", brand: "DJI", model: "RS 4 Pro", category: "gimbal" },
  { name: "Rode Wireless GO II", brand: "Rode", model: "Wireless GO II", category: "audio" },
  { name: "C-Stand", brand: "Manfrotto", model: "190", category: "tripod" },
] as const;

const CATEGORIES = [
  "wedding",
  "portrait",
  "fashion",
  "automotive",
  "product",
  "event",
  "travel",
  "food",
  "real_estate",
  "commercial",
  "social_media",
  "other",
] as const;

const GIGS = [
  {
    title: "Need second photographer for a wedding",
    role: "Second photographer",
    location: "Mumbai",
    pay: 5000,
  },
  {
    title: "Need video editor for YouTube channel",
    role: "Video editor",
    location: "Remote",
    pay: 8000,
  },
  {
    title: "Need assistant for product shoot",
    role: "Photo assistant",
    location: "Mumbai",
    pay: 2000,
  },
  {
    title: "Need drone operator for real estate",
    role: "Drone operator",
    location: "Pune",
    pay: 6000,
  },
  { title: "Need editor for wedding films", role: "Offline editor", location: "Mumbai", pay: 7000 },
  { title: "Need content day coverage", role: "Content creator", location: "Bangalore", pay: 4000 },
  { title: "Need gimbal operator", role: "Gimbal operator", location: "Mumbai", pay: 3500 },
  {
    title: "Need still photographer for fashion shoot",
    role: "Photographer",
    location: "Mumbai",
    pay: 9000,
  },
  { title: "Need BTS videographer", role: "Videographer", location: "Delhi NCR", pay: 4500 },
  { title: "Need colorist for music videos", role: "Colorist", location: "Mumbai", pay: 6000 },
  { title: "Need assistant for event coverage", role: "Assistant", location: "Chennai", pay: 2500 },
  { title: "Need voiceover artist for reels", role: "Voiceover", location: "Remote", pay: 1500 },
  {
    title: "Need photographer for a product launch",
    role: "Photographer",
    location: "Mumbai",
    pay: 12000,
  },
  { title: "Need editor for shorts daily", role: "Shorts editor", location: "Remote", pay: 10000 },
  { title: "Need drone FPV pilot", role: "FPV pilot", location: "Mumbai", pay: 8000 },
];

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/800/600`;
}

export const Route = createFileRoute("/api/seed")({
  server: {
    handlers: {
      POST: async () => {
        if (!ENV.VITE_BASE_URL.includes("localhost")) {
          return new Response("Seed is only allowed in development", { status: 403 });
        }

        // fast bail-out: skip if we already seeded
        const seeded = await db.select().from(creatorProfile).limit(1);
        if (seeded.length > 0) {
          return Response.json({ skipped: true, reason: "creators already exist" });
        }

        const password = "Demo1234!";
        const profiles: { id: string; userId: string }[] = [];

        for (const c of CREATORS) {
          const signup = (await auth.api
            .signUpEmail({
              body: { name: c.name, email: c.email, password },
            })
            .catch(() => null)) as any;
          const userId: string | undefined = signup?.user?.id;
          if (!userId) continue;

          const [profile] = await db
            .insert(creatorProfile)
            .values({
              userId,
              displayName: c.name,
              bio: `${c.specialties.join(" & ")} creator based in ${c.location}.`,
              profileImageUrl: picsum(`face-${c.email}`),
              coverImageUrl: picsum(`cover-${c.email}`),
              location: c.location,
              specialties: c.specialties,
              creatorTypes: c.types as never[],
              startingPrice: c.price,
              currency: "INR",
              verificationStatus: c.verified ? "verified" : "unverified",
              experienceYears: c.years,
              languages: ["English", "Hindi"],
              availabilityStatus: "available",
            })
            .returning();
          profiles.push({ id: profile.id, userId });
        }

        const equipmentIds: string[] = [];
        for (const e of EQUIPMENT_CATALOG) {
          const [row] = await db
            .insert(equipment)
            .values({ name: e.name, brand: e.brand, model: e.model, category: e.category })
            .returning();
          equipmentIds.push(row.id);
        }

        for (const [i, p] of profiles.entries()) {
          for (let j = 0; j < 3; j++) {
            const k = (i * 3 + j) % EQUIPMENT_CATALOG.length;
            await db
              .insert(creatorEquipment)
              .values({ creatorId: p.id, equipmentId: equipmentIds[k] })
              .onConflictDoNothing();
          }
          for (let j = 0; j < 3; j++) {
            const category = CATEGORIES[(i + j * 3) % CATEGORIES.length];
            await db.insert(portfolioItem).values({
              creatorId: p.id,
              title: `${category} shot ${j + 1}`,
              description: `${category} work by a Sho-vee creator.`,
              mediaUrl: picsum(`portfolio-${i}-${j}`),
              mediaType: "image",
              category,
              tags: [category, "shovee"],
            });
          }
          for (let j = 0; j < 2; j++) {
            await db.insert(service).values({
              creatorId: p.id,
              title: `${CATEGORIES[(i + j) % CATEGORIES.length]} coverage`,
              category: CATEGORIES[(i + j) % CATEGORIES.length],
              description: "Full-day professional coverage.",
              price: CREATORS[i].price * (j + 1),
              currency: "INR",
              pricingUnit: j === 0 ? "project" : "day",
            });
          }
          await db.insert(post).values({
            creatorId: p.id,
            caption: `Latest work — ${CREATORS[i].specialties[0]}`,
            mediaUrl: picsum(`post-${i}`),
            mediaType: "image",
            location: CREATORS[i].location,
            tags: CREATORS[i].specialties,
          });
        }

        for (const [i, g] of GIGS.entries()) {
          await db.insert(gig).values({
            posterId: profiles[i % profiles.length].userId,
            title: g.title,
            description: `${g.role} needed. Reach out with your portfolio.`,
            roleNeeded: g.role,
            location: g.location,
            pay: g.pay,
            currency: "INR",
            date: new Date(Date.now() + (i + 3) * 86400000),
            status: "open",
          });
        }

        const demoSignup = (await auth.api
          .signInEmail({
            body: { email: "demo@sho-vee.dev", password },
          })
          .catch(() => null)) as any;
        const demoUserId: string | undefined = demoSignup?.user?.id;

        if (demoUserId && profiles.length >= 2) {
          const [b1] = await db
            .insert(booking)
            .values({
              customerId: demoUserId,
              creatorId: profiles[0].id,
              location: "Mumbai",
              message: "Wedding coverage in December",
              agreedPrice: 45000,
              currency: "INR",
              status: "completed",
            })
            .returning();
          await db.insert(review).values({
            creatorId: profiles[0].id,
            reviewerId: demoUserId,
            bookingId: b1.id,
            rating: 5,
            comment: "Stunning work, highly recommend.",
          });

          await db.insert(booking).values({
            customerId: demoUserId,
            creatorId: profiles[1].id,
            location: "Online",
            message: "Need reels edited",
            agreedPrice: 8000,
            currency: "INR",
            status: "pending",
          });

          const allGigs = await db.select().from(gig).limit(2);
          for (const g of allGigs) {
            await db
              .insert(gigApplication)
              .values({
                gigId: g.id,
                applicantId: demoUserId,
                message: "I have relevant experience.",
              })
              .onConflictDoNothing();
          }
        }

        return Response.json({ seeded: true, creators: profiles.length });
      },
    },
  },
});
