import React, { useEffect, useState } from "react";
import { FaGraduationCap, FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { eventsApi, registrationsApi, paymentsApi } from "../utils/api";
import { mergeCompletedFallbacks } from "../data/completedEvents";

const initialExpoForm = {
  attendeeName: "",
  email: "",
  phone: "",
  institution: "",
  educationLevel: "",
  programInterest: "",
  preferredDestination: "",
  notes: "",
};

const expoValidationMessages = {
  institution: "Please select your institution.",
  educationLevel: "Please select your education level.",
  programInterest: "Please select your program interest.",
  preferredDestination: "Please select your preferred destination.",
  notes: "Notes are required.",
};

const Educationalexpo = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentResult, setPaymentResult] = useState("");
  const [paidEventIds, setPaidEventIds] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [joinForm, setJoinForm] = useState(initialExpoForm);
  const [joinFormErrors, setJoinFormErrors] = useState({});
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const ticketText = React.useMemo(() => {
    if (!selectedTicket) return "";
    if (!Number.isFinite(selectedTicket.ticket_price)) return "Price unavailable";
    return `PKR ${selectedTicket.ticket_price.toLocaleString("en-PK")}`;
  }, [selectedTicket]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    eventsApi
      .listByStatuses({
        category: "educational",
        statuses: ["approved", "completed"],
        page_size: 100,
      })
      .then((res) => {
        if (!cancelled) {
          setEvents(mergeCompletedFallbacks(res?.items || [], "educational"));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load educational expo events.");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    Promise.all([paymentsApi.myPayments(), registrationsApi.myRegistrations()])
      .then(([payments, registrations]) => {
        if (cancelled) return;
        setPaidEventIds(
          new Set(
            (payments || [])
              .filter((payment) => payment.status === "completed")
              .map((payment) => payment.event_id)
          )
        );
        setRegisteredIds(new Set((registrations || []).map((registration) => registration.event_id)));
      })
      .catch(() => {
        if (!cancelled) {
          setPaymentResult("Could not refresh your ticket and registration status.");
        }
      });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentResult("Ticket purchased successfully. You can now register for this event.");
      params.delete("payment");
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

  useEffect(() => {
    if (!paymentResult) return undefined;
    const timer = setTimeout(() => setPaymentResult(""), 3000);
    return () => clearTimeout(timer);
  }, [paymentResult]);

  const updateField = (field, value) => {
    setJoinForm((current) => ({ ...current, [field]: value }));
    setJoinFormErrors((current) => {
      if (!current[field] || !value.trim()) return current;
      const { [field]: _removedError, ...remainingErrors } = current;
      return remainingErrors;
    });
  };

  const closeJoinForm = () => {
    setSelectedEvent(null);
    setJoinForm(initialExpoForm);
    setJoinFormErrors({});
  };

  const submitExpoJoin = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const validationErrors = Object.entries(expoValidationMessages).reduce(
      (errors, [field, message]) => {
        if (!joinForm[field].trim()) errors[field] = message;
        return errors;
      },
      {}
    );
    if (Object.keys(validationErrors).length > 0) {
      setJoinFormErrors(validationErrors);
      return;
    }

    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }

    setSubmitting(true);
    try {
      await registrationsApi.register(selectedEvent.id, "participant");
      setRegisteredIds((prev) => new Set([...prev, selectedEvent.id]));
      setPaymentResult("Registration successful! You have joined the event.");
    } catch (err) {
      if (err.message?.toLowerCase().includes("already registered")) {
        setRegisteredIds((prev) => new Set([...prev, selectedEvent.id]));
        setPaymentResult(`${selectedEvent.title} is already joined.`);
      } else {
        setPaymentResult(`Error: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
      closeJoinForm();
    }
  };

  const requireLogin = () => {
    setPaymentResult("You need to log in to register or purchase a ticket.");
    navigate("/login", { state: { from: location } });
  };

  const handlePayConfirm = async () => {
    if (!selectedTicket) return;
    if (!Number.isFinite(selectedTicket.ticket_price)) {
      setPaymentResult("This event does not have a ticket price yet.");
      return;
    }
    setPayingId(selectedTicket.id);
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?payment=success`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}?payment=cancelled`;
      const session = await paymentsApi.createStripeCheckoutSession(
        selectedTicket.id,
        returnUrl,
        cancelUrl
      );
      window.location.assign(session.checkout_url);
    } catch (err) {
      setPaymentResult(`Payment error: ${err.message}`);
      setPayingId(null);
      setSelectedTicket(null);
      setShowPaymentConfirm(false);
    }
  };

  const normalizeEvent = (item) => ({
    ...item,
    company: item.venue_details?.company || item.location || "Institution",
    location: item.location,
    image:
      item.venue_details?.image_url ||
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022",
  });

  return (
    <div className="bg-gray-100">
      <section
        className="relative min-h-[560px] py-40 text-white flex items-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/75" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <p className="mb-4 font-semibold tracking-[4px] text-white">
            EDUCATIONAL EXPO EVENTS
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
            Discover Future Learning Opportunities
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-200">
            Explore educational expos, university showcases, career counseling
            sessions, and scholarship opportunities through the VIVENT platform.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mb-14 px-6 text-center">
          <p className="mb-3 font-semibold tracking-[3px] text-blue-800">
            EDUCATIONAL EXPOS
          </p>
          <h2 className="mb-5 text-4xl font-bold text-blue-800 md:text-5xl">
            Explore Educational Opportunities
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-gray-600">
            Connect with universities, institutions, mentors, and career experts
            through modern educational expos.
          </p>
        </div>

        <div className="mx-auto max-w-5xl space-y-5 px-6">
          {loading && (
            <div className="rounded-2xl bg-white p-8 text-center text-blue-800 shadow-md">
              Loading educational expo events…
            </div>
          )}
          {error && (
            <div className="rounded-2xl bg-red-50 p-8 text-center text-red-600 shadow-md">
              {error}
            </div>
          )}
          {!loading && !error && events.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-md">
              No educational expo events available at this time.
            </div>
          )}
          {!loading &&
            events.map((rawItem) => {
              const item = normalizeEvent(rawItem);
              const isRegistered = registeredIds.has(item.id);
              const isPaid = paidEventIds.has(item.id);
              const isCompleted = item.status === "completed";
              const hasTicketPrice = Number.isFinite(item.ticket_price);
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
                        <FaGraduationCap />
                        <span className="text-xs font-semibold">Educational Expo Event</span>
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
                          <img alt="" src="https://randomuser.me/api/portraits/men/32.jpg" className="h-11 w-11 rounded-full border-4 border-white" />
                          <img alt="" src="https://randomuser.me/api/portraits/women/44.jpg" className="h-11 w-11 rounded-full border-4 border-white" />
                          <img alt="" src="https://randomuser.me/api/portraits/men/41.jpg" className="h-11 w-11 rounded-full border-4 border-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-blue-800 md:text-base">Students & Mentors</h4>
                          <p className="text-xs text-black-500 md:text-sm">Educational Communities</p>
                        </div>
                      </div>

                      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-black-500 md:text-base">
                        {item.description ||
                          "Explore universities, scholarships, technology programs, and career opportunities through VIVENT educational expos. Connect with mentors and build your academic future."}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          className={`min-w-32 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 ${
                            isCompleted
                              ? "cursor-default bg-slate-500 hover:bg-slate-500"
                              : isRegistered
                              ? "cursor-default bg-emerald-600 hover:bg-emerald-700"
                              : "bg-blue-800 hover:bg-blue-900"
                          }`}
                          onClick={() => {
                            if (isCompleted) return;
                            if (isRegistered) return;
                            if (!isAuthenticated) return requireLogin();
                            if (!isPaid) {
                              setPaymentResult("Please purchase a ticket before registering for this event.");
                              return;
                            }
                            setPaymentResult("");
                            setSelectedEvent(item);
                            setJoinForm(initialExpoForm);
                            setJoinFormErrors({});
                          }}
                          disabled={isCompleted || isRegistered}
                          type="button"
                        >
                          {isCompleted ? "Completed" : isRegistered ? "Already Registered" : !isAuthenticated ? "Login to Register" : "Register"}
                        </button>
                        <button
                          className="min-w-32 rounded-full border border-blue-800 px-6 py-3 text-sm font-semibold text-blue-800 transition duration-300 hover:bg-blue-50"
                          onClick={() => {
                            if (!isAuthenticated) return requireLogin();
                            if (isPaid) return;
                            if (isCompleted) {
                              setPaymentResult("This expo has already been completed.");
                              return;
                            }
                            if (!hasTicketPrice) {
                              setPaymentResult("Ticket price is unavailable for this event.");
                              return;
                            }
                            setPaymentResult("");
                            setSelectedTicket(item);
                            setShowPaymentConfirm(false);
                          }}
                          disabled={isPaid || isCompleted || !hasTicketPrice}
                          type="button"
                        >
                          {isCompleted ? "Closed" : isPaid ? "Purchased" : !isAuthenticated ? "Login to Purchase" : "Purchase Ticket"}
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

      {selectedTicket && !showPaymentConfirm && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-800">Ticket Price</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{selectedTicket.title}</h3>
              </div>
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-800 transition hover:bg-blue-100" onClick={() => { setSelectedTicket(null); setShowPaymentConfirm(false); }} type="button">
                <FaTimes />
              </button>
            </div>
            <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-center">
              <p className="text-sm font-semibold text-blue-800">Price</p>
              <p className="mt-1 text-3xl font-black text-blue-900">{ticketText}</p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200" onClick={() => { setSelectedTicket(null); setShowPaymentConfirm(false); }} type="button">Cancel</button>
              <button className="rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900" onClick={() => setShowPaymentConfirm(true)} type="button">Pay</button>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && showPaymentConfirm && (
        <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-black text-blue-800">Confirm Payment?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Do you want to pay {ticketText} for {selectedTicket.title}?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200" onClick={() => setShowPaymentConfirm(false)} type="button">Cancel</button>
              <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60" onClick={handlePayConfirm} disabled={payingId === selectedTicket?.id} type="button">
                {payingId === selectedTicket?.id ? "Processing…" : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/70 p-3">
          <form
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl md:p-5"
            noValidate
            onSubmit={submitExpoJoin}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-800">Educational Expo Form</p>
                <h3 className="mt-2 text-lg font-black text-slate-900 md:text-xl">{selectedEvent.title}</h3>
              </div>
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-800 transition hover:bg-blue-100" onClick={closeJoinForm} type="button">
                <FaTimes />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block min-w-0 text-sm font-bold text-blue-800" htmlFor="expo-full-name">Full Name<input className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-black placeholder:text-black/60 outline-none focus:border-blue-800" id="expo-full-name" onChange={(e) => updateField("attendeeName", e.target.value)} required value={joinForm.attendeeName} /></label>
              <label className="block min-w-0 text-sm font-bold text-blue-800" htmlFor="expo-email">Email<input className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-black placeholder:text-black/60 outline-none focus:border-blue-800" id="expo-email" onChange={(e) => updateField("email", e.target.value)} required type="email" value={joinForm.email} /></label>
              <label className="block min-w-0 text-sm font-bold text-blue-800" htmlFor="expo-phone">Phone<input className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-black placeholder:text-black/60 outline-none focus:border-blue-800" id="expo-phone" onChange={(e) => updateField("phone", e.target.value)} required value={joinForm.phone} /></label>
              <label className="block min-w-0 text-sm font-bold text-blue-800" htmlFor="expo-institution">Institution <span aria-hidden="true" className="text-red-500">*</span><select aria-describedby={joinFormErrors.institution ? "expo-institution-error" : undefined} aria-invalid={Boolean(joinFormErrors.institution)} className={`mt-2 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 pr-10 outline-none focus:border-blue-800 ${joinForm.institution ? "text-black" : "text-black/60"}`} id="expo-institution" onChange={(e) => updateField("institution", e.target.value)} required value={joinForm.institution}><option disabled value="">Select your institution</option><option>University of the Punjab</option><option>FAST-NUCES</option><option>COMSATS University</option><option>UET Lahore</option><option>LUMS</option><option>NUST</option><option>GCU Lahore</option><option>UCP</option><option>UMT</option><option>Superior University</option><option>Beaconhouse National University</option><option>Other</option></select>{joinFormErrors.institution && <span className="mt-1 block text-xs font-medium text-red-500" id="expo-institution-error">{joinFormErrors.institution}</span>}</label>
              <label className="block min-w-0 text-sm font-bold text-blue-800" htmlFor="expo-education-level">Education Level <span aria-hidden="true" className="text-red-500">*</span><select aria-describedby={joinFormErrors.educationLevel ? "expo-education-level-error" : undefined} aria-invalid={Boolean(joinFormErrors.educationLevel)} className={`mt-2 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 pr-10 outline-none focus:border-blue-800 ${joinForm.educationLevel ? "text-black" : "text-black/60"}`} id="expo-education-level" onChange={(e) => updateField("educationLevel", e.target.value)} required value={joinForm.educationLevel}><option disabled value="">Select your education level</option><option>Matric</option><option>Intermediate</option><option>Bachelor's</option><option>Master's</option><option>MPhil</option><option>PhD</option><option>Other</option></select>{joinFormErrors.educationLevel && <span className="mt-1 block text-xs font-medium text-red-500" id="expo-education-level-error">{joinFormErrors.educationLevel}</span>}</label>
              <label className="block min-w-0 text-sm font-bold text-blue-800" htmlFor="expo-program-interest">Program Interest <span aria-hidden="true" className="text-red-500">*</span><select aria-describedby={joinFormErrors.programInterest ? "expo-program-interest-error" : undefined} aria-invalid={Boolean(joinFormErrors.programInterest)} className={`mt-2 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 pr-10 outline-none focus:border-blue-800 ${joinForm.programInterest ? "text-black" : "text-black/60"}`} id="expo-program-interest" onChange={(e) => updateField("programInterest", e.target.value)} required value={joinForm.programInterest}><option disabled value="">Select your program interest</option><option>Business</option><option>Computer Science / IT</option><option>Engineering</option><option>Medical</option><option>Arts &amp; Design</option><option>Social Sciences</option><option>Law</option><option>Study Abroad</option><option>Other</option></select>{joinFormErrors.programInterest && <span className="mt-1 block text-xs font-medium text-red-500" id="expo-program-interest-error">{joinFormErrors.programInterest}</span>}</label>
              <label className="block min-w-0 text-sm font-bold text-blue-800" htmlFor="expo-preferred-destination">Preferred Destination <span aria-hidden="true" className="text-red-500">*</span><select aria-describedby={joinFormErrors.preferredDestination ? "expo-preferred-destination-error" : undefined} aria-invalid={Boolean(joinFormErrors.preferredDestination)} className={`mt-2 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 pr-10 outline-none focus:border-blue-800 ${joinForm.preferredDestination ? "text-black" : "text-black/60"}`} id="expo-preferred-destination" onChange={(e) => updateField("preferredDestination", e.target.value)} required value={joinForm.preferredDestination}><option disabled value="">Select your preferred destination</option><option>Pakistan</option><option>United Kingdom</option><option>Canada</option><option>Australia</option><option>United States</option><option>Germany</option><option>Turkey</option><option>Malaysia</option><option>China</option><option>Other</option></select>{joinFormErrors.preferredDestination && <span className="mt-1 block text-xs font-medium text-red-500" id="expo-preferred-destination-error">{joinFormErrors.preferredDestination}</span>}</label>
              <label className="block min-w-0 text-sm font-bold text-blue-800 md:col-span-2" htmlFor="expo-notes">Notes <span aria-hidden="true" className="text-red-500">*</span><textarea aria-describedby={joinFormErrors.notes ? "expo-notes-error" : undefined} aria-invalid={Boolean(joinFormErrors.notes)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-black placeholder:text-black/60 outline-none focus:border-blue-800" id="expo-notes" onChange={(e) => updateField("notes", e.target.value)} placeholder="Tell us what you are looking for..." required value={joinForm.notes} />{joinFormErrors.notes && <span className="mt-1 block text-xs font-medium text-red-500" id="expo-notes-error">{joinFormErrors.notes}</span>}</label>
            </div>

            <div className="sticky bottom-0 mt-4 flex flex-col gap-3 bg-white pt-3 sm:flex-row sm:justify-end">
              <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200" onClick={closeJoinForm} type="button">Cancel</button>
              <button className="rounded-xl bg-blue-800 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-60" type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Educationalexpo;
