import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-blue-900 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_25%)]" />

      <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black tracking-[0.25em] text-white sm:text-3xl">
                VIVENT
              </h2>
            </div>

            <p className="max-w-lg text-sm leading-6 text-slate-200">
              VIVENT brings job fairs, food festivals, and educational expos
              together with role-based dashboards, promotion plans, and
              calendar tracking.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {[FaFacebookF, FaTiktok, FaLinkedinIn, FaInstagram].map(
                (Icon, index) => (
                  <button
                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/10 text-slate-100 transition hover:-translate-y-1 hover:bg-white/20 hover:text-white"
                    key={index}
                    type="button"
                  >
                    <Icon />
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white">
                Quick Links
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link className="transition hover:text-white" to="/">
                    Home
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/about">
                    About
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/contact">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white">
                Legal
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link className="transition hover:text-white" to="/privacy-policy">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/terms-of-services">
                    Terms of Services
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 text-xs text-slate-200 md:flex-row md:items-center md:justify-between">
          <p>Copyright 2026 VIVENT. All rights reserved.</p>
          <div className="flex flex-wrap gap-3">
            <Link className="transition hover:text-white" to="/privacy-policy">
              Privacy Policy
            </Link>
            <Link className="transition hover:text-white" to="/terms-of-services">
              Terms of Services
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
