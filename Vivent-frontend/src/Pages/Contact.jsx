import React, { useRef, useState } from "react";
import {
  FaEnvelope,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaFacebookF,
  FaPaperPlane,
} from "react-icons/fa";
import { contactApi } from "../utils/api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  service: "",
  message: "",
};

const serviceOptions = [
  "General Inquiry",
  "Event Registration",
  "Business Partnership",
  "Technical Support",
  "Payment Issue",
  "Event Promotion",
  "Feedback",
  "Other",
];

const validateContactForm = (form) => {
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const message = form.message.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?\d+$/;

  if (name.length < 3) return "Name must be at least 3 characters.";
  if (!emailPattern.test(email)) return "Please enter a valid email address.";
  if (!phonePattern.test(phone)) return "Phone number can only include digits and an optional leading +.";
  if (phone.replace(/^\+/, "").length < 10) return "Phone number must include at least 10 digits.";
  if (!form.service) return "Please select a service.";
  if (message.length < 20) return "Message must be at least 20 characters.";
  if (message.length > 1000) return "Message must be 1000 characters or fewer.";
  return "";
};

export const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const activeSubmission = useRef(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4200);
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (activeSubmission.current) return;

    const validationMessage = validateContactForm(form);
    if (validationMessage) {
      showToast("error", validationMessage);
      return;
    }

    activeSubmission.current = true;
    setIsSubmitting(true);
    try {
      await contactApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        service: form.service,
        message: form.message.trim(),
      });
      setForm(initialForm);
      showToast(
        "success",
        "Thank you! Your message has been sent successfully. Our team will contact you soon."
      );
    } catch {
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      activeSubmission.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f4f7fc] min-h-screen">
      {toast && (
        <div
          className={`fixed right-5 top-24 z-50 max-w-sm rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-2xl ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}
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
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  aria-label="Your Name"
                  autoComplete="name"
                  disabled={isSubmitting}
                  minLength={3}
                  onChange={(event) => updateField("name", event.target.value)}
                  type="text"
                  placeholder="Your Name"
                  required
                  value={form.name}
                  className="w-full rounded-2xl border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-800 outline-none transition focus:border-blue-800 focus:bg-white"
                />

                <input
                  aria-label="Email Address"
                  autoComplete="email"
                  disabled={isSubmitting}
                  onChange={(event) => updateField("email", event.target.value)}
                  type="email"
                  placeholder="Email Address"
                  required
                  value={form.email}
                  className="w-full rounded-2xl border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-800 outline-none transition focus:border-blue-800 focus:bg-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  aria-label="Phone Number"
                  autoComplete="tel"
                  disabled={isSubmitting}
                  inputMode="tel"
                  onChange={(event) => updateField("phone", event.target.value)}
                  pattern="^\+?\d+$"
                  type="text"
                  placeholder="Phone Number"
                  required
                  value={form.phone}
                  className="w-full rounded-2xl border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-800 outline-none transition focus:border-blue-800 focus:bg-white"
                />

                <select
                  aria-label="Select Service"
                  className="w-full rounded-2xl border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-700 outline-none transition focus:border-blue-800 focus:bg-white"
                  disabled={isSubmitting}
                  onChange={(event) => updateField("service", event.target.value)}
                  required
                  value={form.service}
                >
                  <option value="" disabled>
                    Select Service
                  </option>
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                aria-label="Write Your Message"
                disabled={isSubmitting}
                maxLength={1000}
                minLength={20}
                onChange={(event) => updateField("message", event.target.value)}
                rows="4"
                placeholder="Write Your Message"
                required
                value={form.message}
                className="w-full rounded-[28px] border border-gray-200 bg-[#f9fbff] px-5 py-3.5 text-gray-800 outline-none transition focus:border-blue-800 focus:bg-white resize-none"
              ></textarea>

              <button
                disabled={isSubmitting}
                type="submit"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-blue-800 px-7 py-4 font-semibold text-white shadow-xl transition-all duration-300 hover:bg-blue-900 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:scale-100"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                {isSubmitting ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  />
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
