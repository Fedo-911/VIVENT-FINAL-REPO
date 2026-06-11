import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaChartBar,
  FaChevronRight,
  FaClipboardList,
  FaEdit,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPlus,
  FaTrash,
  FaSignOutAlt,
  FaTiktok,
  FaTimes,
  FaUpload,
} from "react-icons/fa";
import { allShowcaseEvents } from "../data/eventCatalog";
import { eventsApi, adminApi, analyticsApi, recordsApi } from "../utils/api";

const eventCategories = [
  {
    id: "job-fair",
    title: "Job Fair",
    desc: "Career meetups, company booths, and internship drives.",
    accent: "from-blue-800 to-blue-950",
    img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
  },
  {
    id: "food-events",
    title: "Food Event",
    desc: "Food festivals, tasting counters, and live cooking sessions.",
    accent: "from-blue-800 to-slate-950",
    img: "https://images.unsplash.com/photo-1551024601-bec78aea704b",
  },
  {
    id: "educational-expo",
    title: "Educational Expo",
    desc: "Universities, scholarships, admissions, and student guidance.",
    accent: "from-blue-800 to-indigo-950",
    img: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b",
  },
];

const initialPresentEvents = allShowcaseEvents.map((event, index) => {
  const baseAttendees = {
    "job-fair": 320,
    "food-events": 420,
    "educational-expo": 360,
  }[event.category] || 300;

  return {
    ...event,
    id: index + 1,
    attendees: baseAttendees + (index % 3) * 25,
  };
});

const initialPreviousEvents = [
  {
    id: 101,
    title: "UI/UX Design Internship",
    category: "job-fair",
    date: "2026-05-14",
    time: "2:00 PM",
    venue: "Model Town, Lahore",
    attendees: 480,
    rating: "5.0",
    status: "Completed",
  },
  {
    id: 102,
    title: "Chef Live Cooking Show",
    category: "food-events",
    date: "2026-05-15",
    time: "5:00 PM",
    venue: "Iqbal Town, Lahore",
    attendees: 620,
    rating: "4.9",
    status: "Completed",
  },
  {
    id: 103,
    title: "Study Abroad Expo",
    category: "educational-expo",
    date: "2026-05-16",
    time: "11:00 AM",
    venue: "Bahria Town, Lahore",
    attendees: 360,
    rating: "4.8",
    status: "Completed",
  },
  {
    id: 104,
    title: "Career Counseling Session",
    category: "educational-expo",
    date: "2026-05-18",
    time: "2:00 PM",
    venue: "DHA Phase 6, Lahore",
    attendees: 280,
    rating: "4.7",
    status: "Completed",
  },
  {
    id: 105,
    title: "Tech Innovators Job Fair",
    category: "job-fair",
    date: "2026-05-19",
    time: "10:00 AM",
    venue: "Expo Hall A",
    attendees: 320,
    rating: "5.0",
    status: "Completed",
  },
  {
    id: 106,
    title: "Campus Food Carnival",
    category: "food-events",
    date: "2026-05-20",
    time: "5:00 PM",
    venue: "Central Lawn",
    attendees: 410,
    rating: "4.9",
    status: "Completed",
  },
];

const initialManagedEvents = [
  {
    id: 201,
    title: "Admin Hiring Week",
    category: "Job Fair",
    venue: "Expo Hall A",
    date: "2026-05-22",
    plan: "Standard",
    posts: 12,
    status: "Planned",
  },
  {
    id: 202,
    title: "Premium Food Brand Launch",
    category: "Food Event",
    venue: "Central Lawn",
    date: "2026-05-24",
    plan: "Premium",
    posts: 15,
    status: "Planned",
  },
  {
    id: 203,
    title: "Student Expo Showcase",
    category: "Educational Expo",
    venue: "Seminar Hall",
    date: "2026-05-26",
    plan: "Basic",
    posts: 7,
    status: "Planned",
  },
];

const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const emptyEvent = {
  title: "",
  category: "job-fair",
  date: "2026-12-01",
  time: "10:00 AM",
  venue: "",
  attendees: 0,
  status: "Upcoming",
  rating: "5.0",
};

const postPlatforms = [
  "Facebook",
  "Instagram",
  "Tiktok",
  "Linkedin",
  "Snapchat",
  "Thread",
];

const emptyPostForm = {
  title: "",
  description: "",
  tags: "",
  mediaName: "",
  socialMediaId: "",
  password: "",
  platforms: ["Instagram"],
};

const initialPosts = [
  {
    id: 1,
    clientName: "Typing",
    reach: "Typing",
    platforms: ["Facebook", "Instagram", "Tiktok", "Linkedin"],
  },
  {
    id: 2,
    clientName: "Typing",
    reach: "Typing",
    platforms: ["Facebook", "Instagram", "Tiktok", "Linkedin"],
  },
  {
    id: 3,
    clientName: "Typing",
    reach: "Typing",
    platforms: ["Facebook", "Instagram", "Tiktok", "Linkedin"],
  },
];

const promotionPlans = {
  student: {
    basic: {
      title: "Student Basic Plan",
      duration: "30 Days",
      reachTarget: 9000,
      engagementTarget: 1400,
      growthTarget: 7,
      postsTarget: 7,
    },
    standard: {
      title: "Student Standard Plan",
      duration: "30 Days",
      reachTarget: 24000,
      engagementTarget: 3900,
      growthTarget: 15,
      postsTarget: 12,
    },
    premium: {
      title: "Student Premium Plan",
      duration: "30 Days",
      reachTarget: 52000,
      engagementTarget: 8500,
      growthTarget: 28,
      postsTarget: 15,
    },
  },
  business: {
    basic: {
      title: "Business Basic Plan",
      duration: "30 Days",
      reachTarget: 12000,
      engagementTarget: 1800,
      growthTarget: 8,
      postsTarget: 7,
    },
    standard: {
      title: "Business Standard Plan",
      duration: "30 Days",
      reachTarget: 35000,
      engagementTarget: 5200,
      growthTarget: 18,
      postsTarget: 12,
    },
    premium: {
      title: "Business Premium Plan",
      duration: "30 Days",
      reachTarget: 90000,
      engagementTarget: 14500,
      growthTarget: 35,
      postsTarget: 15,
    },
  },
};

