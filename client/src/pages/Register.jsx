import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const validators = {
  name: (v) => {
    if (!v.trim()) return "Full name is required";
    if (v.trim().length < 2) return "Name must be at least 2 characters";
    if (v.trim().length > 50) return "Name cannot exceed 50 characters";
    return "";
  },
  email: (v) => {
    if (!v) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
    return "";
  },
  phone: (v) => {
    if (!v) return ""; // optional
    if (!/^[+]?[\d\s\-]{7,15}$/.test(v)) return "Enter a valid phone number";
    return "";
  },
  password: (v) => {
    if (!v) return "Password is required";
    if (v.length < 6) return "Password must be at least 6 characters";
    if (v.length > 128) return "Password cannot exceed 128 characters";
    return "";
  },
  confirmPassword: (v, all) => {
    if (!v) return "Please confirm your password";
    if (v !== all.password) return "Passwords do not match";
    return "";
  },
};

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "dispatcher",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = (field, value) => {
    const validator = validators[field];
    if (validator) {
      return validator(value, formData);
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
    }

    if (name === "password" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validators.confirmPassword(formData.confirmPassword, {
          ...formData,
          password: value,
        }),
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, formData[field]) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allErrors = {};
    let hasError = false;
    for (const field of ["name", "email", "password", "confirmPassword", "phone"]) {
      const err = validate(field, formData[field]);
      allErrors[field] = err;
      if (err) hasError = true;
    }

    setErrors(allErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
    });

    if (hasError) return;

    setLoading(true);
    try {
      await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        formData.role,
        formData.phone.trim()
      );
      toast.success("Account created successfully!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const showError = (field) => errors[field] && touched[field];

  const fieldClass = (field) =>
    `input-field pl-11 ${
      showError(field)
        ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400"
        : ""
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-900 via-dark-800 to-secondary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-secondary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-600 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center px-16 w-full">
          <img src="/logo.svg" alt="RouteMind" className="w-20 h-20 mb-8 drop-shadow-2xl" />
          <h2 className="text-4xl font-bold text-white leading-tight mb-4 text-center">
            Join the Platform
            <br />
            Built for Fleets
          </h2>
          <p className="text-lg text-white/50 max-w-md leading-relaxed text-center mb-10">
            Create your account and start managing vehicles, drivers, and trips
            with powerful analytics.
          </p>
          <img src="/login-illustration.svg" alt="Fleet Management" className="w-full max-w-sm opacity-90" />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <img src="/logo.svg" alt="RouteMind" className="w-10 h-10 rounded-xl" />
            <h1 className="text-xl font-bold text-dark-900">TransitOps</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-dark-900">Create account</h2>
            <p className="text-dark-400 mt-1">
              Fill in your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Full Name <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur("name")}
                  placeholder="John Doe"
                  className={fieldClass("name")}
                />
              </div>
              {showError("name") && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Email <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  placeholder="john@example.com"
                  className={fieldClass("email")}
                />
              </div>
              {showError("email") && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur("phone")}
                  placeholder="+91-9876543210"
                  className={fieldClass("phone")}
                />
              </div>
              {showError("phone") && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Role <span className="text-danger-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
              >
                <option value="dispatcher">Dispatcher</option>
                <option value="driver">Driver</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Password <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur("password")}
                  placeholder="Min 6 characters"
                  className={`input-field pl-11 pr-11 ${
                    showError("password")
                      ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {showError("password") && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Confirm Password <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder="Repeat your password"
                  className={fieldClass("confirmPassword")}
                />
              </div>
              {showError("confirmPassword") && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-dark-400 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
