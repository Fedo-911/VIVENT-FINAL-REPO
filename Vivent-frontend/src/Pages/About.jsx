import React from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaCalendarCheck,
  FaGlobe,
  FaHandshake,
} from "react-icons/fa";

export const About = () => {
  return (
    <div className="bg-gradient-to-br from-slate-100 to-blue-50 min-h-screen">
      {/* HERO SECTION */}
      <section
        className="relative min-h-[560px] overflow-hidden py-40 text-white flex items-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1974&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-blue-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-950/70 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center px-6">
          <div>
            <p className="text-blue-300 text-lg font-semibold mb-4 tracking-widest uppercase">
              About VIVENT
            </p>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-white">
              Smart Event
              <br />
              Management Platform
            </h1>

            <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-2xl">
              VIVENT is a premium web-based event management system designed to
              simplify event planning, promotion, and management for students,
              businesses, and administrators. Our platform helps users manage
              events efficiently with modern dashboards and social media
              integrations.
            </p>

            <div className="flex flex-wrap gap-5">
              <Link
                className="bg-blue-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-900 transition-all duration-300 shadow-2xl"
                to="/events"
              >
                Explore Events
              </Link>

              <Link
                className="border border-white text-white px-8 py-4 rounded-2xl font-bold hover:bg-white hover:text-blue-900 transition-all duration-300"
                to="/contact"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop"
              alt="Event management team"
              className="rounded-[40px] shadow-2xl w-full h-[500px] object-cover border border-white/20"
            />

            <div className="absolute -bottom-8 -left-6 bg-white/95 backdrop-blur text-blue-800 p-6 rounded-3xl shadow-2xl w-[240px]">
              <h2 className="text-4xl font-extrabold">500+</h2>
              <p className="text-gray-600 mt-2">Successful Events Managed</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-blue-800 mb-5">
            Why Choose VIVENT
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            A modern platform designed to provide premium event experiences
            with smooth management, social promotion, and user-friendly
            dashboards.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
          {[
            {
              icon: <FaCalendarCheck />,
              title: "Event Management",
              desc: "Manage educational expos, food festivals, business expos, and job fairs easily.",
            },
            {
              icon: <FaUsers />,
              title: "User Dashboards",
              desc: "Dedicated dashboards for admins, students, and business owners.",
            },
            {
              icon: <FaGlobe />,
              title: "AI Based Marketing",
              desc: "Boost event visibility with Facebook, Instagram, TikTok, and LinkedIn integrations.",
            },
            {
              icon: <FaHandshake />,
              title: "Business Networking",
              desc: "Connect students, companies, startups, and event organizers together.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-[35px] p-8 shadow-2xl hover:-translate-y-3 hover:shadow-blue-200 transition-all duration-500 border border-blue-100"
            >
              <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center text-4xl text-blue-800 mb-6">
                {item.icon}
              </div>

              <h3 className="text-2xl font-bold text-blue-800 mb-4">
                {item.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="bg-white py-24 px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[40px] shadow-2xl ring-1 ring-blue-100">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1974&auto=format&fit=crop"
              alt="Team collaboration"
              className="h-[460px] w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 via-transparent to-transparent" />
          </div>

          <div className="max-w-2xl lg:pl-4">
            <p className="text-blue-800 font-bold uppercase tracking-widest mb-4">
              Our Mission
            </p>

            <h2 className="text-4xl font-extrabold text-blue-800 mb-5 leading-tight md:text-5xl">
              Creating Better Event Experiences
            </h2>

            <p className="text-gray-600 text-base leading-8 mb-8 md:text-lg">
              Our mission is to provide a centralized platform where users can
              discover, manage, and promote events easily. VIVENT focuses on
              improving communication, engagement, and digital event management
              for educational and business sectors.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm font-semibold text-gray-700 shadow-lg">
                Easy event management system
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm font-semibold text-gray-700 shadow-lg">
                Premium responsive dashboards
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm font-semibold text-gray-700 shadow-lg">
                Real-time event promotions
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