const initialPromotionClients = [
  {
    id: 1,
    name: "Vivent Food Carnival",
    userType: "business",
    plan: "premium",
    platforms: ["Facebook", "Instagram", "Tiktok", "Youtube"],
    reach: 74200,
    engagement: 11850,
    growth: 29,
    posts: 18,
  },
  {
    id: 2,
    name: "Career Connect Expo",
    userType: "business",
    plan: "standard",
    platforms: ["Facebook", "Instagram", "Linkedin"],
    reach: 28600,
    engagement: 4300,
    growth: 14,
    posts: 11,
  },
  {
    id: 3,
    name: "Campus Admission Drive",
    userType: "student",
    plan: "basic",
    platforms: ["Instagram", "Linkedin"],
    reach: 8300,
    engagement: 1260,
    growth: 6,
    posts: 5,
  },
];

const getPromotionPlan = (client) =>
  promotionPlans[client?.userType]?.[client?.plan] || promotionPlans.student.basic;

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

const getCategoryTitle = (categoryId) =>
  eventCategories.find((item) => item.id === categoryId)?.title || categoryId;

const isWithinLast7Days = (dateValue) => {
  const referenceDate = new Date("2026-05-23T00:00:00");
  const date = new Date(`${dateValue}T00:00:00`);
  const diffDays = Math.floor((referenceDate - date) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-gray-400 focus:border-blue-800 focus:ring-2 focus:ring-blue-100";

const sidebarButton =
  "flex min-h-11 w-full items-center justify-between gap-3 bg-blue-800 px-3.5 py-2.5 text-left text-sm font-semibold text-white shadow-lg transition duration-300 hover:bg-blue-900";

export const Adminpanel = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [attendeeRange, setAttendeeRange] = useState(30);
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(4);
  const [presentEvents, setPresentEvents] = useState(initialPresentEvents);
  const [previousEvents, setPreviousEvents] = useState(initialPreviousEvents);
  const [managedEvents, setManagedEvents] = useState(initialManagedEvents);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [editingManagedEventId, setEditingManagedEventId] = useState(null);
  const [editor, setEditor] = useState(null);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [posts, setPosts] = useState(initialPosts);
  const [promotionClients, setPromotionClients] = useState(initialPromotionClients);
  const dashboardReferenceDate = useMemo(() => {
    const allDates = [...presentEvents, ...previousEvents]
      .map((event) => new Date(`${event.date}T00:00:00`).getTime())
      .filter((time) => !Number.isNaN(time));

    return allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date();
  }, [presentEvents, previousEvents]);

  const handleLogout = () => {
    localStorage.removeItem("viventAuth");
    localStorage.removeItem("viventAuthRole");
    localStorage.removeItem("viventToken");
    localStorage.removeItem("viventUser");
    navigate("/");
    window.location.reload();
  };

  // Load real data from backend
  useEffect(() => {
    // Load all events for present/previous views
    eventsApi.list({ page_size: 200 }).then((res) => {
      const items = res?.items || [];
      const now = new Date();
      const upcoming = items.filter((e) => new Date(e.start_date) >= now);
      const past = items.filter((e) => new Date(e.start_date) < now);
      if (upcoming.length > 0) {
        setPresentEvents(upcoming.map((e, idx) => ({
          ...e,
          id: e.id,
          title: e.title,
          category: e.category,
          date: e.start_date ? new Date(e.start_date).toISOString().split('T')[0] : '',
          time: e.start_date ? new Date(e.start_date).toLocaleTimeString() : '10:00 AM',
          venue: e.location || 'TBD',
          attendees: e.current_participants || 0,
          status: e.status || 'Upcoming',
        })));
      }
      if (past.length > 0) {
        setPreviousEvents(past.map((e) => ({
          ...e,
          id: e.id,
          title: e.title,
          category: e.category,
          date: e.start_date ? new Date(e.start_date).toISOString().split('T')[0] : '',
          time: e.start_date ? new Date(e.start_date).toLocaleTimeString() : '10:00 AM',
          venue: e.location || 'TBD',
          attendees: e.current_participants || 0,
          rating: '5.0',
          status: 'Completed',
        })));
      }
    }).catch(() => {});

    // Load pending events for approval
    adminApi.pendingEvents().then((data) => {
      setPendingEvents(data?.items || data || []);
    }).catch(() => {});
  }, []);

  const handleManagedEventSubmit = (event, form, setForm) => {
    event.preventDefault();

    if (editingManagedEventId) {
      setManagedEvents((current) =>
        current.map((item) =>
          item.id === editingManagedEventId
            ? { ...item, ...form, posts: Number(form.posts) }
            : item
        )
      );
      setEditingManagedEventId(null);
    } else {
      setManagedEvents((current) => [
        {
          id: Date.now(),
          ...form,
          posts: Number(form.posts),
        },
        ...current,
      ]);
    }

    setForm({
      title: "",
      category: "Job Fair",
      company: "",
      venue: "",
      time: "10:00 AM",
      date: "2026-05-22",
      ticketPrice: 0,
      image: "",
      description: "",
      posts: 7,
      status: "Planned",
      plan: "Standard",
    });
  };

  const selectedWindowDays = Number(attendeeRange);

  const withinDashboardWindow = (dateValue) => {
    const eventDate = new Date(`${dateValue}T00:00:00`);
    const diffDays = Math.floor(
      (dashboardReferenceDate - eventDate) / (1000 * 60 * 60 * 24)
    );

    return diffDays >= 0 && diffDays < selectedWindowDays;
  };

  useEffect(() => {
    const clientAnalyticsInterval = setInterval(() => {
      setPromotionClients((current) =>
        current.map((client) => {
          const plan = getPromotionPlan(client);
          const reachStep = client.userType === "business" ? 420 : 260;
          const engagementStep = client.userType === "business" ? 95 : 65;
          const growthStep = client.userType === "business" ? 0.6 : 0.4;

          return {
            ...client,
            reach: Math.min(
              plan.reachTarget,
              client.reach + Math.floor(Math.random() * reachStep)
            ),
            engagement: Math.min(
              plan.engagementTarget,
              client.engagement + Math.floor(Math.random() * engagementStep)
            ),
            growth: Math.min(
              plan.growthTarget,
              Number((client.growth + Math.random() * growthStep).toFixed(1))
            ),
          };
        })
      );
    }, 3000);

    return () => clearInterval(clientAnalyticsInterval);
  }, []);

  const allDashboardEvents = useMemo(
    () => [...presentEvents, ...previousEvents],
    [presentEvents, previousEvents]
  );

  const activeCategory = eventCategories.find((item) => item.id === activeView);
  const categoryEvents = activeCategory
    ? allDashboardEvents.filter((event) => event.category === activeCategory.id)
    : [];

  const filteredPresentEvents = presentEvents.filter((event) =>
    withinDashboardWindow(event.date)
  );

  const filteredPreviousEvents = previousEvents.filter((event) =>
    withinDashboardWindow(event.date)
  );

  const filteredAttendeeEvents = [...presentEvents, ...previousEvents].filter((event) =>
    withinDashboardWindow(event.date)
  );

  const records7DayData = allDashboardEvents.filter((event) =>
    isWithinLast7Days(event.date)
  );

  const stats = [
    {
      label: "Present Events",
      value: filteredPresentEvents.length,
      helper: `${selectedWindowDays} day window`,
    },
    {
      label: "Completed Events",
      value: filteredPreviousEvents.length,
      helper: `${selectedWindowDays} day window`,
    },
    {
      label: "Total Attendees",
      value: filteredAttendeeEvents.reduce(
        (total, event) => total + Number(event.attendees || 0),
        0
      ),
      helper: `${selectedWindowDays} days data`,
      isAttendeeCard: true,
    },
  ];

  const calendarMeta = useMemo(() => {
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const leadingBlanks = firstDay === 0 ? 6 : firstDay - 1;
    const days = Array.from({ length: totalDays }, (_, index) => index + 1);
    const eventsByDate = allDashboardEvents.reduce((acc, event) => {
      const eventDate = new Date(`${event.date}T00:00:00`);
      if (
        eventDate.getFullYear() === Number(calendarYear) &&
        eventDate.getMonth() === Number(calendarMonth)
      ) {
        const day = eventDate.getDate();
        acc[day] = [...(acc[day] || []), event];
      }
      return acc;
    }, {});

    return { days, leadingBlanks, eventsByDate };
  }, [allDashboardEvents, calendarMonth, calendarYear]);

  const openAddEvent = (category = "job-fair") => {
    setEditor({
      mode: "add",
      source: "present",
      values: { ...emptyEvent, category },
    });
  };

  const openEditEvent = (event, source) => {
    setEditor({
      mode: "edit",
      source,
      values: { ...event },
    });
  };

  const closeEditor = () => setEditor(null);

  const requestDeleteEvent = (eventId, source) => {
    setDeleteRequest({ eventId, source });
  };

  const cancelDeleteEvent = () => {
    setDeleteRequest(null);
  };

  const confirmDeleteEvent = () => {
    if (!deleteRequest) return;

    if (deleteRequest.source === "completed") {
      setPreviousEvents((items) =>
        items.filter((item) => item.id !== deleteRequest.eventId)
      );
    } else {
      setPresentEvents((items) =>
        items.filter((item) => item.id !== deleteRequest.eventId)
      );
    }

    setDeleteRequest(null);
  };

  const saveEvent = (event) => {
    const preparedEvent = {
      ...event,
      attendees: Number(event.attendees || 0),
    };

    if (editor.mode === "add") {
      const nextEvent = {
        ...preparedEvent,
        id: Date.now(),
        status: preparedEvent.status || "Upcoming",
      };

      if (nextEvent.status === "Completed") {
        setPreviousEvents((items) => [nextEvent, ...items]);
      } else {
        setPresentEvents((items) => [nextEvent, ...items]);
      }

      closeEditor();
      return;
    }

    const nextEvent = {
      ...preparedEvent,
      status: preparedEvent.status || "Upcoming",
    };

    setPresentEvents((items) => items.filter((item) => item.id !== nextEvent.id));
    setPreviousEvents((items) => items.filter((item) => item.id !== nextEvent.id));

    if (nextEvent.status === "Completed") {
      setPreviousEvents((items) => [
        { ...nextEvent, rating: nextEvent.rating || "5.0" },
        ...items,
      ]);
    } else {
      setPresentEvents((items) => [nextEvent, ...items]);
    }

    closeEditor();
  };

  const updatePostForm = (field, value) => {
    setPostForm((current) => ({ ...current, [field]: value }));
  };

  const togglePostPlatform = (platform) => {
    setPostForm((current) => {
      const isSelected = current.platforms.includes(platform);
      return {
        ...current,
        platforms: isSelected
          ? current.platforms.filter((item) => item !== platform)
          : [...current.platforms, platform],
      };
    });
  };

  const submitPost = (event) => {
    event.preventDefault();
    setPosts((current) => [
      {
        id: Date.now(),
        clientName: postForm.title,
        reach: postForm.tags,
        platforms: postForm.platforms,
      },
      ...current,
    ]);
    setPostForm(emptyPostForm);
  };

  const commitPost = (postId, nextPost) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, ...nextPost } : post))
    );
  };

  const updatePromotionClient = (clientId, field, value) => {
    setPromotionClients((current) =>
      current.map((client) =>
        client.id === clientId
          ? {
              ...client,
              [field]: value,
              ...(field === "userType" ? { plan: "basic" } : {}),
            }
          : client
      )
    );
  };

  const renderEventTable = (
    events,
    source = "present",
    showRating = false,
    compact = false
  ) => (
    <div className="max-w-full overflow-x-auto">
      <table
        className={`w-full border-separate border-spacing-y-2 ${
          compact ? "min-w-[620px]" : "min-w-[720px]"
        }`}
      >
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-black">
            <th className="px-3 py-2">Event</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Attendees</th>
            <th className="px-3 py-2">{showRating ? "Rating" : "Status"}</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={`${event.id}-${event.title}`} className="bg-white shadow-sm">
              <td className="rounded-l-2xl px-3 py-3.5">
                <p className="text-sm font-bold text-black">{event.title}</p>
                <p className="text-xs font-medium text-gray-500">
                  {event.venue || "Past event record"}
                </p>
              </td>
              <td className="px-3 py-3.5 text-sm text-black">
                {getCategoryTitle(event.category)}
              </td>
              <td className="px-3 py-3.5 text-sm text-black">{formatDate(event.date)}</td>
              <td className="px-3 py-3.5 text-sm font-semibold text-black">
                {event.attendees}
              </td>
              <td className="px-3 py-3.5">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-black">
                  {showRating ? `${event.rating} stars` : event.status}
                </span>
              </td>
              <td className="rounded-r-2xl px-3 py-3.5">
                <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-900"
                  onClick={() => openEditEvent(event, source)}
                  type="button"
                >
                  <FaEdit />
                  Edit
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                  onClick={() => requestDeleteEvent(event.id, source)}
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
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-black">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="sidebar-font w-full bg-blue-800 text-white shadow-2xl lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:min-w-72 lg:max-w-72 lg:self-stretch">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="border-b border-blue-700 px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-100">
                  Admin Dashboard
                </p>
              </div>

              <nav className="space-y-3 p-5">
                <button
                  onClick={() => setActiveView("dashboard")}
                  className={sidebarButton}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <FaChartBar />
                    Dashboard
                  </span>
                </button>

                <button
                  onClick={() => setActiveView("calendar")}
                  className={sidebarButton}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <FaCalendarAlt />
                    Calendar
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

                  <div className="space-y-2 pl-3">
                    {eventCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveView(category.id)}
                        className={sidebarButton}
                        type="button"
                      >
                        <span className="text-left">{category.title}</span>
                        <FaChevronRight className="text-xs" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveView("records")}
                  className={sidebarButton}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <FaClipboardList />
                    Records
                  </span>
                </button>

                <button
                  onClick={() => setActiveView("post-management")}
                  className={sidebarButton}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <FaClipboardList />
                    Post Management
                  </span>
                </button>

                <button
                  onClick={() => setActiveView("client-analytics")}
                  className={sidebarButton}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <FaChartBar />
                    Analytics
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

        <main className="min-w-0 flex-1 p-4 lg:p-7">
          <header className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-black">
              Event Control Room
            </p>
          <h2 className="mt-1 text-2xl font-black text-black md:text-3xl">
            {activeCategory
              ? activeCategory.title
              : activeView === "add-event"
                ? "Add Event"
              : activeView === "records"
                ? "Event Records"
                : activeView === "post-management"
                  ? "Post Management"
                  : activeView === "client-analytics"
                    ? "Client Analytics"
                    : activeView === "calendar"
                      ? "Calendar"
                      : "Dashboard"}
          </h2>
          </header>

          {!activeCategory &&
            activeView !== "records" &&
            activeView !== "post-management" &&
            activeView !== "client-analytics" &&
            activeView !== "add-event" &&
            activeView !== "calendar" && (
            <section className="min-w-0 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-black">
                          {item.label}
                        </p>
                        <p className="mt-2 text-3xl font-black text-black">
                          {item.value}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                          {item.helper}
                        </p>
                      </div>
                      {item.isAttendeeCard && (
                        <select
                          className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800 outline-none"
                          onChange={(event) => setAttendeeRange(Number(event.target.value))}
                          value={attendeeRange}
                        >
                          {[7, 15, 21, 30].map((day) => (
                            <option key={day} value={day}>
                              {day} days
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-black">
                      Present Events
                    </h3>
                    <p className="text-sm font-medium text-gray-500">
                      Live and upcoming events in table format.
                    </p>
                  </div>
                  <button
                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-800 px-4 py-3 font-semibold text-white transition hover:bg-blue-900"
                    onClick={() => openAddEvent()}
                    type="button"
                  >
                    <FaPlus />
                    Add Event
                  </button>
                </div>
                {renderEventTable(filteredPresentEvents)}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                    <h3 className="text-xl font-black text-black">
                    Completed Events
                  </h3>
                  <p className="text-sm font-medium text-gray-500">
                    Events that have already finished.
                  </p>
                </div>
                {renderEventTable(filteredPreviousEvents, "completed", true, true)}
              </div>
            </section>
          )}

          {activeView === "add-event" && (
            <AdminAddEventPanel
              editingManagedEventId={editingManagedEventId}
              handleManagedEventSubmit={handleManagedEventSubmit}
              managedEvents={managedEvents}
              setEditingManagedEventId={setEditingManagedEventId}
              setManagedEvents={setManagedEvents}
            />
          )}

          {activeView === "calendar" && (
            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-black">
                      Event Calendar
                    </h3>
                    <p className="text-sm font-medium text-gray-500">
                      Browse scheduled events in a clean calendar layout.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">
                      {presentEvents.length} active events
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                      {previousEvents.length} completed events
                    </span>
                  </div>
                </div>

                <CalendarPanel
                  calendarMeta={calendarMeta}
                  calendarMonth={calendarMonth}
                  calendarYear={calendarYear}
                  setCalendarMonth={setCalendarMonth}
                  setCalendarYear={setCalendarYear}
                />
              </div>
            </section>
          )}

          {activeView === "post-management" && (
            <PostManagement
              commitPost={commitPost}
              postForm={postForm}
              posts={posts}
              submitPost={submitPost}
              togglePostPlatform={togglePostPlatform}
              updatePostForm={updatePostForm}
            />
          )}

          {activeView === "client-analytics" && (
            <ClientAnalytics
              clients={promotionClients}
              updatePromotionClient={updatePromotionClient}
            />
          )}

          {activeView === "records" && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h3 className="text-xl font-black text-black">
                  Records
                </h3>
              </div>
              {records7DayData.length > 0 ? (
                renderEventTable(records7DayData, "present", true, true)
              ) : (
                  <p className="rounded-2xl bg-blue-50 p-5 font-semibold text-black">
                  No event record found for the first 7 days.
                </p>
              )}
            </section>
          )}

          {activeCategory && (
            <section className="space-y-6">
              <div className="max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className={`bg-gradient-to-r ${activeCategory.accent} p-6 text-white`}>
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/80">
                    Add Events
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {activeCategory.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-white/85">
                    {activeCategory.desc}
                  </p>
                </div>

                <div className="min-w-0 gap-5 p-4 sm:p-5">
                  <div className="min-w-0">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-lg font-black text-black">
                          Present {activeCategory.title} Events
                        </h4>
                        <p className="text-sm font-medium text-gray-500">
                          Add or edit this category events.
                        </p>
                      </div>
                      <button
                        className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-800 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
                        onClick={() => openAddEvent(activeCategory.id)}
                        type="button"
                      >
                        <FaPlus />
                        Add
                      </button>
                    </div>
                    {renderEventTable(categoryEvents, "present", false, true)}
                  </div>
                </div>
              </div>
            </section>
          )}

        </main>
      </div>

      {editor && (
        <EventEditor editor={editor} onClose={closeEditor} onSave={saveEvent} />
      )}

      {deleteRequest && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-black text-blue-800">Delete Event?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Do you want to remove this event permanently? Click Yes to delete
              it or No to keep it.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-slate-200"
                onClick={cancelDeleteEvent}
                type="button"
              >
                No
              </button>
              <button
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                onClick={confirmDeleteEvent}
                type="button"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminAddEventPanel = ({
  editingManagedEventId,
  handleManagedEventSubmit,
  managedEvents,
  setEditingManagedEventId,
  setManagedEvents,
}) => {
  const [form, setForm] = useState({
    title: "",
    category: "Job Fair",
    company: "",
    venue: "",
    time: "10:00 AM",
    date: "2026-05-22",
    ticketPrice: 0,
    image: "",
    description: "",
    posts: 7,
    status: "Planned",
    plan: "Standard",
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
              <input
                className={inputClass}
                onChange={(event) => updateField("title", event.target.value)}
                required
                value={form.title}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Company / Brand
              <input
                className={inputClass}
                onChange={(event) => updateField("company", event.target.value)}
                placeholder="Enter company or brand name"
                value={form.company}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Event Category
              <select
                className={inputClass}
                onChange={(event) => updateField("category", event.target.value)}
                value={form.category}
              >
                <option>Job Fair</option>
                <option>Food Event</option>
                <option>Educational Expo</option>
              </select>
            </label>

            <label className="block text-sm font-bold text-black">
              Venue
              <input
                className={inputClass}
                onChange={(event) => updateField("venue", event.target.value)}
                required
                value={form.venue}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Time
              <input
                className={inputClass}
                onChange={(event) => updateField("time", event.target.value)}
                placeholder="10:00 AM"
                value={form.time}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Date
              <input
                className={inputClass}
                onChange={(event) => updateField("date", event.target.value)}
                type="date"
                value={form.date}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Ticket Price
              <input
                className={inputClass}
                min="0"
                onChange={(event) =>
                  updateField("ticketPrice", Number(event.target.value))
                }
                type="number"
                value={form.ticketPrice}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Event Image URL
              <input
                className={inputClass}
                onChange={(event) => updateField("image", event.target.value)}
                placeholder="https://..."
                value={form.image}
              />
            </label>

            <label className="block text-sm font-bold text-black md:col-span-2">
              Description
              <textarea
                className={inputClass}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Short event description..."
                value={form.description}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Planned Posts
              <input
                className={inputClass}
                min="1"
                onChange={(event) => updateField("posts", Number(event.target.value))}
                type="number"
                value={form.posts}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Promotion Plan
              <select
                className={inputClass}
                onChange={(event) => updateField("plan", event.target.value)}
                value={form.plan}
              >
                <option>Basic</option>
                <option>Standard</option>
                <option>Premium</option>
              </select>
            </label>

            <button
              className="h-11 w-full rounded-full bg-blue-800 font-bold text-white transition hover:bg-blue-900"
              type="submit"
            >
              {editingManagedEventId ? "Update Event" : "Save Event"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 xl:mt-10">
          <div className="mb-4">
            <h4 className="text-base font-black text-black">Managed Events</h4>
            <p className="text-sm text-gray-500">
              Event details linked with the social media promotion plan.
            </p>
          </div>

          <div>
            <table className="w-full table-fixed border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-black">
                  <th className="w-[16%] px-2 py-2">Event</th>
                  <th className="w-[13%] px-2 py-2">Category</th>
                  <th className="w-[16%] px-2 py-2">Venue</th>
                  <th className="w-[13%] px-2 py-2">Date</th>
                  <th className="w-[12%] px-2 py-2">Plan</th>
                  <th className="w-[9%] px-2 py-2">Posts</th>
                  <th className="w-[21%] px-2 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {managedEvents.map((event) => (
                  <tr className="bg-slate-50 shadow-sm" key={event.id || event.title}>
                    <td className="rounded-l-2xl px-2 py-3 text-sm font-bold text-black align-top break-words">
                      {event.title}
                    </td>
                    <td className="px-2 py-3 text-sm text-black align-top break-words">
                      {event.category || "Job Fair"}
                    </td>
                    <td className="px-2 py-3 text-sm text-black align-top break-words">
                      {event.venue || "TBD"}
                    </td>
                    <td className="px-2 py-3 text-sm text-black align-top break-words">
                      {event.date || "TBD"}
                    </td>
                    <td className="px-2 py-3 text-sm text-black align-top break-words">
                      {event.plan || "Standard"}
                    </td>
                    <td className="px-2 py-3 text-sm text-black align-top break-words">
                      {event.posts || "7"}
                    </td>
                    <td className="rounded-r-2xl px-2 py-3 align-top">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-900"
                          onClick={() => {
                            setEditingManagedEventId(event.id);
                            setForm({
                              title: event.title || "",
                              category: event.category || "Job Fair",
                              company: event.company || "",
                              venue: event.venue || "",
                              time: event.time || "10:00 AM",
                              date: event.date || "2026-05-22",
                              ticketPrice: event.ticketPrice || 0,
                              image: event.image || "",
                              description: event.description || "",
                              posts: event.posts || 7,
                              status: event.status || "Planned",
                              plan: event.plan || "Standard",
                            });
                          }}
                          type="button"
                        >
                          <FaEdit />
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                          onClick={() => {
                            setManagedEvents((current) =>
                              current.filter((item) => item.id !== event.id)
                            );
                            if (editingManagedEventId === event.id) {
                              setEditingManagedEventId(null);
                              setForm({
                                title: "",
                                category: "Job Fair",
                                company: "",
                                venue: "",
                                time: "10:00 AM",
                                date: "2026-05-22",
                                ticketPrice: 0,
                                image: "",
                                description: "",
                                posts: 7,
                                status: "Planned",
                                plan: "Standard",
                              });
                            }
                          }}
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
          </div>
        </div>
      </form>
    </section>
  );
};

const PostManagement = ({
  commitPost,
  postForm,
  posts,
  submitPost,
  togglePostPlatform,
  updatePostForm,
}) => {
  const [draftPosts, setDraftPosts] = useState(posts);
  const [editingPostId, setEditingPostId] = useState(null);
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    setDraftPosts(posts);
  }, [posts]);

  const renderSocialIcon = (platform) => {
    const iconClass = "text-2xl";

    switch (platform) {
      case "Facebook":
        return <FaFacebook className={`${iconClass} text-blue-600`} />;
      case "Instagram":
        return <FaInstagram className={`${iconClass} text-pink-500`} />;
      case "Tiktok":
        return <FaTiktok className={`${iconClass} text-black`} />;
      case "Linkedin":
        return <FaLinkedin className={`${iconClass} text-sky-700`} />;
      default:
        return (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-800 px-2 text-xs font-black text-white">
            {platform.slice(0, 2)}
          </span>
        );
    }
  };

  const updateDraftPost = (postId, field, value) => {
    setDraftPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, [field]: value } : post
      )
    );
  };

  const applyPost = (postId) => {
    const nextPost = draftPosts.find((post) => post.id === postId);

    if (!nextPost) return;

    commitPost(postId, nextPost);
    setEditingPostId(null);
  };

  const addSocialAccount = () => {
    const socialMediaId = postForm.socialMediaId.trim();
    const password = postForm.password.trim();

    if (!socialMediaId || !password) return;

    setSavedAccounts((current) => [
      {
        id: Date.now(),
        socialMediaId,
        platforms: postForm.platforms,
      },
      ...current,
    ]);

    updatePostForm("socialMediaId", "");
    updatePostForm("password", "");
  };

  return (
    <section className="space-y-8">
      <form
        className="grid gap-5 xl:grid-cols-[minmax(240px,0.9fr)_minmax(320px,1.35fr)]"
        onSubmit={submitPost}
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-black">Post Management</h3>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Keep post details compact and easy to review.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-black">
              Post Title
              <input
                className={inputClass}
                onChange={(event) => updatePostForm("title", event.target.value)}
                placeholder="Typing"
                required
                value={postForm.title}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Description
              <input
                className={inputClass}
                onChange={(event) =>
                  updatePostForm("description", event.target.value)
                }
                placeholder="Typing"
                required
                value={postForm.description}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Tags
              <input
                className={inputClass}
                onChange={(event) => updatePostForm("tags", event.target.value)}
                placeholder="Typing"
                required
                value={postForm.tags}
              />
            </label>

            <div>
              <p className="text-sm font-bold text-black">Picture / Video</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  className="inline-flex h-10 w-28 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white transition hover:bg-blue-900"
                  type="submit"
                >
                  Submit
                </button>

                <label className="inline-flex h-10 w-28 cursor-pointer items-center justify-center gap-2 rounded-full bg-blue-800 text-sm font-bold text-white transition hover:bg-blue-900">
                  <FaUpload />
                  Upload
                  <input
                    className="hidden"
                    onChange={(event) =>
                      updatePostForm(
                        "mediaName",
                        event.target.files?.[0]?.name || ""
                      )
                    }
                    type="file"
                  />
                </label>
              </div>
              {postForm.mediaName && (
                <p className="mt-2 truncate text-xs font-semibold text-gray-500">
                  {postForm.mediaName}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(220px,1fr)_220px]">
          <div className="flex flex-col justify-center space-y-4">
            <label className="block text-sm font-bold text-black">
              Social Media Id
              <input
                className={inputClass}
                onChange={(event) =>
                  updatePostForm("socialMediaId", event.target.value)
                }
                placeholder="Typing"
                required
                value={postForm.socialMediaId}
              />
            </label>

            <label className="block text-sm font-bold text-black">
              Password
              <input
                className={inputClass}
                onChange={(event) =>
                  updatePostForm("password", event.target.value)
                }
                placeholder="Typing"
                required
                type="password"
                value={postForm.password}
              />
            </label>

            <button
              className="mx-auto inline-flex h-10 w-28 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white transition hover:bg-blue-900"
              onClick={addSocialAccount}
              type="button"
            >
              Add
            </button>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-blue-300 p-4">
            <h4 className="mb-3 text-center text-sm font-black text-black">
              Select Platform
            </h4>
            <div className="space-y-3">
              {postPlatforms.map((platform) => (
                <label
                  className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-gray-600"
                  key={platform}
                >
                  <input
                    checked={postForm.platforms.includes(platform)}
                    className="h-5 w-5 accent-blue-800"
                    onChange={() => togglePostPlatform(platform)}
                    type="checkbox"
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>
        </div>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-xl font-black text-black">List of Post</h3>
          <p className="text-sm font-medium text-gray-500">
            Each row is aligned like a clean table for quick edits.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {draftPosts.map((post) => {
            const isEditing = editingPostId === post.id;
            const fieldTextClass = isEditing ? "text-slate-700" : "text-gray-500";

            return (
              <div
                className="grid gap-4 rounded-2xl bg-slate-50 p-4 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(190px,0.9fr)_auto] lg:items-end"
                key={post.id}
              >
                <label className="block text-sm font-bold text-black">
                  Client Name
                  <input
                    className={`${inputClass} ${fieldTextClass} ${isEditing ? "" : "bg-slate-100"}`}
                    onChange={(event) =>
                      updateDraftPost(post.id, "clientName", event.target.value)
                    }
                    placeholder="Typing"
                    readOnly={!isEditing}
                    value={post.clientName}
                  />
                </label>

                <label className="block text-sm font-bold text-black">
                  Reach
                  <input
                    className={`${inputClass} ${fieldTextClass} ${isEditing ? "" : "bg-slate-100"}`}
                    onChange={(event) =>
                      updateDraftPost(post.id, "reach", event.target.value)
                    }
                    placeholder="Typing"
                    readOnly={!isEditing}
                    value={post.reach}
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  {post.platforms.map((platform) => (
                    <span key={`${post.id}-${platform}`}>
                      {renderSocialIcon(platform)}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 lg:justify-end">
                  <button
                    className="flex h-10 w-24 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white transition hover:bg-blue-900"
                    onClick={() => setEditingPostId(post.id)}
                    type="button"
                  >
                    Edit
                  </button>

                  <button
                    className={`flex h-10 w-24 items-center justify-center rounded-full text-sm font-bold text-white transition ${
                      isEditing
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-blue-800 hover:bg-blue-900"
                    }`}
                    onClick={() => applyPost(post.id)}
                    type="button"
                  >
                    Apply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {savedAccounts.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-lg font-black text-black">Saved Accounts</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {savedAccounts.map((account) => (
              <div
                className="rounded-2xl bg-slate-50 p-4"
                key={account.id}
              >
                <p className="text-sm font-black text-black">
                  {account.socialMediaId}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {account.platforms.map((platform) => (
                    <span
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800"
                      key={`${account.id}-${platform}`}
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const ClientAnalytics = ({ clients, updatePromotionClient }) => {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const selectedClient =
    clients.find((client) => client.id === Number(selectedClientId)) || clients[0];
  const selectedPlan = getPromotionPlan(selectedClient);
  const availablePlans = promotionPlans[selectedClient.userType];

  const report = useMemo(() => {
    if (!selectedClient) {
      return [];
    }

    return [
      {
        label: "Engagement",
        value: selectedClient.engagement,
        target: selectedPlan.engagementTarget,
        suffix: "",
      },
      {
        label: "Reach",
        value: selectedClient.reach,
        target: selectedPlan.reachTarget,
        suffix: "",
      },
      {
        label: "Growth",
        value: selectedClient.growth,
        target: selectedPlan.growthTarget,
        suffix: "%",
      },
    ].map((item) => ({
      ...item,
      percent: Math.min(Math.round((Number(item.value) / Number(item.target)) * 100), 100),
    }));
  }, [selectedClient, selectedPlan]);

  const platformReport = useMemo(() => {
    if (!selectedClient) {
      return [];
    }

    const platforms = ["Facebook", "Instagram", "Linkedin", "Tiktok"];
    const platformCount = platforms.length;

    return platforms.map((platform, index) => {
      const multiplier = 1 - index * 0.08;
      return {
        platform,
        reach: Math.round((selectedClient.reach / platformCount) * multiplier),
        engagement: Math.round(
          (selectedClient.engagement / platformCount) * multiplier
        ),
      };
    });
  }, [selectedClient]);

  if (!selectedClient) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-bold text-black">No client analytics found.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_190px_220px_180px]">
          <label className="block text-sm font-bold text-black">
            Client
            <select
              className={inputClass}
              onChange={(event) => setSelectedClientId(event.target.value)}
              value={selectedClient.id}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-bold text-black">
            User Type
            <select
              className={inputClass}
              onChange={(event) =>
                updatePromotionClient(
                  selectedClient.id,
                  "userType",
                  event.target.value
                )
              }
              value={selectedClient.userType}
            >
              <option value="student">Student</option>
              <option value="business">Business</option>
            </select>
          </label>

          <label className="block text-sm font-bold text-black">
            Promotion Plan
            <select
              className={inputClass}
              onChange={(event) =>
                updatePromotionClient(selectedClient.id, "plan", event.target.value)
              }
              value={selectedClient.plan}
            >
              {Object.entries(availablePlans).map(([planId, plan]) => (
                <option key={planId} value={planId}>
                  {plan.title}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-black">
              Duration
            </p>
            <p className="mt-1 text-2xl font-black text-black">
              {selectedPlan.duration}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-black">
              {selectedClient.name}
            </h3>
            <p className="text-sm font-semibold text-gray-500">
              {selectedClient.userType === "student"
                ? "Student social media plan analytics"
                : "Business social media promotion analytics"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold capitalize text-black">
              {selectedClient.userType} user
            </span>
            <span className="rounded-full bg-blue-800 px-4 py-2 text-sm font-bold text-white">
              {selectedPlan.postsTarget} planned posts
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {report.map((item) => (
          <div
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            key={item.label}
          >
            <p className="text-sm font-bold text-black">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-black">
              {item.value.toLocaleString()}
              {item.suffix}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              Goal {item.target.toLocaleString()}
              {item.suffix}
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-blue-800 transition-all duration-700"
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-bold text-black">
              {item.percent}% completed
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-black">
              Social Media Report
            </h3>
            <p className="text-sm font-medium text-gray-500">
              Facebook, Instagram, LinkedIn, and TikTok report only.
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-black">
            {platformReport.length} channels
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {platformReport.map((item) => (
            <article
              className="rounded-2xl bg-slate-50 p-4 shadow-sm"
              key={item.platform}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-black">
                  {item.platform}
                </p>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-black">
                  Active
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    Reach
                  </p>
                  <p className="mt-1 text-xl font-black text-black">
                    {item.reach.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    Engagement
                  </p>
                  <p className="mt-1 text-xl font-black text-black">
                    {item.engagement.toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const CalendarPanel = ({
  calendarMeta,
  calendarMonth,
  calendarYear,
  setCalendarMonth,
  setCalendarYear,
}) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
    <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-5 py-5 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blue-100">
            Event Calendar
          </p>
          <h3 className="mt-2 text-2xl font-black">
            {months[calendarMonth]} {calendarYear}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/90">
            Browse scheduled events in a modern calendar layout. Hover any active
            date to reveal the event details.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur">
            {calendarMeta.days.length} days
          </span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur">
            Active dates highlighted
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <select
          className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none backdrop-blur focus:border-white/30"
          onChange={(event) => setCalendarYear(Number(event.target.value))}
          value={calendarYear}
        >
          {years.map((year) => (
            <option key={year} value={year} className="text-slate-900">
              {year}
            </option>
          ))}
        </select>

        <select
          className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none backdrop-blur focus:border-white/30"
          onChange={(event) => setCalendarMonth(Number(event.target.value))}
          value={calendarMonth}
        >
          {months.map((month, index) => (
            <option key={month} value={index} className="text-slate-900">
              {month}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="bg-slate-50 px-5 py-5">
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-blue-800">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {Array.from({ length: calendarMeta.leadingBlanks }).map((_, index) => (
          <div key={`blank-${index}`} />
        ))}

        {calendarMeta.days.map((day) => {
          const dayEvents = calendarMeta.eventsByDate[day] || [];
          const hasEvents = dayEvents.length > 0;

          return (
            <div key={day} className="group relative">
              <button
                className={`flex min-h-14 w-full items-center justify-center rounded-2xl border text-sm font-black transition duration-300 ${
                  hasEvents
                    ? "border-blue-800 bg-blue-800 text-white shadow-lg hover:-translate-y-0.5 hover:bg-blue-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                }`}
                type="button"
              >
                <span>{day}</span>
                {hasEvents && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                )}
              </button>

              {hasEvents && (
                <div className="pointer-events-none absolute right-0 top-[3.7rem] z-20 hidden w-72 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl group-hover:block">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-black">
                    {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                  </p>
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border-t border-slate-100 py-2 first:border-t-0"
                    >
                      <p className="font-bold text-black">{event.title}</p>
                      <p className="text-xs font-medium text-gray-500">
                        {event.venue} at {event.time}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const EventEditor = ({ editor, onClose, onSave }) => {
  const [form, setForm] = useState(editor.values);
  const isCompleted = editor.source === "completed";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
      <form
        className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-black">
              {editor.mode === "add" ? "Add Event" : "Edit Event"}
            </p>
            <h3 className="mt-1 text-2xl font-black text-black">
              Event Details
            </h3>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-800 transition hover:bg-blue-100"
            onClick={onClose}
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-bold text-black">
            Event Title
            <input
              className={inputClass}
              onChange={(event) => updateField("title", event.target.value)}
              required
              value={form.title}
            />
          </label>

          <label className="space-y-2 text-sm font-bold text-black">
            Category
            <select
              className={inputClass}
              onChange={(event) => updateField("category", event.target.value)}
              value={form.category}
            >
              {eventCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-bold text-black">
            Date
            <input
              className={inputClass}
              onChange={(event) => updateField("date", event.target.value)}
              required
              type="date"
              value={form.date}
            />
          </label>

          <label className="space-y-2 text-sm font-bold text-black">
            Time
            <input
              className={inputClass}
              onChange={(event) => updateField("time", event.target.value)}
              required
              value={form.time}
            />
          </label>

          <label className="space-y-2 text-sm font-bold text-black">
            Location
            <input
              className={inputClass}
              onChange={(event) => updateField("venue", event.target.value)}
              required
              value={form.venue}
            />
          </label>

          <label className="space-y-2 text-sm font-bold text-black">
            Attendees
            <input
              className={inputClass}
              min="0"
              onChange={(event) => updateField("attendees", event.target.value)}
              required
              type="number"
              value={form.attendees}
            />
          </label>

          <label className="space-y-2 text-sm font-bold text-black">
            Status
            <select
              className={inputClass}
              onChange={(event) => updateField("status", event.target.value)}
              value={form.status}
            >
              <option value="Live">Live</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          {isCompleted && (
            <label className="space-y-2 text-sm font-bold text-black">
              Rating
              <input
                className={inputClass}
                onChange={(event) => updateField("rating", event.target.value)}
                value={form.rating}
              />
            </label>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-slate-200"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900"
            type="submit"
          >
            Save Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default Adminpanel;
