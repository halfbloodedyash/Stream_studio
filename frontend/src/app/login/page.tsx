"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BackgroundEffects } from "@/components/ui/BackgroundEffects";

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else {
          router.push("/dashboard");
        }
      } else {
        // Sign up
        if (!formData.name.trim()) {
          setError("Name is required");
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          setError(error.message);
        } else {
          // Success - show message to check email
          setError("Success! Please check your email to verify your account.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      <BackgroundEffects />

      {/* Decorative Elements */}
      <div className="absolute top-8 left-8 flex items-center gap-2 text-primary font-tech text-xs uppercase tracking-widest opacity-80">
        <div className="w-2 h-2 bg-primary animate-live-pulse rounded-full" />
        Secure Access Terminal
      </div>

      <div className="w-full max-w-md relative z-10 perspective-1000">
        <div className="bg-[#0a0a0a] border border-[#333] p-8 relative overflow-hidden group hover:border-[#444] transition-colors duration-300">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary opacity-50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary opacity-50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary opacity-50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary opacity-50" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 border border-primary/20 mb-4 text-primary">
              <Zap size={24} />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-tight">
              {isLogin ? "Welcome Back" : "Initialize"}
            </h1>
            <p className="text-zinc-500 font-tech text-sm uppercase tracking-wide">
              {isLogin
                ? "Enter credentials to access control room"
                : "Create new studio identity"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-tech uppercase text-zinc-400 tracking-wider">Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    className="w-full bg-[#111] border border-[#222] text-white text-sm py-3 pl-10 pr-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-tech placeholder:text-zinc-700"
                    placeholder="OPERATOR NAME"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-tech uppercase text-zinc-400 tracking-wider">Email Protocol</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  className="w-full bg-[#111] border border-[#222] text-white text-sm py-3 pl-10 pr-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-tech placeholder:text-zinc-700"
                  placeholder="USER@DOMAIN.COM"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-tech uppercase text-zinc-400 tracking-wider">Security Key</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-[#111] border border-[#222] text-white text-sm py-3 pl-10 pr-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-tech placeholder:text-zinc-700"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-tech p-3 uppercase tracking-wide">
                Error: {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-[#ff4d1f] text-black font-bold py-3 px-4 uppercase font-tech tracking-wider flex items-center justify-center gap-2 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_rgba(255,255,255,0.1)] disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Authenticate" : "Register ID"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#222]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0a] px-2 text-zinc-600 font-tech">System Options</span>
            </div>
          </div>

          <p className="text-center text-sm font-tech text-zinc-500">
            {isLogin ? "No clearance? " : "Already verified? "}
            <button
              className="text-primary hover:text-white transition-colors uppercase tracking-wide font-bold ml-1"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Request Access" : "Login"}
            </button>
          </p>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute -z-10 -left-4 -top-4 w-full h-full border-l border-t border-[#222] opacity-50" />
        <div className="absolute -z-10 -right-4 -bottom-4 w-full h-full border-r border-b border-[#222] opacity-50" />
      </div>
    </div>
  );
}

