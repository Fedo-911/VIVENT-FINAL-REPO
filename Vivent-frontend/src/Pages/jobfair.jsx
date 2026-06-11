import React, { useEffect, useMemo, useState } from "react";
import { FaBriefcase, FaMapMarkerAlt } from "react-icons/fa";
import { eventsApi, registrationsApi, paymentsApi } from "../utils/api";

const initialApplication = {
  applicantName: "",
  email: "",
  phone: "",
  currentRole: "",
  cvLink: "",
  cvFileName: "",
  coverLetter: "",
};

const Jobfair = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentResult, setPaymentResult] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationForm, setApplicationForm] = useState(initialApplication);
  const [submitting, setSubmitting] = useState(false);
  const [registeredIds, setRegisteredIds] = useState(new Set());

  // Load approved job_fair events from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    eventsApi
      .list({ category: "job_fair", status: "approved", page_size: 100 })
      .then((res) => {
        if (!cancelled) {
          setEvents(res?.items || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load events.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!paymentResult) return undefined;
    const timer = setTimeout(() => setPaymentResult(""), 3000);
    return () => clearTimeout(timer);
  }, [paymentResult]);

  const selectedJobLabel = useMemo(() => {
    if (!selectedJob) return "";
    return selectedJob.title;
  }, [selectedJob]);

  const updateField = (field, value) => {
    setApplicationForm((current) => ({ ...current, [field]: value }));
  };

  const handleCvFileChange = (file) => {
    updateField("cvFileName", file?.name || "");
    updateField("cvLink", file?.name ? `Uploaded file: ${file.name}` : "");
  };

  const closeModal = () => {
    setSelectedJob(null);
    setApplicationForm(initialApplication);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    setSubmitting(true);
    try {
      // Register for the event on the backend
      await registrationsApi.register(selectedJob.id, "participant");
      setRegisteredIds((prev) => new Set([...prev, selectedJob.id]));
      setPaymentResult(`${selectedJob.title} — registration submitted successfully!`);
    } catch (err) {
      setPaymentResult(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
      closeModal();
    }
  };

  // Normalize event fields from backend response
  const normalizeEvent = (item) => ({
    ...item,
    company: item.venue_details?.company || item.location || "Company",
    location: item.location,
    ticketPrice: item.venue_details?.ticket_price || 0,
    image:
      item.venue_details?.image_url ||
      "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1974",
    description: item.description,
  });

  return (
    <div className="bg-gray-100">
      <section
        className="relative flex min-h-[560px] items-center py-40 text-white"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/70" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <p className="mb-4 font-semibold tracking-[4px] text-white">
            JOB FAIR EVENTS
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
            Connect Students With Career Opportunities
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-200">
            Explore professional job fairs, internship opportunities, networking
            sessions, and career development programs organized through the VIVENT
            platform.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mb-14 px-6 text-center">
          <p className="mb-3 font-semibold tracking-[3px] text-blue-800">
            INTERNSHIP PROGRAMS
          </p>
          <h2 className="mb-5 text-4xl font-bold text-blue-800 md:text-5xl">
            Apply For Internships
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-gray-600">
            Students can apply for internships and connect directly with companies
            through our smart event management platform.
          </p>
        </div>

        <div className="mx-auto max-w-5xl space-y-5 px-6">
          {loading && (
            <div className="rounded-2xl bg-white p-8 text-center text-blue-800 shadow-md">
              Loading job fair events…
            </div>
          )}
          {error && (
            <div className="rounded-2xl bg-red-50 p-8 text-center text-red-600 shadow-md">
              {error}
            </div>
          )}
          {!loading && !error && events.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-md">
              No job fair events available at this time.
            </div>
          )}
          {!loading &&
            events.map((rawItem) => {
              const item = normalizeEvent(rawItem);
              const isRegistered = registeredIds.has(item.id);
              return (
                <article
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:shadow-xl"
                  key={item.id}
                >
                  <div className="flex flex-col items-center lg:flex-row">
                    <div className="relative w-full overflow-hidden lg:w-[35%]">
                      <img
                        alt={item.title}
                        className="h-[190px] w-full object-cover transition duration-500 group-hover:scale-105"
                        src={item.image}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    <div className="w-full p-5 lg:w-[65%] lg:p-7">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-blue-800">
                        <FaBriefcase />
                        <span className="text-xs font-semibold">
                          Internship Opportunity
                        </span>
                      </div>

                      <h2 className="mb-3 text-2xl font-bold leading-snug text-blue-800 md:text-3xl">
                        {item.title}
                      </h2>
                      <p className="mb-3 text-base font-medium text-black-800 md:text-lg">
                        {item.company}
                      </p>

                      <div className="mb-4 flex items-center gap-3 text-black-500">
                        <FaMapMarkerAlt className="text-lg text-pink-500" />
                        <span className="text-sm md:text-base">{item.location}</span>
                      </div>

                      <div className="mb-5 flex items-center gap-4">
                        <div className="flex -space-x-3">
                          <img
                            alt=""
                            src="https://randomuser.me/api/portraits/men/32.jpg"
                            className="h-11 w-11 rounded-full border-4 border-white"
                          />
                          <img
                            alt=""
                            src="https://randomuser.me/api/portraits/women/44.jpg"
                            className="h-11 w-11 rounded-full border-4 border-white"
                          />
                          <img
                            alt=""
                            src="https://randomuser.me/api/portraits/men/41.jpg"
                            className="h-11 w-11 rounded-full border-4 border-white"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-blue-800 md:text-base">
                            Hiring Recruiters
                          </h4>
                          <p className="text-xs text-black-500 md:text-sm">
                            Professional HR Teams
                          </p>
                        </div>
                      </div>

                      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-black-500 md:text-base">
                        {item.description ||
                          "Join our premium internship programs and connect with top companies through VIVENT. Build professional skills, gain real-world experience, and grow your career network."}
                      </p>

                      <div className="flex flex-wrap gap-3">
                        <button
                          className={`min-w-32 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 ${
                            isRegistered
                              ? "cursor-default bg-emerald-600 hover:bg-emerald-700"
                              : "bg-blue-800 hover:bg-blue-900"
                          }`}
                          onClick={() => {
                            if (isRegistered) return;
                            setSelectedJob(item);
                            setApplicationForm(initialApplication);
                          }}
                          disabled={isRegistered}
                          type="button"
                        >
                          {isRegistered ? "Registered" : "Apply Now"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      {paymentResult && (
        <div className="fixed bottom-24 right-5 z-[80] rounded-2xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-2xl">
          {paymentResult}
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/70 p-3">
          <form
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl md:p-5"
            onSubmit={submitApplication}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-800">
                  Job Application
                </p>
                <h3 className="mt-2 text-lg font-black text-slate-900 md:text-xl">
                  {selectedJobLabel}
                </h3>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-800 transition hover:bg-blue-100"
                onClick={closeModal}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-bold text-blue-800">
                Full Name
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-800"
                  onChange={(e) => updateField("applicantName", e.target.value)}
                  required
                  value={applicationForm.applicantName}
                />
              </label>

              <label className="block text-sm font-bold text-blue-800">
                Email
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-800"
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  type="email"
                  value={applicationForm.email}
                />
              </label>

              <label className="block text-sm font-bold text-blue-800">
                Phone
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-800"
                  onChange={(e) => updateField("phone", e.target.value)}
                  required
                  value={applicationForm.phone}
                />
              </label>

              <label className="block text-sm font-bold text-blue-800">
                Current Role
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-black placeholder:text-black outline-none focus:border-blue-800"
                  onChange={(e) => updateField("currentRole", e.target.value)}
                  placeholder="Student, graduate, developer..."
                  value={applicationForm.currentRole}
                />
              </label>

              <label className="block text-sm font-bold text-blue-800 md:col-span-2">
                Upload CV
                <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                  <input
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-800 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-900"
                    onChange={(e) => handleCvFileChange(e.target.files?.[0])}
                    type="file"
                  />
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    Upload from mobile or computer storage. PDF, DOC, DOCX, JPG, or PNG.
                  </p>
                  {applicationForm.cvFileName && (
                    <p className="mt-2 text-xs font-semibold text-black">
                      Selected: {applicationForm.cvFileName}
                    </p>
                  )}
                </div>
              </label>

              <label className="block text-sm font-bold text-blue-800 md:col-span-2">
                Cover Letter
                <textarea
                  className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-800"
                  onChange={(e) => updateField("coverLetter", e.target.value)}
                  placeholder="Tell us why you're a good fit..."
                  value={applicationForm.coverLetter}
                />
              </label>
            </div>

            <div className="sticky bottom-0 mt-4 flex flex-col gap-3 bg-white pt-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                onClick={closeModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-blue-800 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-60"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Jobfair;
