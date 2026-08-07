import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { eventsApi, paymentsApi, registrationsApi } from "../utils/api";

const EventDetails = ({ isAuthenticated }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [hasTicket, setHasTicket] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    eventsApi.get(id).then(setEvent).catch((error) => setMessage(error.message || "Event not found.")).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([paymentsApi.myPayments(), registrationsApi.myRegistrations()])
      .then(([payments, registrations]) => {
        setHasTicket((payments || []).some((payment) => payment.event_id === id && payment.status === "completed"));
        setRegistered((registrations || []).some((registration) => registration.event_id === id));
      })
      .catch(() => setMessage("Could not load your ticket status."));
  }, [id, isAuthenticated]);

  const ticketFirst = true;
  const login = () => navigate("/login", { state: { from: location } });
  const purchase = async () => {
    if (!isAuthenticated) return login();
    setWorking(true);
    try {
      const successUrl = `${window.location.origin}${location.pathname}?payment=success`;
      const session = await paymentsApi.createStripeCheckoutSession(id, successUrl, location.href);
      window.location.assign(session.checkout_url);
    } catch (error) { setMessage(error.message || "Unable to start checkout."); setWorking(false); }
  };
  const register = async () => {
    if (!isAuthenticated) return login();
    if (ticketFirst && !hasTicket) return setMessage("You must purchase a ticket before registering for this event.");
    setWorking(true);
    try { await registrationsApi.register(id); setRegistered(true); setMessage("Registration completed successfully."); }
    catch (error) { setMessage(error.message || "Unable to register."); }
    finally { setWorking(false); }
  };

  if (loading) return <div className="mx-auto max-w-5xl p-12 text-center text-blue-800">Loading event…</div>;
  if (!event) return <div className="mx-auto max-w-5xl p-12 text-center"><p>{message || "Event not found."}</p><Link className="mt-4 inline-block text-blue-800 underline" to="/events">Browse events</Link></div>;
  const image = event.venue_details?.image_url || "https://images.unsplash.com/photo-1505373877841-8d25f7d46678";
  const price = event.ticket_price ?? event.venue_details?.ticket_price;
  const button = !isAuthenticated ? { label: "Login to Register", action: login } : registered ? { label: "Already Registered", disabled: true } : ticketFirst && !hasTicket ? { label: "Purchase Ticket", action: purchase } : { label: "Register", action: register };

  return <section className="bg-slate-50 py-12"><div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl">
    <img className="h-72 w-full object-cover" src={image} alt={event.title} />
    <div className="p-6 md:p-10"><p className="text-sm font-bold uppercase tracking-wider text-blue-700">{event.category?.replace("_", " ")}</p><h1 className="mt-2 text-3xl font-black text-slate-900 md:text-5xl">{event.title}</h1>
      <p className="mt-5 whitespace-pre-line leading-7 text-slate-600">{event.description}</p>
      <div className="mt-8 grid gap-4 rounded-2xl bg-blue-50 p-5 text-slate-700 sm:grid-cols-2"><p><b>Location:</b> {event.location || "To be announced"}</p><p><b>Schedule:</b> {event.start_date || "To be announced"}</p><p><b>Organizer:</b> {event.venue_details?.organizer || event.venue_details?.company || "VIVENT"}</p><p><b>Available seats:</b> {Math.max(0, (event.max_participants || 0) - (event.current_participants || 0))}</p><p><b>Ticket:</b> {price != null ? `PKR ${Number(price).toLocaleString("en-PK")}` : "Free / price to be announced"}</p></div>
      {message && <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-900">{message}</p>}
      <button disabled={button.disabled || working} onClick={button.action} className="mt-7 rounded-xl bg-blue-800 px-6 py-3 font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400">{working ? "Please wait…" : button.label}</button>
    </div></div></section>;
};

export default EventDetails;
