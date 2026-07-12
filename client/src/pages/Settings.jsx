import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const roleLabels = {
  admin: "Administrator",
  dispatcher: "Dispatcher",
  driver: "Driver",
  viewer: "Viewer",
};

function Settings() {
  const { user, updateProfile, api } = useAuth();

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setProfileLoading(true);
    setProfileSaved(false);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      setProfileSaved(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const validatePassword = () => {
    const errs = {};
    if (!currentPassword) errs.currentPassword = "Current password is required";
    if (!newPassword) errs.newPassword = "New password is required";
    else if (newPassword.length < 6) errs.newPassword = "Must be at least 6 characters";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (currentPassword && newPassword && currentPassword === newPassword)
      errs.newPassword = "New password must be different";
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setPasswordLoading(true);
    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-900">Settings</h1>
        <p className="text-dark-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-900">Profile</h2>
            <p className="text-sm text-dark-400">Update your personal information</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-5">
          {/* Avatar + Role */}
          <div className="flex items-center gap-4 pb-5 border-b border-dark-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-xl font-bold text-white">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <p className="text-base font-semibold text-dark-900">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="w-3.5 h-3.5 text-dark-400" />
                <span className="text-sm text-dark-400">{roleLabels[user?.role] || "User"}</span>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-11"
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="input-field pl-11 bg-dark-50 text-dark-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-dark-400 mt-1.5">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field pl-11"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-100">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-dark-400" />
              <div>
                <p className="text-xs text-dark-400">Member since</p>
                <p className="text-sm font-medium text-dark-700">{formatDate(user?.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-dark-400" />
              <div>
                <p className="text-xs text-dark-400">Last login</p>
                <p className="text-sm font-medium text-dark-700">
                  {formatDate(user?.lastLogin)} {formatTime(user?.lastLogin)}
                </p>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {profileLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : profileSaved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {profileSaved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-warning-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-900">Change Password</h2>
            <p className="text-sm text-dark-400">Keep your account secure with a strong password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErrors((p) => ({ ...p, currentPassword: "" })); }}
                className={`input-field pl-11 pr-11 ${
                  passwordErrors.currentPassword ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400" : ""
                }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors((p) => ({ ...p, newPassword: "" })); }}
                className={`input-field pl-11 ${
                  passwordErrors.newPassword ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400" : ""
                }`}
                placeholder="Enter new password"
              />
            </div>
            {passwordErrors.newPassword && (
              <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {passwordErrors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors((p) => ({ ...p, confirmPassword: "" })); }}
                className={`input-field pl-11 ${
                  passwordErrors.confirmPassword ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400" : ""
                }`}
                placeholder="Confirm new password"
              />
            </div>
            {passwordErrors.confirmPassword && (
              <p className="flex items-center gap-1.5 mt-1.5 text-xs text-danger-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {passwordLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
