import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiEye, FiEyeOff, FiUpload, FiSave } from "react-icons/fi";
import { useUpdateProfileMutation, useChangePasswordMutation, useGetMeQuery } from "../Redux/authApi";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_UPLOAD_URL } from "../config";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().min(1, "Phone number is required").max(30).optional().nullable(),
  avatar: z.string().url("Invalid avatar URL").optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(128),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium transition-all
        ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: meData, isLoading: meLoading, refetch: refetchMe } = useGetMeQuery(undefined);
  const [updateProfile] = useUpdateProfileMutation();
  const [changePassword] = useChangePasswordMutation();

  const userData = meData?.data;
  const tenant = userData?.tenant;

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
    setValue: setProfileValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (userData) {
      setProfileValue("fullName", userData.fullName || "");
      setProfileValue("phone", userData.phone || null);
      setProfileValue("avatar", userData.avatar || null);
      setProfileValue("designation", userData.designation || null);
      setProfileValue("bio", userData.bio || null);
      setProfileValue("address", userData.address || null);
      setProfileValue("city", userData.city || null);
      setProfileValue("country", userData.country || null);
    }
  }, [userData, setProfileValue]);

  const showToast = (msg: string, type: "success" | "error" = "success") =>
    setToast({ msg, type });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile({
        fullName: data.fullName,
        phone: data.phone,
        avatar: data.avatar,
        designation: data.designation,
        bio: data.bio,
        address: data.address,
        city: data.city,
        country: data.country,
      }).unwrap();
      showToast("Profile updated successfully");
      refetchMe();
    } catch (err: any) {
      showToast(err?.data?.message || err?.message || "Failed to update profile", "error");
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      const res = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).unwrap();
      showToast(res.message || "Password changed successfully");
    } catch (err: any) {
      showToast(err?.data?.message || err?.message || "Failed to change password", "error");
    }
  };

  const uploadToCloudinary = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      form.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      const r = await fetch(
        CLOUDINARY_UPLOAD_URL,
        { method: "POST", body: form }
      );
      const d = await r.json();
      if (!d.secure_url) {
        throw new Error(d.error?.message || "Upload failed");
      }

      // Persist the avatar immediately so it survives leaving the page,
      // then refetch so the preview/header reflect it right away.
      setProfileValue("avatar", d.secure_url);
      await updateProfile({ avatar: d.secure_url }).unwrap();
      refetchMe();
      showToast("Avatar updated successfully");
    } catch (err: any) {
      showToast(
        err?.data?.message || err?.message || "Failed to upload avatar",
        "error"
      );
    }
    setUploading(false);
  };

  if (meLoading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Profile Settings
          </h1>
          <p className="text-zinc-600 text-sm mt-1">Manage your account information and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-[#0f0f13] p-1.5 rounded-2xl border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTab === "profile"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTab === "password"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Password
          </button>
        </div>

        {/* Account Info Card */}
        <div className="bg-[#0d0d15] border border-white/5 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-3xl font-black overflow-hidden border-2 border-white/10">
                {userData?.avatar ? (
                  <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  userData?.email?.[0]?.toUpperCase() || "?"
                )}
              </div>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{userData?.email}</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                Role: <span className="text-zinc-400 font-medium">{userData?.role}</span>
              </p>
              {tenant && (
                <>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Plan: <span className="text-zinc-400 font-medium">{tenant.plan}</span>
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Subscription:{" "}
                    <span className="text-zinc-400 font-medium">{tenant.subscriptionStatus || "—"}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
            {/* Avatar */}
            <div className="bg-[#0d0d15] border border-white/5 rounded-2xl p-6">
              <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-600 mb-4">Avatar</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-2xl font-black overflow-hidden border-2 border-white/10">
                  {userData?.avatar ? (
                    <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    userData?.email?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-400 hover:border-violet-500/40 hover:text-white cursor-pointer transition-all">
                    <FiUpload className="w-4 h-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadToCloudinary(file);
                      }}
                    />
                  </label>
                  {uploading && <p className="text-xs text-zinc-600 mt-2">Uploading...</p>}
                </div>
              </div>
              <p className="text-xs text-zinc-600 mt-3">
                Max 2MB. Supported: JPG, PNG, GIF
              </p>

              <div className="mt-4">
                <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                  Avatar URL (manual)
                </label>
                <input
                  {...registerProfile("avatar")}
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                />
                {profileErrors.avatar && (
                  <p className="text-red-400 text-xs mt-1">{profileErrors.avatar.message}</p>
                )}
              </div>
            </div>

            {/* Personal Info */}
            <div className="bg-[#0d0d15] border border-white/5 rounded-2xl p-6">
              <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-600 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Full Name
                  </label>
                  <input
                    {...registerProfile("fullName")}
                    type="text"
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                  />
                  {profileErrors.fullName && (
                    <p className="text-red-400 text-xs mt-1">{profileErrors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Email (read-only)
                  </label>
                  <input
                    type="email"
                    value={userData?.email || ""}
                    readOnly
                    className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Phone
                  </label>
                  <input
                    {...registerProfile("phone")}
                    type="tel"
                    placeholder="+1 555 000 0000"
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                  />
                  {profileErrors.phone && (
                    <p className="text-red-400 text-xs mt-1">{profileErrors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Designation
                  </label>
                  <input
                    {...registerProfile("designation")}
                    type="text"
                    placeholder="e.g. Operations Manager"
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                  />
                  {profileErrors.designation && (
                    <p className="text-red-400 text-xs mt-1">{profileErrors.designation.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Bio
                  </label>
                  <textarea
                    {...registerProfile("bio")}
                    rows={3}
                    placeholder="Short introduction about yourself"
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none transition-colors resize-none"
                  />
                  {profileErrors.bio && (
                    <p className="text-red-400 text-xs mt-1">{profileErrors.bio.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Address
                  </label>
                  <input
                    {...registerProfile("address")}
                    type="text"
                    placeholder="Street address"
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                  />
                  {profileErrors.address && (
                    <p className="text-red-400 text-xs mt-1">{profileErrors.address.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    City
                  </label>
                  <input
                    {...registerProfile("city")}
                    type="text"
                    placeholder="New York"
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                  />
                  {profileErrors.city && (
                    <p className="text-red-400 text-xs mt-1">{profileErrors.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Country
                  </label>
                  <input
                    {...registerProfile("country")}
                    type="text"
                    placeholder="United States"
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                  />
                  {profileErrors.country && (
                    <p className="text-red-400 text-xs mt-1">{profileErrors.country.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Role (read-only)
                  </label>
                  <input
                    type="text"
                    value={userData?.role || ""}
                    readOnly
                    className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20"
              >
                {profileSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
            <div className="bg-[#0d0d15] border border-white/5 rounded-2xl p-6">
              <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-600 mb-4">Change Password</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword("currentPassword")}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-400 text-xs mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword("newPassword")}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-400 text-xs mt-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-type new password"
                      className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-zinc-700 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20"
              >
                {passwordSubmitting ? "Saving..." : "Change Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
