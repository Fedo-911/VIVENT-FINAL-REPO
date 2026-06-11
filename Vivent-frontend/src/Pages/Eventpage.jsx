import React from "react";
import { Link } from "react-router-dom";

const Eventpage = () => {
  return (
    <div className="bg-white">
      {/* EVENTS HERO - PREMIUM */}
      <section
        className="relative flex min-h-[560px] items-center overflow-hidden py-40 text-white"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1505373877841-8d25f7d46678')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-900/70 to-blue-900/70" />
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <p className="mb-4 font-semibold tracking-widest text-white">
            OUR EVENTS
          </p>

          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
            Explore Our Professional Events
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white">
            Discover job fairs, food festivals, and educational expos designed to
            connect people, build careers, and create meaningful experiences.
          </p>
        </div>
      </section>

      {/* EVENT SCHEDULE SECTION */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-16 text-center text-4xl font-bold text-blue-800">
            Information of Events
          </h2>

          <div className="grid items-stretch gap-10 md:grid-cols-3">
            <Link to="/jobfair" className="h-full">
              <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">
                <div className="relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-110"
                    alt="Job Fair"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-7 text-center">
                  <div className="mx-auto -mt-12 mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-900 text-xl text-white">
                    💼
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-blue-900">
                    Job Fair 2026
                  </h3>
                  <p className="flex-1 text-sm leading-relaxed text-gray-500">
                    A professional networking event where students meet top companies,
                    attend interviews, submit CVs, and explore real career opportunities.
                  </p>
                  <button className="mt-6 rounded-lg bg-blue-800 px-5 py-2 text-white transition hover:bg-blue-900">
                    Explore Event
                  </button>
                </div>
              </div>
            </Link>

            <Link to="/foodevents" className="h-full">
              <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">
                <div className="relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1551024601-bec78aea704b"
                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-110"
                    alt="Food Events"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-7 text-center">
                  <div className="mx-auto -mt-12 mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-900 text-xl text-white">
                    🍽️
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-blue-900">
                    Food Events
                  </h3>
                  <p className="flex-1 text-sm leading-relaxed text-gray-500">
                    A cultural food experience featuring live cooking, diverse cuisines,
                    tasting sessions, and entertainment for food lovers.
                  </p>
                  <button className="mt-6 rounded-lg bg-blue-800 px-5 py-2 text-white transition hover:bg-blue-900">
                    Explore Event
                  </button>
                </div>
              </div>
            </Link>

            <Link to="/educationalexpo" className="h-full">
              <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">
                <div className="relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b"
                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-110"
                    alt="Educational Expo"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-7 text-center">
                  <div className="mx-auto -mt-12 mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-900 text-xl text-white">
                    🎓
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-blue-900">
                    Educational Expo
                  </h3>
                  <p className="flex-1 text-sm leading-relaxed text-gray-500">
                    An academic event connecting students with universities,
                    scholarships, career counseling, and future study opportunities.
                  </p>
                  <button className="mt-6 rounded-lg bg-blue-800 px-5 py-2 text-white transition hover:bg-blue-900">
                    Explore Event
                  </button>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* EXPERIENCE / BANNER SECTION */}
      <section
        className="relative py-32 text-white"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1511578314322-379afb476865')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/85" />

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <p className="mb-4 font-semibold tracking-widest text-white">
            GET EXPERIENCE
          </p>

          <h2 className="mb-6 max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
            Transform Your Events into Powerful Experiences
          </h2>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-blue-100">
            Our event management platform helps you organize, promote, and manage
            professional events like job fairs, educational expos, and conferences.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Eventpage;
