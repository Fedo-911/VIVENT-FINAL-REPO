import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronDown, FaBell, FaUserCircle, FaUserGraduate, FaStore, FaUserShield } from "react-icons/fa";
import { notificationsApi } from "../utils/api";
import viventLogo from "../assets/vivent-logo.png";

const dashboardByRole = {
  admin: {
    label: "VIVENT Admin",
    path: "/adminpanel",
    icon: FaUserShield,
    iconClass: "text-blue-200",
  },
  student: {
    label: "Student Panel",
    path: "/studentpanel",
    icon: FaUserGraduate,
    iconClass: "text-green-200",
  },
  business: {
    label: "Business Panel",
    path: "/businesspanel",
    icon: FaStore,
    iconClass: "text-orange-200",
  },
};

const readCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("viventUser") || "{}");
  } catch {
    return {};
  }
};

const relativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return "Yesterday";
  return `${Math.floor(seconds / 86400)} days ago`;
};

const Header = ({ isAuthenticated, currentRole, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const navigate = useNavigate();
  const currentUser = readCurrentUser();
  const activeRole = currentRole || currentUser.role || "";
  const dashboard = dashboardByRole[activeRole];

  const loadNotifications = useCallback(async ({ showLoading = false } = {}) => {
    if (!isAuthenticated) return;
    if (showLoading) setNotificationsLoading(true);
    try {
      const [items, unread] = await Promise.all([notificationsApi.list(), notificationsApi.unreadCount()]);
      setNotifications(items);
      setHasMoreNotifications(items.length === 20);
      setUnreadCount(unread.count || 0);
      setNotificationsError("");
    } catch (error) {
      setNotificationsError(error.message || "Could not load notifications.");
    } finally {
      if (showLoading) setNotificationsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }
    loadNotifications();
    const timer = window.setInterval(() => loadNotifications(), 30000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, loadNotifications]);

  const toggleNotifications = () => {
    const opening = openDropdown !== "notifications";
    setOpenDropdown(opening ? "notifications" : null);
    if (opening) loadNotifications({ showLoading: true });
  };

  const markRead = async (notification) => {
    if (notification.is_read) return;
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
    try { await notificationsApi.markRead(notification.id); } catch { loadNotifications(); }
  };

  const openNotification = async (notification) => {
    await markRead(notification);
    setOpenDropdown(null);
    if (notification.type === "contact_reply" && notification.reference_id) {
      navigate(`/contact-history?inquiry=${encodeURIComponent(notification.reference_id)}`);
    }
  };

  const deleteNotification = async (event, id) => {
    event.stopPropagation();
    setNotifications((items) => items.filter((item) => item.id !== id));
    try { await notificationsApi.delete(id); loadNotifications(); } catch { loadNotifications(); }
  };

  const markAllRead = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
    try { await notificationsApi.markAllRead(); } catch { loadNotifications(); }
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all notifications? This cannot be undone.")) return;
    try { await notificationsApi.clearAll(); setNotifications([]); setUnreadCount(0); } catch (error) { setNotificationsError(error.message || "Could not clear notifications."); }
  };

  const loadOlderNotifications = async () => {
    if (loadingOlder || !hasMoreNotifications) return;
    setLoadingOlder(true);
    try {
      const older = await notificationsApi.list({ limit: 20, offset: notifications.length });
      setNotifications((items) => [...items, ...older.filter((item) => !items.some((existing) => existing.id === item.id))]);
      setHasMoreNotifications(older.length === 20);
    } catch (error) {
      setNotificationsError(error.message || "Could not load older notifications.");
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleNotificationScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 16) loadOlderNotifications();
  };

  const handleLogout = () => {
    onLogout();
    setOpenDropdown(null);
    setIsMenuOpen(false);
    navigate("/");
  };

  const closeAll = () => setOpenDropdown(null);

  return (
    <header className="sticky top-0 z-50 border-b border-blue-100 bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-4">
          <Link aria-label="Vivent home" className="flex items-center" to="/">
            <img
              alt="Vivent"
              className="h-11 w-auto object-contain"
              src={viventLogo}
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <nav>
              <ul className="flex items-center gap-6 font-medium text-gray-700">
                <li>
                  <Link className="transition hover:text-blue-900" to="/">
                    Home
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-blue-900" to="/events">
                    Events
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-blue-900" to="/jobfair">
                    Job Fair
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-blue-900" to="/foodevents">
                    Food Events
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-blue-900" to="/educationalexpo">
                    Educational Expo
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-blue-900" to="/about">
                    About
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-blue-900" to="/contact">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="flex items-center gap-4">
              {!isAuthenticated && (
                <>
                  <Link
                    className="inline-flex h-10 w-20 items-center justify-center rounded-xl bg-blue-800 text-sm font-medium text-white shadow-md transition hover:bg-blue-900"
                    to="/signup"
                  >
                    Sign Up
                  </Link>
                  <Link
                    className="inline-flex h-10 w-20 items-center justify-center rounded-xl border border-blue-700 text-sm font-medium text-blue-800 transition hover:bg-blue-50"
                    to="/login"
                  >
                    Login
                  </Link>
                </>
              )}

              {isAuthenticated && <div className="relative">
                <button
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-800 shadow-sm transition hover:bg-blue-50"
                  onClick={toggleNotifications}
                  type="button"
                >
                  <FaBell />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-xs font-bold leading-5 text-white" aria-label={`${unreadCount} unread notifications`}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
                </button>

                {openDropdown === "notifications" && (
                  <div className="absolute right-0 z-50 mt-4 w-80 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl">
                    <div className="bg-blue-900 px-5 py-4">
                      <h3 className="text-lg font-bold text-white">Notifications</h3>
                      <div className="mt-1 flex items-center justify-between gap-2 text-sm text-blue-100"><span>Recent activity</span>{unreadCount > 0 && <button className="text-xs font-semibold underline" onClick={markAllRead} type="button">Mark all read</button>}</div>
                    </div>
                    <div className="max-h-72 space-y-3 overflow-auto p-4" onScroll={handleNotificationScroll}>
                      {notificationsLoading && <p className="px-2 py-3 text-sm text-gray-500">Loading notifications…</p>}
                      {!notificationsLoading && notificationsError && <p className="px-2 py-3 text-sm text-red-600">{notificationsError}</p>}
                      {!notificationsLoading && !notificationsError && notifications.length === 0 && <p className="px-2 py-5 text-center text-sm text-gray-500">You’re all caught up! No new notifications.</p>}
                      {notifications.map((item) => <button className={`relative w-full rounded-2xl px-4 py-3 pr-9 text-left text-sm text-blue-900 ${item.is_read ? "bg-white" : "bg-blue-50 font-medium"}`} key={item.id} onClick={() => openNotification(item)} type="button"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white"><FaBell /></span><span className="font-semibold">{item.title}</span><span className="mt-1 block text-xs text-gray-600">{item.message}</span><span className="mt-1 block text-xs text-gray-400">{relativeTime(item.created_at)}</span>{!item.is_read && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500" />}<span aria-label="Delete notification" className="absolute bottom-3 right-3 text-xs text-gray-400 hover:text-red-600" onClick={(event) => deleteNotification(event, item.id)}>×</span></button>)}
                      {loadingOlder && <p className="text-center text-xs text-gray-500">Loading older notifications…</p>}
                      {notifications.length > 0 && <button className="w-full text-center text-xs font-semibold text-blue-800 hover:underline" onClick={clearAll} type="button">Clear all</button>}
                    </div>
                  </div>
                )}
              </div>}

              {isAuthenticated && (
                <div className="relative">
                  <button
                    className="inline-flex h-10 w-20 items-center justify-center gap-1 rounded-xl bg-blue-800 text-white shadow-lg transition hover:bg-blue-900"
                    onClick={() =>
                      setOpenDropdown((value) => (value === "profile" ? null : "profile"))
                    }
                    type="button"
                  >
                    <FaUserCircle className="text-xl" />
                    <FaChevronDown
                      className={`text-sm transition-transform duration-300 ${
                        openDropdown === "profile" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openDropdown === "profile" && (
                    <div className="absolute right-0 z-50 mt-4 w-72 overflow-hidden rounded-3xl border border-blue-800 bg-blue-900 shadow-2xl animate-fadeIn">
                      <div className="border-b border-blue-800 bg-blue-950 p-5">
                        <h3 className="text-xl font-bold text-white">Profile Menu</h3>
                        <p className="mt-1 text-sm text-gray-300">
                          {currentUser.full_name || currentUser.email || "Current user"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-4 p-4">
                        {dashboard && (
                          <Link
                            aria-label={activeRole === "admin" ? "Go to Admin Dashboard" : `Go to ${dashboard.label}`}
                            className="flex h-14 w-full items-center gap-4 rounded-2xl bg-blue-800 px-5 text-white shadow-lg transition duration-300 hover:scale-105 hover:bg-blue-900"
                            onClick={closeAll}
                            to={dashboard.path}
                          >
                            <dashboard.icon className={`text-xl ${dashboard.iconClass}`} />
                            <span className="text-lg font-semibold">{dashboard.label}</span>
                          </Link>
                        )}

                        {activeRole !== "admin" && (
                          <Link
                            className="flex h-12 w-full items-center rounded-2xl bg-blue-800 px-5 text-base font-semibold text-white shadow-lg transition hover:bg-blue-900"
                            onClick={closeAll}
                            to="/contact-history"
                          >
                            Contact History
                          </Link>
                        )}

                        <button
                          className="h-14 w-full rounded-2xl bg-blue-800 px-5 text-lg font-semibold text-white shadow-lg transition duration-300 hover:bg-blue-900"
                          onClick={handleLogout}
                          type="button"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="cursor-pointer md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="space-y-1">
                <span className="block h-0.5 w-6 bg-blue-800" />
                <span className="block h-0.5 w-6 bg-blue-800" />
                <span className="block h-0.5 w-6 bg-blue-800" />
              </div>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="pb-6 md:hidden">
            <ul className="space-y-4 font-medium text-gray-700">
              <li>
                <Link className="hover:text-blue-900" onClick={() => setIsMenuOpen(false)} to="/">
                  Home
                </Link>
              </li>
              <li className="space-y-3">
                <p className="font-semibold text-blue-900">Events</p>
                <div className="ml-4 space-y-3">
                  <Link
                    className="block px-5 py-4 font-medium text-gray-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-900"
                    onClick={() => setIsMenuOpen(false)}
                    to="/jobfair"
                  >
                    Job Fair
                  </Link>
                  <Link
                    className="block px-5 py-4 font-medium text-gray-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-900"
                    onClick={() => setIsMenuOpen(false)}
                    to="/foodevents"
                  >
                    Food Events
                  </Link>
                  <Link
                    className="block px-5 py-4 font-medium text-gray-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-900"
                    onClick={() => setIsMenuOpen(false)}
                    to="/educationalexpo"
                  >
                    Educational Expo
                  </Link>
                </div>
              </li>
              <li>
                <Link className="hover:text-blue-900" onClick={() => setIsMenuOpen(false)} to="/about">
                  About
                </Link>
              </li>
              <li>
                <Link className="hover:text-blue-900" onClick={() => setIsMenuOpen(false)} to="/contact">
                  Contact
                </Link>
              </li>
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              {!isAuthenticated && (
                <>
                  <Link
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-800 font-medium text-white transition hover:bg-blue-900"
                    onClick={() => setIsMenuOpen(false)}
                    to="/signup"
                  >
                    Sign Up
                  </Link>
                  <Link
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-blue-800 text-blue-800 transition font-medium hover:bg-blue-50"
                    onClick={() => setIsMenuOpen(false)}
                    to="/login"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
