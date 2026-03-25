// src/utils/roomMap.ts

// 🔹 Room ID → Slug
export const ROOM_ID_TO_SLUG: Record<number, string> = {
  // Living Rooms
  6: "living-room-1",
  20: "living-room-2",
  21: "living-room-3",
  22: "living-room-4",
  30: "living-room-5",
  33: "living-room-6",
  47: "living-room-7",

  // Kitchens
  8: "kitchen-1",
  26: "kitchen-2",
  29: "kitchen-3",
  34: "kitchen-4",
  35: "kitchen-5",
  45: "kitchen-6",
  46: "kitchen-7",

  // Bedrooms
  37: "bedroom-1",
  38: "bedroom-2",
  39: "bedroom-3",

  // Bathrooms
  12: "bathroom-1",
  23: "bathroom-2",
  24: "bathroom-3",
  25: "bathroom-4",
  40: "bathroom-5",
  42: "bathroom-6",
  44: "bathroom-7",

  // Outdoor
  27: "outdoor-1",
  28: "outdoor-2",
  31: "outdoor-3",
  32: "outdoor-4",
};


// 🔹 Slug → Room ID (reverse mapping)
export const SLUG_TO_ROOM_ID: Record<string, number> = Object.fromEntries(
  Object.entries(ROOM_ID_TO_SLUG).map(([id, slug]) => [slug, Number(id)])
);