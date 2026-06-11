import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaGoogle } from 'react-icons/fa';
import api from "../utils/api";

const rolePath = (role) => {
  if (role === "student") return "/studentpanel";
  if (role === "business") return "/businesspanel";
  return "/";
};

const Signup = ({ onAuth }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    accountType: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Register on backend
      await api.auth.register(
        formData.email,
        formData.password,
        formData.username,
        formData.accountType
      );

      // Auto-login after registration
      const loginData = await api.auth.login(formData.email, formData.password);
      const user = loginData.user;
      const role = user?.role || formData.accountType;

      localStorage.setItem("viventToken", loginData.access_token);
      localStorage.setItem("viventAuth", "true");
      localStorage.setItem("viventAuthRole", role);
      localStorage.setItem("viventUser", JSON.stringify(user));

      onAuth(role);
      navigate(rolePath(role) || redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center bg-blue-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

          <h2 className="mb-2 text-center text-3xl font-bold text-blue-800">
            Create an Account
          </h2>
          <p className="mb-6 text-center text-gray-500">
            Join VIVENT and explore events & opportunities!
          </p>

          <form onSubmit={handleSubmit}>

            <div className="mb-4 flex items-center rounded-lg border border-blue-200 px-3 focus-within:ring-2 focus-within:ring-blue-400">
              <FaUser className="text-blue-400" />
              <input
                type="text"
                name="username"
                placeholder="Enter Your Username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-3 outline-none"
                required
              />
            </div>

            <div className="mb-4 flex items-center rounded-lg border border-blue-200 px-3 focus-within:ring-2 focus-within:ring-blue-400">
              <FaEnvelope className="text-blue-400" />
              <input
                type="email"
                name="email"
                placeholder="Enter Your Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-3 outline-none"
                required
              />
            </div>

            <div className="mb-4 flex items-center rounded-lg border border-blue-200 px-3 focus-within:ring-2 focus-within:ring-blue-400">
              <FaPhone className="text-blue-400" />
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Enter Your Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-3 outline-none"
              />
            </div>

            <div className="mb-4 flex items-center rounded-lg border border-blue-200 px-3 focus-within:ring-2 focus-within:ring-blue-400">
              <FaLock className="text-blue-400" />
              <input
                type="password"
                name="password"
                placeholder="Enter Your Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-3 outline-none"
                minLength={8}
                required
              />
            </div>

            <div className="mb-4">
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full border border-blue-200 px-4 py-3 rounded-lg outline-none text-gray-500 focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select Account Type</option>
                <option value="student">Student</option>
                <option value="business">Business</option>
              </select>
            </div>

            {error && (
              <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
            )}

            <button
              className="w-full rounded-lg bg-blue-800 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Account…' : 'Sign Up'}
            </button>

            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-3 text-gray-500 text-sm">Or With</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 py-2 text-white transition hover:bg-blue-900"
              type="button"
            >
              <FaGoogle /> Signup with Google
            </button>

            <p className="mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Login
              </Link>
            </p>

          </form>
      </div>
    </div>
  );
};

export default Signup;
