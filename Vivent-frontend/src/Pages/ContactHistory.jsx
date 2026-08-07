import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { contactApi } from "../utils/api";

const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";

export default function ContactHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inquiries, setInquiries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    contactApi.listMine()
      .then((items) => {
        setInquiries(items || []);
        const targetId = searchParams.get("inquiry");
        if (targetId) setSelected((items || []).find((item) => item.id === targetId) || null);
      })
      .catch((err) => setError(err.message || "Could not load your contact inquiries."))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const closeConversation = () => {
    setSelected(null);
    setSearchParams({});
  };

  return (
    <section className="min-h-screen bg-[#f4f7fc] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-800">Support</p>
        <h1 className="mt-2 text-3xl font-black text-black">Contact History</h1>
        <p className="mt-2 text-slate-600">Review your inquiries and replies from the VIVENT team.</p>

        <div className="mt-7 overflow-x-auto rounded-3xl bg-white p-4 shadow-sm">
          {loading && <p className="p-4 text-sm text-slate-500">Loading inquiries...</p>}
          {error && <p className="p-4 text-sm text-red-600">{error}</p>}
          {!loading && !error && inquiries.length === 0 && <p className="p-4 text-sm text-slate-500">You have not submitted any contact inquiries yet.</p>}
          {!loading && !error && inquiries.length > 0 && (
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="p-3">Date</th><th className="p-3">Subject</th><th className="p-3">Status</th><th className="p-3">Reply</th></tr>
              </thead>
              <tbody>
                {inquiries.map((item) => (
                  <tr className="border-t border-slate-100" key={item.id}>
                    <td className="p-3">{formatDate(item.created_at)}</td>
                    <td className="p-3 font-semibold text-black">{item.service}</td>
                    <td className="p-3"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{item.status}</span></td>
                    <td className="p-3">{item.is_replied ? <button className="font-bold text-blue-800 hover:underline" onClick={() => setSelected(item)} type="button">View</button> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <article className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-800">Contact Inquiry</p><h2 className="mt-1 text-2xl font-black text-black">{selected.service}</h2><p className="mt-1 text-sm text-slate-500">Submitted: {formatDate(selected.created_at)}</p></div>
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-800" onClick={closeConversation} type="button"><FaTimes /></button>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Message</h3><p className="mt-2 whitespace-pre-wrap leading-6 text-black">{selected.message}</p></div>
            <div className="mt-4 rounded-2xl bg-blue-50 p-4"><h3 className="text-xs font-bold uppercase tracking-wider text-blue-800">Admin Reply</h3><p className="mt-2 whitespace-pre-wrap leading-6 text-black">{selected.admin_reply || "No reply yet."}</p>{selected.replied_at && <p className="mt-3 text-xs text-slate-500">Replied: {formatDate(selected.replied_at)}</p>}</div>
          </article>
        </div>
      )}
    </section>
  );
}
