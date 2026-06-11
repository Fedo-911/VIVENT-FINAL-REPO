import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronDown, FaBell, FaUserCircle, FaUserShield, FaUserGraduate, FaStore } from "react-icons/fa";

const Header = ({ isAuthenticated, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();

  const notifications = [
    "Event pages are connected to the dashboard.",
    "Post management edits can now be applied from the list.",
    "Report filters update from the selected client plan.",
    "Completed events are shown in records and tables.",
  ];

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
          <Link to="/">
            <h2 className="text-2xl font-bold tracking-wide text-blue-800">
              VIVENT
            </h2>
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

              <div className="relative">
                <button
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-800 shadow-sm transition hover:bg-blue-50"
                  onClick={() =>
                    setOpenDropdown((value) =>
                      value === "notifications" ? null : "notifications"
                    )
                  }
                  type="button"
                >
                  <FaBell />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                </button>

                {openDropdown === "notifications" && (
                  <div className="absolute right-0 z-50 mt-4 w-80 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl">
                    <div className="bg-blue-900 px-5 py-4">
                      <h3 className="text-lg font-bold text-white">Notifications</h3>
                      <p className="mt-1 text-sm text-blue-100">
                        Recent actions and dashboard updates
                      </p>
                    </div>
                    <div className="max-h-72 space-y-3 overflow-auto p-4">
                      {notifications.map((item, index) => (
                        <div
                          className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900"
                          key={item}
                        >
                          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                  <div className="absolute right-0 z-50 mt-4 min-h-[28rem] w-72 overflow-hidden rounded-3xl border border-blue-800 bg-blue-900 shadow-2xl animate-fadeIn">
                    <div className="border-b border-blue-800 bg-blue-950 p-5">
                      <h3 className="text-xl font-bold text-white">Profile Menu</h3>
                      <p className="mt-1 text-sm text-gray-300">
                        Manage your VIVENT account
                      </p>
                    </div>

                    <div className="flex min-h-[calc(28rem-82px)] flex-col justify-between p-4">
                      <div className="space-y-4">
                        <Link
                          className="flex h-14 w-full items-center gap-4 rounded-2xl bg-blue-800 px-5 text-white shadow-lg transition duration-300 hover:scale-105 hover:bg-blue-900"
                          onClick={closeAll}
                          to="/adminpanel"
                        >
                          <FaUserShield className="text-xl text-pink-200" />
                          <span className="text-lg font-semibold">Admin Panel</span>
                        </Link>

                        <Link
                          className="flex h-14 w-full items-center gap-4 rounded-2xl bg-blue-800 px-5 text-white shadow-lg transition duration-300 hover:scale-105 hover:bg-blue-900"
                          onClick={closeAll}
                          to="/studentpanel"
                        >
                          <FaUserGraduate className="text-xl text-green-200" />
                          <span className="text-lg font-semibold">Student Panel</span>
                        </Link>

                        <Link
                          className="flex h-14 w-full items-center gap-4 rounded-2xl bg-blue-800 px-5 text-white shadow-lg transition duration-300 hover:scale-105 hover:bg-blue-900"
                          onClick={closeAll}
                          to="/businesspanel"
                        >
                          <FaStore className="text-xl text-orange-200" />
                          <span className="text-lg font-semibold">Business Panel</span>
                        </Link>
                      </div>

                      {isAuthenticated && (
                        <button
                          className="h-14 w-full rounded-2xl bg-blue-800 px-5 text-lg font-semibold text-white shadow-lg transition duration-300 hover:bg-blue-900"
                          onClick={handleLogout}
                          type="button"
                        >
                          Logout
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
