import React from "react";
import { Link, useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-center">
      <div className="mx-auto max-w-3xl">
        <div className="text-[clamp(6rem,18vw,12rem)] font-black leading-none tracking-tight text-blue-800">
          404
        </div>

        <h1 className="mt-6 text-4xl font-bold text-blue-800 sm:text-5xl">
          Page not found
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-500 sm:text-lg">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-gray-200 bg-white px-8 text-base font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-blue-800"
            onClick={() => navigate(-1)}
            type="button"
          >
            Go Back
          </button>
          <Link
            to="/"
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-800 px-8 text-base font-semibold text-white shadow-lg shadow-blue-800/20 transition hover:bg-blue-900"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
