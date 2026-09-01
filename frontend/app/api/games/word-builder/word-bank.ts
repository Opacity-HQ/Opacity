// Static, curated word bank for Word Builder — kept in-code rather than a
// content table (unlike Letter Detective's ld_word_items) since these
// stimuli don't need admin-editable seeding yet. Tiers track word length and
// orthographic complexity; tiers 3-4 lean on classic dyslexia-relevant
// patterns (b/d/p/q, double letters) so grading can surface reversal and
// transposition errors specifically. Lives inside this game's own API
// folder per backend/backend.md — nothing here is shared with other games.

export const WORD_BANK: Record<number, string[]> = {
  1: [
    "cat", "dog", "sun", "hat", "pig", "red", "run", "big", "top", "map",
    "bed", "cup", "fox", "box", "six", "ten", "wet", "hot", "ice", "egg",
    "jam", "jar", "mud", "owl", "pen", "rat", "van", "web", "zoo", "bug",
    "cow", "fan", "hen", "ink", "log", "mix", "nut", "pot", "rug", "wig",
  ],
  2: [
    "frog", "chip", "shop", "brush", "stamp", "flag", "drum", "swim", "crab", "trap",
    "desk", "nest", "lamp", "tree", "star", "moon", "book", "fish", "bird", "milk",
    "rain", "wind", "snow", "leaf", "seed", "rock", "sand", "wave", "kite", "bell",
    "gift", "ring", "coat", "boot", "sock", "glue", "pond", "hill", "cave", "farm",
  ],
  3: [
    "bread", "dream", "plate", "snake", "cloud", "sheep", "chair", "spoon", "black", "brave",
    "dodge", "proud", "apple", "table", "mouse", "horse", "tiger", "zebra", "whale", "eagle",
    "candy", "party", "happy", "funny", "smile", "dance", "music", "paint", "plant", "beach",
  ],
  4: [
    "planet", "monster", "picture", "thunder", "garden", "forest", "purple", "pencil", "dolphin", "sudden",
    "bubble", "puddle", "rainbow", "autumn", "journey", "kitchen", "morning", "evening", "holiday", "elephant",
    "dinosaur", "treasure", "mountain", "umbrella", "adventure", "butterfly", "chocolate", "wonderful",
  ],
};

export const DISTRACTOR_LETTER_POOL = "aeioubcdfghklmnprstwy".split("");
