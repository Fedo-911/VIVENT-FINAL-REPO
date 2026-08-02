export const completedEventFallbacks = [
  {
    id: "f4d881c3-86e6-4e9a-9c98-ca47baabc9dc",
    title: "University Admission Fair",
    description:
      "Meet representatives from top-tier colleges and universities to secure instant admissions.",
    category: "educational",
    status: "completed",
    start_date: "2026-12-10T10:00:00+00:00",
    end_date: "2026-12-10T12:00:00+00:00",
    location: "Pearl Continental, Lahore",
    max_participants: 800,
    current_participants: 0,
    venue_details: {
      company: "Education Partners",
      ticket_price: 0,
      image_url: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=2070",
    },
  },
  {
    id: "fb4397d1-6c0a-4e39-b029-f8dff87d41da",
    title: "Tech Talents Summit",
    description:
      "A niche career fair dedicated entirely to AI, Data Science, and Software Engineers.",
    category: "job_fair",
    status: "completed",
    start_date: "2026-12-04T10:00:00+00:00",
    end_date: "2026-12-04T12:00:00+00:00",
    location: "Astola Tech Hub, Gulberg, Lahore",
    max_participants: 150,
    current_participants: 0,
    venue_details: {
      company: "Astola Tech Hub",
      ticket_price: 0,
      image_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070",
    },
  },
];

export const mergeCompletedFallbacks = (items, category) => {
  const existingIds = new Set(items.map((item) => item.id));
  const missing = completedEventFallbacks.filter(
    (event) => event.category === category && !existingIds.has(event.id)
  );
  return [...items, ...missing].sort((first, second) =>
    String(first.start_date || "").localeCompare(String(second.start_date || ""))
  );
};
