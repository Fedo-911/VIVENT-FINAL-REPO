import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaGoogle } from "react-icons/fa";
import api from "../utils/api";

const rolePath = (role) => {
  if (role === "student") return "/studentpanel";
  if (role === "business") return "/businesspanel";
  if (role === "admin") return "/adminpanel";
  return "/";
};

const Login = ({ onAuth }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    accountType: "",
  });
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetState, setResetState] = useState({
    email: "",
    otp: "",
    generatedOtp: "",
    newPassword: "",
    confirmPassword: "",
    step: "email",
  });
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || "/";

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setLoginError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const data = await api.auth.login(formData.username, formData.password);
      // data = { access_token, token_type, expires_in_hours, user }
      const user = data.user;
      const role = user?.role || formData.accountType;

      // Validate that the selected account type matches the actual role
      if (
        formData.accountType &&
        formData.accountType !== role &&
        role !== "admin"
      ) {
        setLoginError(
          `This account is registered as "${role}", not "${formData.accountType}". Please select the correct account type.`
        );
        setLoading(false);
        return;
      }

      // Persist auth state
      localStorage.setItem("viventToken", data.access_token);
      localStorage.setItem("viventAuth", "true");
      localStorage.setItem("viventAuthRole", role);
      localStorage.setItem("viventUser", JSON.stringify(user));

      onAuth(role);
      navigate(rolePath(role) || redirectPath, { replace: true });
    } catch (err) {
      setLoginError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setLoginError("");
    setResetMessage("");
    setResetError("");
    setResetState((current) => ({
      ...current,
      email: current.email || (formData.username.includes("@") ? formData.username : ""),
      otp: "",
      generatedOtp: "",
      newPassword: "",
      confirmPassword: "",
      step: "email",
    }));
    setForgotOpen(true);
  };

  const sendOtp = () => {
    const email = resetState.email.trim().toLowerCase();
    if (!email) {
      setResetError("Please enter your email first.");
      return;
    }
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    setResetState((current) => ({
      ...current,
      generatedOtp,
      step: "otp",
    }));
    setResetMessage(`OTP sent to ${email}. Demo OTP: ${generatedOtp}`);
    setResetError("");
  };

  const verifyOtp = () => {
    if (resetState.otp.trim() !== resetState.generatedOtp) {
      setResetError("Invalid OTP. Please try again.");
      return;
    }
    setResetState((current) => ({ ...current, step: "password" }));
    setResetMessage("OTP verified. Now enter your new password.");
    setResetError("");
  };

  const updatePassword = () => {
    if (!resetState.newPassword || !resetState.confirmPassword) {
      setResetError("Please enter and confirm your new password.");
      return;
    }
    if (resetState.newPassword !== resetState.confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    setResetMessage(
      "Please contact support to reset your password on the backend."
    );
    setResetError("");
    setForgotOpen(false);
  };

  return (
    <div className="flex justify-center bg-blue-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-6 flex items-center justify-center">
            <h2 className="text-center text-2xl font-black text-blue-800">
              Login
            </h2>
          </div>

          <input
            type="text"
            name="username"
            placeholder="Enter Your Email"
            value={formData.username}
            onChange={handleChange}
            className="mb-4 w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />

          <div className="mb-1 flex justify-end">
            <button
              className="text-[11px] font-semibold text-blue-700 transition hover:text-blue-900 hover:underline"
              onClick={openForgotPassword}
              type="button"
            >
              Forgot Password?
            </button>
          </div>

          <input
            type="password"
            name="password"
            placeholder="Enter Your Password"
            value={formData.password}
            onChange={handleChange}
            className="mb-4 w-full rounded-xl border border-blue-200 px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />

          <select
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            className="mb-4 w-full rounded-xl border border-blue-200 px-4 py-3 text-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          >
            <option value="">Select Account Type</option>
            <option value="student">Student</option>
            <option value="business">Business</option>
          </select>

          <button
            className="w-full rounded-xl bg-blue-800 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in…" : "Login"}
          </button>

          <div className="my-6 flex items-center">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-3 text-sm text-gray-500">Or With</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <div className="space-y-3">
            <button
              className="w-full rounded-xl bg-blue-800 py-2 text-white transition hover:bg-blue-900"
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <FaGoogle />
                Login with Google
              </span>
            </button>
          </div>

          <p className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-blue-800 hover:underline">
              Sign Up
            </Link>
          </p>

          {loginError && (
            <p className="mt-4 text-sm font-medium text-red-600">{loginError}</p>
          )}
        </form>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
              <div className="max-w-lg">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-800 shadow-sm">
                  <FaEnvelope className="text-2xl" />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-800">
                  Forgot Password?
                </p>
                <h3 className="mt-3 text-3xl font-black text-blue-800">
                  Reset your password
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Enter your email, verify the OTP, and then choose a new password for your account.
                </p>
              </div>

              <button
                className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800 transition hover:bg-blue-100"
                onClick={() => setForgotOpen(false)}
                type="button"
              >
                X
              </button>
            </div>

            <div className="space-y-4 px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
              {resetState.step === "email" && (
                <>
                  <label className="block text-sm font-bold text-blue-800">
                    Email address
                    <input
                      className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        setResetState((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="you@example.com"
                      type="email"
                      value={resetState.email}
                    />
                  </label>
                  <button
                    className="h-12 w-full rounded-2xl bg-blue-800 font-semibold text-white transition hover:bg-blue-900"
                    onClick={sendOtp}
                    type="button"
                  >
                    Send OTP
                  </button>
                </>
              )}

              {resetState.step === "otp" && (
                <>
                  <label className="block text-sm font-bold text-blue-800">
                    OTP code
                    <input
                      className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        setResetState((current) => ({
                          ...current,
                          otp: event.target.value,
                        }))
                      }
                      placeholder="Enter 6 digit OTP"
                      value={resetState.otp}
                    />
                  </label>
                  <button
                    className="h-12 w-full rounded-2xl bg-blue-800 font-semibold text-white transition hover:bg-blue-900"
                    onClick={verifyOtp}
                    type="button"
                  >
                    Verify OTP
                  </button>
                </>
              )}

              {resetState.step === "password" && (
                <>
                  <label className="block text-sm font-bold text-blue-800">
                    New Password
                    <input
                      className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        setResetState((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      placeholder="Enter new password"
                      type="password"
                      value={resetState.newPassword}
                    />
                  </label>

                  <label className="block text-sm font-bold text-blue-800">
                    Confirm Password
                    <input
                      className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        setResetState((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                      type="password"
                      value={resetState.confirmPassword}
                    />
                  </label>

                  <button
                    className="h-12 w-full rounded-2xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-700"
                    onClick={updatePassword}
                    type="button"
                  >
                    Change Password
                  </button>
                </>
              )}

              <div className="space-y-2">
                {resetMessage && (
                  <p className="text-sm font-medium text-gray-500">{resetMessage}</p>
                )}
                {resetError && (
                  <p className="text-sm font-medium text-rose-600">{resetError}</p>
                )}
              </div>

              <button
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 transition hover:text-blue-900"
                onClick={() => setForgotOpen(false)}
                type="button"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
