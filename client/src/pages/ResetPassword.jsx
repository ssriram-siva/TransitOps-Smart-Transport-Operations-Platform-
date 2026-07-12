import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const validate = () => {
    const errs = {};
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await axios.put(`/api/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success("Password reset successful!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset link is invalid or has expired");
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
            Set a New
            <br />
            Password
          </h2>
          <p className="text-lg text-white/50 max-w-md leading-relaxed text-center mb-10">
            Choose a strong password to secure your fleet management account.
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

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-dark-900 mb-2">Password reset!</h2>
              <p className="text-dark-400 mb-8">
                Your password has been updated successfully.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-dark-900">New password</h2>
                <p className="text-dark-400 mt-1">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                      placeholder="Enter new password"
                      className={`input-field pl-11 pr-11 ${
                        errors.password ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400" : ""
                      }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                      placeholder="Confirm new password"
                      className={`input-field pl-11 ${
                        errors.confirmPassword ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400" : ""
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.confirmPassword}
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
                      Reset Password
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

export default ResetPassword;
