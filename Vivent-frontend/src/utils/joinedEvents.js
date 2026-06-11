const storageKey = "viventJoinedEvents";
const legacyJobApplicationsKey = "viventJobApplications";

export const loadJoinedEvents = () => {
  try {
    const rawJoined = localStorage.getItem(storageKey);
    const rawApplications = localStorage.getItem(legacyJobApplicationsKey);

    const joinedEvents = rawJoined ? JSON.parse(rawJoined) : [];
    const jobApplications = rawApplications ? JSON.parse(rawApplications) : [];
    const legacyJoined = jobApplications.map((item) => ({
      id: item.id,
      eventKey: `legacy-job-${item.id || item.jobTitle || Date.now()}`,
      type: "Job Fair",
      title: item.jobTitle || "Job Fair Application",
      company: item.company || "",
      location: item.location || "",
      applicantName: item.applicantName || "",
      email: item.email || "",
      phone: item.phone || "",
      currentRole: item.currentRole || "",
      cvLink: item.cvLink || "",
      coverLetter: item.coverLetter || "",
      status: item.status || "Applied",
      submittedAt: item.submittedAt || item.joinedAt || new Date().toISOString(),
    }));

    const merged = [...joinedEvents, ...legacyJoined];
    const seenKeys = new Set();

    return merged.filter((item) => {
      const key = item.eventKey || String(item.id || item.title || Math.random());
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
  } catch {
    return [];
  }
};

export const saveJoinedEvent = (entry) => {
  const existing = loadJoinedEvents();
  const nextEntry = { id: entry.id || Date.now(), ...entry };
  const filtered = nextEntry.eventKey
    ? existing.filter((item) => item.eventKey !== nextEntry.eventKey)
    : existing;

  localStorage.setItem(storageKey, JSON.stringify([nextEntry, ...filtered]));
  window.dispatchEvent(new Event("vivent-joined-events-updated"));

  return nextEntry;
};
