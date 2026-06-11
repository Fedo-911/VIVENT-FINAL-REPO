import React from "react";
import {
  FaEnvelope,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaFacebookF,
  FaPaperPlane,
} from "react-icons/fa";

export const Contact = () => {
  return (
    <div className="bg-[#f4f7fc] min-h-screen">
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800 leading-tight mb-5">
            Get In Touch
          </h1>

          <p className="text-gray-600 text-lg leading-relaxed">
            We would love to hear from you. Send us a message, connect on
            social media, or drop us an email and our team will get back to you
            soon.
          </p>
        </div>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          {/* LEFT SIDE */}
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] p-6 shadow-xl border border-blue-100">
              <h2 className="text-xl font-bold text-blue-800 mb-5">
                Social Media
              </h2>

              <div className="space-y-3">
                {[
                  {
                    icon: <FaFacebookF />,
                    label: "Facebook",
                    handle: "Viventplatform",
                    href: "https://www.facebook.com/share/1Ft32wUfWm/",
                    className: "bg-blue-50 text-blue-800 border border-blue-100",
                  },
                  {
                    icon: <FaTiktok />,
                    label: "TikTok",
                    handle: "@vivent_web",
                    href: "https://www.tiktok.com/@vivent_web",
                    className:
                      "bg-slate-50 text-slate-700 border border-slate-200",
                  },
                  {
                    icon: <FaLinkedinIn />,
                    label: "LinkedIn",
                    handle: "@vivent-web",
                    href: "https://www.linkedin.com/in/vivent-web",
                    className: "bg-sky-50 text-sky-700 border border-sky-100",
                  },
                  {
                    icon: <FaInstagram />,
                    label: "Instagram",
                    handle: "@vivent_web",
                    href: "https://www.instagram.com/vivent_web",
                    className:
                      "bg-pink-50 text-pink-600 border border-pink-100",
                  },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`group flex items-center gap-3 rounded-3xl px-4 py-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${item.className}`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base shadow-sm transition group-hover:scale-110">
                      {item.icon}
                    </span>
                    <div className="flex flex-1 flex-col items-start">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-xs font-medium text-gray-500">
                        {item.handle}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                  <FaEnvelope />
                </div>
                <h2 className="text-xl font-bold text-blue-800">Our Email</h2>
              </div>

              <p className="text-gray-600 text-lg break-all font-medium">
                viventweb@gmail.com
              </p>
            </div>
          </div>

          {/* RIGHT SIDE FORM */}
          <div className="bg-white rounded-[36px] shadow-2xl border border-blue-100 p-6 md:p-7">
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full rounded-2xl border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-800 outline-none transition focus:border-blue-800 focus:bg-white"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full rounded-2xl border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-800 outline-none transition focus:border-blue-800 focus:bg-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="w-full rounded-2xl border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-800 outline-none transition focus:border-blue-800 focus:bg-white"
                />

                <select
                  className="w-full rounded-2xl border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-700 outline-none transition focus:border-blue-800 focus:bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Service
                  </option>
                  <option>Job Fair Event</option>
                  <option>Food Festival Event</option>
                  <option>Educational Expo</option>
                  <option>General Inquiry</option>
                </select>
              </div>

              <textarea
                rows="4"
                placeholder="Write Your Message"
                className="w-full rounded-[28px] border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-800 outline-none transition focus:border-blue-800 focus:bg-white resize-none"
              ></textarea>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-blue-800 px-7 py-4 font-semibold text-white shadow-xl transition-all duration-300 hover:bg-blue-900 hover:scale-[1.02]"
              >
                Send Message
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
