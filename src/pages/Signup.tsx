import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import type { RootState } from "../Redux/store";
import { useLoginMutation, useSignupMutation } from "../Redux/authApi";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiEye, FiEyeOff } from "react-icons/fi";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type SignupFormData = z.infer<typeof signupSchema>;

const Signup = () => {
  const navigate = useNavigate();
  const auth = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const [signup] = useSignupMutation();
  const [login] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data).unwrap();
      await login({ email: data.email, password: data.password }).unwrap();
      toast.success("Account created & logged in 🎉");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  useEffect(() => {
    if (auth?.accessToken && auth.user) {
      if (auth.user.role === "SUPER_ADMIN") navigate("/dashboard", { replace: true });
      else navigate("/", { replace: true });
    }
  }, [auth, navigate]);

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl top-0 left-0 pointer-events-none" />
      <div className="absolute w-72 h-72 bg-violet-600/8 rounded-full blur-3xl bottom-0 right-0 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-[#0d0d15] border border-white/8 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black shadow-lg shadow-violet-500/25">
                F
              </div>
              <span className="text-white font-black text-xl tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                File<span className="text-violet-400">Vault</span>
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              Create account
            </h1>
            <p className="text-zinc-600 text-sm">Start managing files for your team</p>
          </div>

          {/* Zod errors */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 space-y-1">
              {errors.fullName && <p className="text-red-400 text-sm">{errors.fullName.message}</p>}
              {errors.companyName && <p className="text-red-400 text-sm">{errors.companyName.message}</p>}
              {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
              {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                  Full Name
                </label>
                <input
                  {...register("fullName")}
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                  Company
                </label>
                <input
                  {...register("companyName")}
                  type="text"
                  placeholder="Acme Inc."
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@company.com"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create Account →"}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;