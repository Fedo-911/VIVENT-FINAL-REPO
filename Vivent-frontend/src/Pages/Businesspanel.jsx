import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  FaBriefcase,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronRight,
  FaClipboardList,
  FaExternalLinkAlt,
  FaEdit,
  FaGraduationCap,
  FaSignOutAlt,
  FaStore,
  FaThLarge,
  FaTrash,
  FaUtensils,
} from "react-icons/fa";
import {
  eventsApi,
  plansApi,
  analyticsApi,
  recordsApi,
  subscriptionsApi,
} from "../utils/api";

// ─── Category helpers ─────────────────────────────────────────────────────────

const CATEGORY_MAP = {
  "job-fair": "job_fair",
  "food-events": "food",
  "educational-expo": "educational",
  job_fair: "job_fair",
  food: "food",
  educational: "educational",
  expo: "expo",
};

const getCategoryLabel = (category) => {
  if (category === "job_fair" || category === "job-fair") return "Job Fair";
  if (category === "food" || category === "food-events") return "Food Event";
  if (category === "educational" || category === "educational-expo")
    return "Educational Expo";
  if (category === "expo") return "Expo";
  return category || "Job Fair";
};

// ─── Static data (UI only — navigation cards) ─────────────────────────────────

const availableEvents = [
  {
    title: "Job Fair",
    route: "/jobfair",
    icon: FaBriefcase,
    tag: "Hiring Campaign",
    desc: "Promote hiring booths, internships, recruiter sessions, and business career drives.",
    img: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1974&auto=format&fit=crop",
  },
  {
    title: "Food Events",
    route: "/foodevents",
    icon: FaUtensils,
    tag: "Brand Activation",
    desc: "Showcase food stalls, restaurant launches, tasting booths, and food brand promotions.",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1974&auto=format&fit=crop",
  },
  {
    title: "Educational Expo",
    route: "/educationalexpo",
    icon: FaGraduationCap,
    tag: "Expo Marketing",
    desc: "Promote institutes, scholarship programs, training brands, and education campaigns.",
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
  },
];

const promotionPlans = [
  {
    name: "Basic Plan",
    price: "$60",
    posts: "7 Posts on Social Media",
    features: [
      "All starter features +",
      "Social media strategy",
      "Content Creation",
      "On Facebook, Instagram",
    ],
  },
  {
    name: "Standard Plan",
    price: "$80",
    posts: "12 Posts on Social Media",
    features: [
      "All starter features +",
      "Social media strategy",
      "Content Creation",
      "On Facebook, Instagram",
      "Additional TikTok",
    ],
    highlighted: true,
  },
  {
    name: "Premium Plan",
    price: "$100",
    posts: "15 Posts on Social Media",
    features: [
      "All starter features +",
      "Social media strategy",
      "Content Creation",
      "On Facebook, Instagram and TikTok",
      "Additional Linkedin Integration",
    ],
  },
];

const sidebarButton =
  "flex min-h-11 w-full items-center justify-between gap-3 bg-blue-800 px-3.5 py-2.5 text-left text-sm font-semibold text-white shadow-lg transition duration-300 hover:bg-blue-900";

const subButton =
  "flex min-h-11 w-full items-center justify-between gap-3 bg-blue-800 px-3.5 py-2.5 text-left text-sm font-semibold text-white shadow-lg transition duration-300 hover:bg-blue-900";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-800 focus:ring-2 focus:ring-blue-100";

// ─── Main Component ───────────────────────────────────────────────────────────

