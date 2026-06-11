import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
const Home = () => {
  return (
    <div className="bg-white text-gray-800 transition-colors duration-500">
      {/* HERO */}
      <section
        className="relative min-h-[540px] overflow-hidden py-28 text-center text-white flex items-center transition-all duration-700"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(15,23,42,0.4), rgba(30,64,175,0.75)), url('https://images.unsplash.com/photo-1560439514-4e9645039924')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-blue-950/40" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 transition-all duration-700 ease-out">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-blue-100/90 transition-all duration-700 hover:tracking-[0.5em]">
            Smart Event Management
          </p>
          <h1 className="mb-4 text-4xl font-bold leading-tight transition duration-700 md:text-6xl hover:-translate-y-1">
            Plan smart. Host unforgettable events.
          </h1>

          <p className="mx-auto max-w-2xl text-base text-gray-100 transition duration-700 md:text-lg hover:text-white">
            Manage job fairs, food festivals, and expos in one clean platform.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex min-w-40 items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-blue-900 transition duration-300 hover:bg-blue-100"
            >
              Get Started
            </Link>
            <Link
              to="/about"
              className="inline-flex min-w-40 items-center justify-center rounded-full border border-white/40 bg-transparent px-6 py-3 font-semibold text-white transition duration-300 hover:bg-white/10"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* EVENT CATEGORIES - IMAGE + DETAIL SECTION */}
      <section className="bg-gray-100 py-16 transition-all duration-500">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
          {/* LEFT SIDE IMAGES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 row-span-2 overflow-hidden rounded-[30px]">
              <img
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df"
                alt="Job Fair"
                className="h-[320px] w-full object-cover md:h-[360px]"
              />
            </div>

            <div className="overflow-hidden rounded-[30px]">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644"
                alt="Expo"
                className="h-[150px] w-full object-cover md:h-[170px]"
              />
            </div>

            <div className="overflow-hidden rounded-[30px]">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836"
                alt="Food Event"
                className="h-[150px] w-full object-cover md:h-[170px]"
              />
            </div>
          </div>

          {/* RIGHT SIDE CONTENT */}
          <div className="transition-all duration-500">
            <h2 className="mb-5 text-3xl font-bold leading-snug text-blue-800 transition duration-300 md:text-4xl">
              Reasons to Participate in Our Event Program
            </h2>

            <p className="mb-6 text-base leading-relaxed text-gray-600 transition duration-300 md:text-lg">
              Attend professional job fairs, educational expos, and food festivals.
              Our platform connects you with opportunities, knowledge, and
              entertainment all in one place.
            </p>

            {/* FEATURES */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 transition duration-300 hover:-translate-y-1">
                <div className="rounded-lg bg-purple-100 p-3 text-lg text-pink-500 transition duration-300 hover:scale-105">
                  01
                </div>
                <div>
                  <h4 className="text-base font-semibold text-blue-800">
                    6,000+ Meetup
                  </h4>
                  <p className="text-xs text-gray-600">Networking events</p>
                </div>
              </div>

              <div className="flex items-start gap-3 transition duration-300 hover:-translate-y-1">
                <div className="rounded-lg bg-purple-100 p-3 text-lg text-pink-500 transition duration-300 hover:scale-105">
                  02
                </div>
                <div>
                  <h4 className="text-base font-semibold text-blue-800">
                    Career Growth
                  </h4>
                  <p className="text-xs text-gray-600">Meet recruiters</p>
                </div>
              </div>

              <div className="flex items-start gap-3 transition duration-300 hover:-translate-y-1">
                <div className="rounded-lg bg-purple-100 p-3 text-lg text-pink-500 transition duration-300 hover:scale-105">
                  03
                </div>
                <div>
                  <h4 className="text-base font-semibold text-blue-800">
                    Education
                  </h4>
                  <p className="text-xs text-gray-600">Explore universities</p>
                </div>
              </div>

              <div className="flex items-start gap-3 transition duration-300 hover:-translate-y-1">
                <div className="rounded-lg bg-purple-100 p-3 text-lg text-pink-500 transition duration-300 hover:scale-105">
                  04
                </div>
                <div>
                  <h4 className="text-base font-semibold text-blue-800">
                    Food Events
                  </h4>
                  <p className="text-xs text-gray-600">Cultural festivals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE / BANNER SECTION */}
      <section
        className="relative py-32 text-white transition-all duration-700"
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

          <h2 className="mb-6 max-w-2xl text-4xl font-bold leading-tight text-white md:text-6xl">
            Transform Your Events into Powerful Experiences
          </h2>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-blue-100">
            Our event management platform helps you organize, promote, and manage
            professional events like job fairs, educational expos, and conferences.
          </p>

        </div>
      </section>

      {/* WHAT YOU WILL GET */}
      <section className="bg-gray-100 py-24 transition-all duration-500">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="mb-3 font-semibold tracking-widest text-blue-800">
            OUR BENEFITS
          </p>

          <h2 className="mb-16 text-4xl font-bold text-blue-800 md:text-5xl">
            What You Will Get
          </h2>

          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                title: "Event Planning",
                img: "https://images.unsplash.com/photo-1553877522-43269d4ea984",
                icon: "01",
                desc: "Explore modern digital strategies and creative ideas that help you design impactful and successful events with better audience engagement and innovation.",
              },
              {
                title: "Networking",
                img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
                icon: "02",
                desc: "Connect with professionals, students, and industry experts to build strong relationships, share ideas, and expand your professional network.",
              },
              {
                title: "AutoPost AI",
                img: "https://images.unsplash.com/photo-1552664730-d307ca884978",
                icon: "03",
                desc: "Use AI driven marketing ideas to create smarter content, improve reach, and promote events with better targeting and engagement.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-7 text-center">
                  <div className="mx-auto -mt-12 mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-900 text-lg font-bold text-white shadow-md transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                    {item.icon}
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-blue-800">
                    {item.title}
                  </h3>

                  <p className="flex-1 text-sm leading-relaxed text-gray-600">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL MEDIA PLANS */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-100 py-24 transition-all duration-500">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mb-16 text-4xl font-bold tracking-wide text-blue-800 md:text-5xl">
            Social Media Promotion Plans
          </h2>

          <div className="grid items-stretch gap-10 md:grid-cols-3">
            {/* BASIC */}
            <div className="h-full rounded-2xl bg-gradient-to-br from-blue-200 to-blue-400 p-[2px] transition duration-300">
              <div className="flex h-full min-h-[420px] flex-col justify-between rounded-2xl bg-white p-8 shadow-md transition hover:shadow-2xl">
                <h3 className="mb-6 text-2xl font-bold text-blue-800">Basic</h3>

                <ul className="mb-6 space-y-3 text-left text-sm text-gray-600">
                  <li>✓ Social Media Strategy</li>
                  <li>✓ Content Creation</li>
                  <li>✓ Facebook & Instagram</li>
                  <li>✓ 10 Posts on Social Media</li>
                  <li>✓ Basic Custom Integrations</li>
                </ul>

                <div className="mb-6 flex justify-center gap-5 text-lg text-gray-500">
                  <FaFacebook className="cursor-pointer transition hover:scale-125 hover:text-blue-700" />
                  <FaInstagram className="cursor-pointer transition hover:scale-125 hover:text-pink-600" />
                </div>

                <button className="mt-auto rounded-lg bg-blue-800 px-5 py-2 text-white shadow-md transition hover:bg-blue-900">
                  Choose Plan
                </button>
              </div>
            </div>

            {/* STANDARD */}
            <div className="h-full rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 p-[2px] transition duration-300">
              <div className="flex h-full min-h-[420px] flex-col justify-between rounded-2xl border border-blue-200 bg-white p-8 shadow-xl">
                <h3 className="mb-6 text-2xl font-bold text-blue-800">Standard</h3>

                <ul className="mb-6 space-y-3 text-left text-sm text-gray-600">
                  <li>✓ Social Media Strategy</li>
                  <li>✓ Content Creation</li>
                  <li>✓ Facebook, Instagram</li>
                  <li>✓ Additional TikTok</li>
                  <li>✓ 15 Posts on Social Media</li>
                </ul>

                <div className="mb-6 flex justify-center gap-5 text-lg text-gray-500">
                  <FaFacebook className="cursor-pointer transition hover:scale-125 hover:text-blue-700" />
                  <FaInstagram className="cursor-pointer transition hover:scale-125 hover:text-pink-600" />
                  <FaTiktok className="cursor-pointer transition hover:scale-125 hover:text-black" />
                </div>

                <button className="mt-auto rounded-lg bg-blue-800 px-5 py-2 text-white shadow-md transition hover:bg-blue-900">
                  Most Popular
                </button>
              </div>
            </div>

            {/* PREMIUM */}
            <div className="h-full rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-700 p-[2px] transition duration-300">
              <div className="flex h-full min-h-[420px] flex-col justify-between rounded-2xl bg-white p-8 shadow-md transition hover:shadow-2xl">
                <h3 className="mb-6 text-2xl font-bold text-blue-800">Premium</h3>

                <ul className="mb-6 space-y-3 text-left text-sm text-gray-600">
                  <li>✓ Social Media Strategy</li>
                  <li>✓ Content Creation</li>
                  <li>✓ Facebook, Instagram</li>
                  <li>✓ LinkedIn Integration</li>
                  <li>✓ 20 Posts on Social Media</li>
                </ul>

                <div className="mb-6 flex justify-center gap-5 text-lg text-gray-500">
                  <FaFacebook className="cursor-pointer transition hover:scale-125 hover:text-blue-700" />
                  <FaInstagram className="cursor-pointer transition hover:scale-125 hover:text-pink-600" />
                  <FaLinkedin className="cursor-pointer transition hover:scale-125 hover:text-blue-800" />
                  <FaTiktok className="cursor-pointer transition hover:scale-125 hover:text-black" />
                </div>

                <button className="mt-auto rounded-lg bg-blue-800 px-5 py-2 text-white shadow-md transition hover:bg-blue-900">
                  Go Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
export default Home;
