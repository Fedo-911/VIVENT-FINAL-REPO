const storageKey = "viventCreatedEvents";

const categoryAliases = {
  "Job Fair": "job-fair",
  "Food Event": "food-events",
  "Educational Expo": "educational-expo",
  "job-fair": "job-fair",
  "food-events": "food-events",
  "educational-expo": "educational-expo",
};

const defaultImages = {
  "job-fair": "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1974&auto=format&fit=crop",
  "food-events": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1974&auto=format&fit=crop",
  "educational-expo": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
};

const defaultCompanies = {
  "job-fair": "Business Sponsored Event",
  "food-events": "Business Sponsored Event",
  "educational-expo": "Business Sponsored Event",
};

export const normalizeCreatedCategory = (category) =>
  categoryAliases[category] || "job-fair";

export const loadCreatedEvents = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

export const loadCreatedEventsByCategory = (category) =>
  loadCreatedEvents().filter(
    (item) => normalizeCreatedCategory(item.category) === category
  );

export const saveCreatedEvent = (event) => {
  const current = loadCreatedEvents();
  const category = normalizeCreatedCategory(event.category);
  const eventId = event.id || Date.now();
  const nextEvent = {
    id: eventId,
    category,
    eventType: category,
    title: event.title || "Untitled Event",
    company: event.company || defaultCompanies[category],
    location: event.venue || event.location || "TBD",
    venue: event.venue || event.location || "TBD",
    date: event.date || "2026-05-22",
    time: event.time || "10:00 AM",
    ticketPrice: Number(event.ticketPrice || 0),
    image: event.image || defaultImages[category],
    description:
      event.description ||
      "Business added event now available on the matching event page.",
    status: event.status || "Upcoming",
    plan: event.plan || "Standard",
    posts: Number(event.posts || 7),
    createdAt: event.createdAt || new Date().toISOString(),
  };

  const filtered = current.filter((item) => item.id !== nextEvent.id);
  localStorage.setItem(storageKey, JSON.stringify([nextEvent, ...filtered]));
  window.dispatchEvent(new Event("vivent-created-events-updated"));

  return nextEvent;
};

export const deleteCreatedEvent = (eventId) => {
  const current = loadCreatedEvents();
  const next = current.filter((item) => item.id !== eventId);
  localStorage.setItem(storageKey, JSON.stringify(next));
  window.dispatchEvent(new Event("vivent-created-events-updated"));
};
