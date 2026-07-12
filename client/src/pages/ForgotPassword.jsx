import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
      setSent(true);
      toast.success("Reset link sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-600 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center px-16 w-full">
          <img src="/logo.svg" alt="RouteMind" className="w-20 h-20 mb-8 drop-shadow-2xl" />
          <h2 className="text-4xl font-bold text-white leading-tight mb-4 text-center">
            Forgot Your
            <br />
            Password?
          </h2>
          <p className="text-lg text-white/50 max-w-md leading-relaxed text-center mb-10">
            No worries — we'll send you a reset link to get back into your account.
          </p>
          <img src="/login-illustration.svg" alt="Fleet Management" className="w-full max-w-sm opacity-90" />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <img src="/logo.svg" alt="RouteMind" className="w-10 h-10 rounded-xl" />
            <h1 className="text-xl font-bold text-dark-900">TransitOps</h1>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-dark-900 mb-2">Check your email</h2>
              <p className="text-dark-400 mb-8">
                We've sent a password reset link to <strong className="text-dark-700">{email}</strong>
              </p>
              <p className="text-sm text-dark-400 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-dark-900">Reset password</h2>
                <p className="text-dark-400 mt-1">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="admin@transitops.com"
                      className={`input-field pl-11 ${
                        error ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400" : ""
                      }`}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 mt-6 text-sm text-dark-400 hover:text-dark-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