export const Businesspanel = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [recordOpen, setRecordOpen] = useState(false);

  // Real data from backend
  const [managedEvents, setManagedEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [editingEventId, setEditingEventId] = useState(null);
  const [reviewWindow, setReviewWindow] = useState(7);
  const [apiError, setApiError] = useState("");

  const pageTitle = useMemo(() => {
    if (activeView === "social") return "Social Media Promotion Plans";
    if (activeView === "records") return "";
    if (activeView === "add-event") return "Add Event";
    return "";
  }, [activeView]);

  const showDashboard = activeView === "dashboard";
  const showRecords = activeView === "records";

  // Load business dashboard data
  useEffect(() => {
    setLoadingEvents(true);
    analyticsApi
      .businessDashboard()
      .then((data) => {
        setManagedEvents(data?.my_created_events || []);
        setLoadingEvents(false);
      })
      .catch(() => {
        // Fallback — try fetching events directly
        eventsApi
          .list({ page_size: 100 })
          .then((res) => {
            const user = JSON.parse(localStorage.getItem("viventUser") || "{}");
            const myEvents = (res?.items || []).filter(
              (e) => e.created_by === user.id
            );
            setManagedEvents(myEvents);
            setLoadingEvents(false);
          })
          .catch(() => setLoadingEvents(false));
      });

    // Load available plans for event creation
    plansApi
      .list()
      .then((data) => setPlans(data || []))
      .catch(() => {});
  }, []);

  // Load records (past events)
  useEffect(() => {
    if (activeView !== "records" && activeView !== "dashboard") return;
    setLoadingRecords(true);
    recordsApi
      .myEvents()
      .then((data) => {
        setPastEvents(data?.past_events || []);
        setLoadingRecords(false);
      })
      .catch(() => setLoadingRecords(false));
  }, [activeView]);

  const handleLogout = () => {
    localStorage.removeItem("viventAuth");
    localStorage.removeItem("viventAuthRole");
    localStorage.removeItem("viventToken");
    localStorage.removeItem("viventUser");
    navigate("/");
    window.location.reload();
  };

  // CRUD handlers
  const handleCreateEvent = async (form, setForm) => {
    setApiError("");
    try {
      const plan = plans.find(
        (p) => p.name.toLowerCase() === (form.plan || "basic").toLowerCase()
      );
      if (!plan && plans.length > 0) {
        setApiError("Please select a valid plan.");
        return;
      }
      const planId = plan?.id || (plans[0]?.id ?? "");

      const backendCategory = CATEGORY_MAP[form.category] || form.category;
      const startDate = new Date(`${form.date}T${form.time || "10:00"}:00+05:00`).toISOString();
      const endDate = new Date(
        new Date(startDate).getTime() + 2 * 60 * 60 * 1000
      ).toISOString();

      const payload = {
        title: form.title,
        description: form.description || `${form.title} event organized by ${form.company || "VIVENT"}.`,
        category: backendCategory,
        start_date: startDate,
        end_date: endDate,
        location: form.venue || "TBD",
        plan_id: planId,
        max_participants: 200,
        venue_details: {
          company: form.company,
          image_url: form.image || "",
          ticket_price: Number(form.ticketPrice) || 0,
          planned_posts: Number(form.posts) || 7,
        },
      };

      const newEvent = await eventsApi.create(payload);
      setManagedEvents((prev) => [newEvent, ...prev]);
      setForm({
        title: "", company: "", category: "job-fair", venue: "",
        date: "", time: "10:00 AM", ticketPrice: 0, image: "",
        description: "", posts: 7, status: "Upcoming", plan: "Basic",
      });
    } catch (err) {
      setApiError(err.message || "Failed to create event.");
    }
  };

  const handleUpdateEvent = async (eventId, form, setForm) => {
    setApiError("");
    try {
      const backendCategory = CATEGORY_MAP[form.category] || form.category;
      const payload = {
        title: form.title,
        description: form.description,
        category: backendCategory,
        location: form.venue,
        venue_details: {
          company: form.company,
          image_url: form.image,
          ticket_price: Number(form.ticketPrice) || 0,
          planned_posts: Number(form.posts) || 7,
        },
      };
      const updated = await eventsApi.update(eventId, payload);
      setManagedEvents((prev) =>
        prev.map((e) => (e.id === eventId ? updated : e))
      );
      setEditingEventId(null);
      setForm({
        title: "", company: "", category: "job-fair", venue: "",
        date: "", time: "10:00 AM", ticketPrice: 0, image: "",
        description: "", posts: 7, status: "Upcoming", plan: "Basic",
      });
    } catch (err) {
      setApiError(err.message || "Failed to update event.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setApiError("");
    try {
      await eventsApi.delete(eventId);
      setManagedEvents((prev) => prev.filter((e) => e.id !== eventId));
      if (editingEventId === eventId) setEditingEventId(null);
    } catch (err) {
      setApiError(err.message || "Failed to delete event.");
    }
  };

  const handleManagedEventSubmit = (event, form, setForm) => {
    event.preventDefault();
    if (editingEventId) {
      handleUpdateEvent(editingEventId, form, setForm);
    } else {
      handleCreateEvent(form, setForm);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="sidebar-font w-full bg-blue-800 text-white shadow-2xl lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:min-w-72 lg:max-w-72 lg:self-stretch">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="border-b border-blue-700 px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-100">
                  Business Dashboard
                </p>
              </div>

              <nav className="space-y-3 p-5">
                <button
                  className={sidebarButton}
                  onClick={() => setActiveView("dashboard")}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <FaThLarge />
                    Dashboard
                  </span>
                </button>

                <div className="space-y-2">
                  <button
                    className={sidebarButton}
                    onClick={() => setActiveView("add-event")}
                    type="button"
                  >
                    <span className="flex items-center gap-3">
                      <FaCalendarAlt />
                      Add Events
                    </span>
                    <FaChevronRight className="text-xs" />
                  </button>

                  {availableEvents.map((event) => (
                    <Link
                      className={sidebarButton}
                      key={event.title}
                      to={event.route}
                    >
                      <span className="flex items-center gap-3">
                        {event.title}
                      </span>
                      <FaChevronRight className="text-xs" />
                    </Link>
                  ))}
                </div>

                <div className="space-y-2">
                  <button
                    className={sidebarButton}
                    onClick={() => setRecordOpen((value) => !value)}
                    type="button"
                  >
                    <span className="flex items-center gap-3">
                      <FaClipboardList />
                      Records
                    </span>
                    <FaChevronDown
                      className={`transition ${recordOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {recordOpen && (
                    <div className="space-y-2 pl-3">
                      <button
                        className={subButton}
                        onClick={() => setActiveView("records")}
                        type="button"
                      >
                        Previous Events & Reviews
                        <FaChevronRight className="text-xs" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  className={sidebarButton}
                  onClick={() => setActiveView("social")}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <FaStore />
                    Social Media Promotion
                  </span>
                </button>
              </nav>
            </div>

            <div className="border-t border-blue-700 p-5">
              <button
                className="flex w-full items-center justify-center gap-3 bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-xl transition duration-300 hover:bg-blue-900"
                onClick={handleLogout}
                type="button"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {pageTitle && (
            <section className="mb-7 rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200 sm:p-6">
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                {pageTitle}
              </h2>
            </section>
          )}

          {apiError && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-100">
              {apiError}
            </div>
          )}

          {activeView === "social" ? (
            <SocialPromotion />
          ) : activeView === "add-event" ? (
            <AddEventPanel
              editingEventId={editingEventId}
              handleManagedEventSubmit={handleManagedEventSubmit}
              managedEvents={managedEvents}
              setEditingEventId={setEditingEventId}
              handleDeleteEvent={handleDeleteEvent}
              plans={plans}
              loading={loadingEvents}
            />
          ) : (
            <div className="space-y-6">
              {showDashboard && (
                <>
                  <AvailableEvents onAddEvent={() => setActiveView("add-event")} />
                  <RecordsView
                    reviewWindow={reviewWindow}
                    setReviewWindow={setReviewWindow}
                    pastEvents={pastEvents}
                    loading={loadingRecords}
                  />
                </>
              )}
              {showRecords && (
                <RecordsView
                  reviewWindow={reviewWindow}
                  setReviewWindow={setReviewWindow}
                  pastEvents={pastEvents}
                  loading={loadingRecords}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const AvailableEvents = ({ onAddEvent }) => (
  <section className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200 sm:p-6">
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-xl font-black text-slate-900">
          All Business Event Categories
        </h3>
        <p className="text-sm text-slate-500">
          Job fair, food events, and educational expo are connected below.
        </p>
      </div>
      <button
        className="w-fit self-center rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900 sm:self-auto"
        onClick={onAddEvent}
        type="button"
      >
        Add Event
      </button>
    </div>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {availableEvents.map((event) => {
        const Icon = event.icon;
        return (
          <Link
            className="group flex h-full flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-lg ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            key={event.title}
            to={event.route}
          >
            <div className="relative h-52 overflow-hidden">
              <img
                alt={event.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                src={event.img}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <span className="rounded-lg bg-blue-800 px-3 py-2 text-xs font-bold">
                  {event.tag}
                </span>
                <Icon className="text-xl" />
              </div>
            </div>
            <div className="flex flex-1 flex-col p-4 text-center">
              <h4 className="text-xl font-black text-slate-900">{event.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">{event.desc}</p>
              <span className="mt-auto inline-flex items-center justify-center gap-2 self-center rounded-full bg-blue-800 px-4 py-2.5 text-sm font-bold text-white transition duration-300 group-hover:bg-blue-900">
                Open Page
                <FaExternalLinkAlt className="text-xs" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  </section>
);

const RecordsView = ({ reviewWindow, setReviewWindow, pastEvents, loading }) => {
  const filteredEvents = pastEvents.filter((event) => {
    const eventDate = new Date(event.end_date || event.start_date);
    const now = new Date();
    const diffDays = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= reviewWindow;
  });

  return (
    <section className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900">
              Previous Events & Reviews
            </h3>
          </div>
          <select
            className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800 outline-none sm:w-36"
            onChange={(event) => setReviewWindow(Number(event.target.value))}
            value={reviewWindow}
          >
            <option value={7}>7 days</option>
            <option value={15}>15 days</option>
            <option value={21}>21 days</option>
          </select>
        </div>
        <div>
          {loading ? (
            <p className="py-4 text-sm text-slate-400">Loading records…</p>
          ) : filteredEvents.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">No past events in the last {reviewWindow} days.</p>
          ) : (
            <table className="w-full table-fixed border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-blue-800">
                  <th className="w-[14%] px-2 py-2">Event</th>
                  <th className="w-[12%] px-2 py-2">Category</th>
                  <th className="w-[12%] px-2 py-2">Date</th>
                  <th className="w-[14%] px-2 py-2">Venue</th>
                  <th className="w-[10%] px-2 py-2">Status</th>
                  <th className="w-[10%] px-2 py-2">Attendees</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((item) => (
                  <tr className="bg-slate-50 shadow-sm" key={item.id}>
                    <td className="rounded-l-2xl px-2 py-3 text-sm font-bold text-slate-900 align-top break-words">
                      {item.title}
                    </td>
                    <td className="px-2 py-3 text-sm text-slate-700 align-top break-words">
                      {getCategoryLabel(item.category)}
                    </td>
                    <td className="px-2 py-3 text-sm text-slate-700 align-top break-words">
                      {item.start_date
                        ? new Date(item.start_date).toLocaleDateString()
                        : "TBD"}
                    </td>
                    <td className="px-2 py-3 text-sm text-slate-700 align-top break-words">
                      {item.location || "TBD"}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        {item.status || "Completed"}
                      </span>
                    </td>
                    <td className="rounded-r-2xl px-2 py-3 text-sm text-slate-700 align-top">
                      {item.current_participants || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </section>
  );
};

const AddEventPanel = ({
  editingEventId,
  handleManagedEventSubmit,
  managedEvents,
  setEditingEventId,
  handleDeleteEvent,
  plans,
  loading,
}) => {
  const [form, setForm] = useState({
    title: "",
    company: "",
    category: "job-fair",
    venue: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
    ticketPrice: 0,
    image: "",
    description: "",
    posts: 7,
    status: "Upcoming",
    plan: "Basic",
  });

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <section className="space-y-6">
      <form
        className="grid gap-6 xl:grid-cols-[minmax(280px,0.92fr)_minmax(320px,1.08fr)] xl:items-start"
        onSubmit={(event) => handleManagedEventSubmit(event, form, setForm)}
      >
        <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-black">
              Event Title
              <input className={inputClass} onChange={(event) => updateField("title", event.target.value)} required value={form.title} />
            </label>

            <label className="block text-sm font-bold text-black">
              Company / Brand
              <input className={inputClass} onChange={(event) => updateField("company", event.target.value)} required value={form.company} />
            </label>

            <label className="block text-sm font-bold text-black">
              Event Category
              <select className={inputClass} onChange={(event) => updateField("category", event.target.value)} value={form.category}>
                <option value="job-fair">Job Fair</option>
                <option value="food-events">Food Event</option>
                <option value="educational-expo">Educational Expo</option>
                <option value="expo">Expo</option>
              </select>
            </label>

            <label className="block text-sm font-bold text-black">
              Venue
              <input className={inputClass} onChange={(event) => updateField("venue", event.target.value)} required value={form.venue} />
            </label>

            <label className="block text-sm font-bold text-black">
              Time
              <input className={inputClass} onChange={(event) => updateField("time", event.target.value)} required value={form.time} />
            </label>

            <label className="block text-sm font-bold text-black">
              Date
              <input className={inputClass} onChange={(event) => updateField("date", event.target.value)} type="date" value={form.date} required />
            </label>

            <label className="block text-sm font-bold text-black">
              Ticket Price
              <input className={inputClass} min="0" onChange={(event) => updateField("ticketPrice", Number(event.target.value))} type="number" value={form.ticketPrice} />
            </label>

            <label className="block text-sm font-bold text-black">
              Event Image URL
              <input className={inputClass} onChange={(event) => updateField("image", event.target.value)} placeholder="https://..." value={form.image} />
            </label>

            <label className="block text-sm font-bold text-black md:col-span-2">
              Description
              <textarea className={inputClass} onChange={(event) => updateField("description", event.target.value)} placeholder="Short event description..." value={form.description} required />
            </label>

            <label className="block text-sm font-bold text-black">
              Planned Posts
              <input className={inputClass} min="1" onChange={(event) => updateField("posts", Number(event.target.value))} type="number" value={form.posts} />
            </label>

            <label className="block text-sm font-bold text-black">
              Promotion Plan
              <select className={inputClass} onChange={(event) => updateField("plan", event.target.value)} value={form.plan}>
                {plans.length > 0
                  ? plans.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)
                  : <>
                      <option>Basic</option>
                      <option>Normal</option>
                      <option>Premium</option>
                    </>
                }
              </select>
            </label>

            <button
              className="h-11 w-full rounded-full bg-blue-800 font-bold text-white transition hover:bg-blue-900"
              type="submit"
            >
              {editingEventId ? "Update Event" : "Save Event"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 text-left shadow-xl ring-1 ring-slate-200 xl:mt-10">
          <div className="mb-4 text-left">
            <h4 className="text-base font-black text-black">Managed Events</h4>
            <p className="text-sm text-gray-500">
              Event details linked with the social media promotion plan.
            </p>
          </div>

          <div>
            {loading ? (
              <p className="py-4 text-sm text-slate-400">Loading your events…</p>
            ) : managedEvents.length === 0 ? (
              <p className="py-4 text-sm text-slate-400">No events yet. Create your first event above.</p>
            ) : (
              <table className="w-full table-fixed border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-black">
                    <th className="w-[16%] px-2 py-2">Event</th>
                    <th className="w-[13%] px-2 py-2">Category</th>
                    <th className="w-[16%] px-2 py-2">Venue</th>
                    <th className="w-[13%] px-2 py-2">Date</th>
                    <th className="w-[12%] px-2 py-2">Status</th>
                    <th className="w-[21%] px-2 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managedEvents.map((event) => (
                    <tr className="bg-slate-50 shadow-sm" key={event.id}>
                      <td className="rounded-l-2xl px-2 py-3 text-sm font-bold text-slate-900 align-top break-words">
                        {event.title}
                      </td>
                      <td className="px-2 py-3 text-sm text-slate-700 align-top break-words">
                        {getCategoryLabel(event.category)}
                      </td>
                      <td className="px-2 py-3 text-sm text-slate-700 align-top break-words">
                        {event.location || "TBD"}
                      </td>
                      <td className="px-2 py-3 text-sm text-slate-700 align-top break-words">
                        {event.start_date
                          ? new Date(event.start_date).toLocaleDateString()
                          : "TBD"}
                      </td>
                      <td className="px-2 py-3 align-top">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          event.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : event.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {event.status || "pending"}
                        </span>
                      </td>
                      <td className="rounded-r-2xl px-2 py-3 align-top">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-900"
                            onClick={() => {
                              setEditingEventId(event.id);
                              setForm({
                                title: event.title || "",
                                company: event.venue_details?.company || "",
                                category: event.category || "job_fair",
                                venue: event.location || "",
                                date: event.start_date
                                  ? new Date(event.start_date).toISOString().split("T")[0]
                                  : "",
                                time: "10:00 AM",
                                ticketPrice: event.venue_details?.ticket_price || 0,
                                image: event.venue_details?.image_url || "",
                                description: event.description || "",
                                posts: event.venue_details?.planned_posts || 7,
                                status: event.status || "Upcoming",
                                plan: "Basic",
                              });
                            }}
                            type="button"
                          >
                            <FaEdit />
                            Edit
                          </button>
                          <button
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                            onClick={() => handleDeleteEvent(event.id)}
                            type="button"
                          >
                            <FaTrash />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </form>
    </section>
  );
};

const SocialPromotion = () => {
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      plansApi.list().catch(() => []),
      subscriptionsApi.me().catch(() => null),
    ]).then(([planData, sub]) => {
      setPlans(planData || []);
      if (sub?.plan_id) setActivePlanId(sub.plan_id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const handleSelectPlan = async (planId) => {
    setSelectingId(planId);
    try {
      const res = await subscriptionsApi.subscribe(planId);
      setActivePlanId(res.plan_id);
      setMessage(`✓ ${res.plan?.name || "Plan"} activated successfully!`);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSelectingId(null);
    }
  };

  const displayPlans = plans.map((p, idx) => ({
    id: p.id,
    name: p.name,
    price: `$${parseFloat(p.price).toFixed(0)}`,
    posts: p.facilities?.posts || `${7 + idx * 5} Posts on Social Media`,
    features: p.facilities?.features || [
      "All starter features +",
      "Social media strategy",
      "Content Creation",
      "On Facebook, Instagram",
    ],
    highlighted: idx === 1,
  }));

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl bg-white p-8 text-center text-blue-800 shadow-xl ring-1 ring-slate-200">
          Loading plans…
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {message && (
        <div className="fixed bottom-24 right-5 z-[80] rounded-2xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-2xl">
          {message}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {displayPlans.map((plan) => {
          const isActive = plan.id === activePlanId;
          const isSelecting = selectingId === plan.id;
          return (
            <article
              className={`flex h-full flex-col rounded-2xl bg-white p-4 shadow-xl ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                isActive ? "ring-emerald-500" : plan.highlighted ? "ring-blue-800" : "ring-slate-200"
              }`}
              key={plan.id || plan.name}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-800">
                    {plan.posts}
                  </p>
                </div>
                {isActive && (
                  <span className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-black text-white">
                    Active
                  </span>
                )}
                {!isActive && plan.highlighted && (
                  <span className="rounded-lg bg-blue-800 px-2.5 py-1.5 text-[11px] font-black text-white">
                    Popular
                  </span>
                )}
              </div>

              <p className="mb-4 text-3xl font-black text-blue-800">
                {plan.price}
                <span className="text-sm font-bold text-slate-500"> / month</span>
              </p>

              <ul className="space-y-2.5 text-xs leading-5 text-slate-600">
                {plan.features.map((feature) => (
                  <li className="flex gap-3" key={feature}>
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-800" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition duration-300 disabled:opacity-60 ${
                  isActive
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-blue-800 hover:bg-blue-900"
                }`}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isSelecting || isActive}
                type="button"
              >
                {isSelecting ? "Activating…" : isActive ? "Current Plan" : "Select Plan"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Businesspanel;
