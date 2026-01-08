"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="auth-page">
      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-primary);
          padding: var(--space-8);
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
          padding: var(--space-8);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-xl);
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--space-8);
        }

        .logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-4);
        }

        .auth-title {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .auth-subtitle {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .form-label {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: var(--space-3);
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
        }

        .form-input {
          width: 100%;
          padding: var(--space-3) var(--space-3) var(--space-3) var(--space-10);
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--text-sm);
          transition: all var(--transition-fast);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-accent-secondary);
          box-shadow: 0 0 0 3px hsla(217, 91%, 60%, 0.15);
        }

        .form-input::placeholder {
          color: var(--color-text-muted);
        }

        .password-toggle {
          position: absolute;
          right: var(--space-3);
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: var(--space-1);
        }

        .password-toggle:hover {
          color: var(--color-text-secondary);
        }

        .error-message {
          padding: var(--space-3);
          background: hsla(0, 84%, 55%, 0.1);
          border: 1px solid hsla(0, 84%, 55%, 0.3);
          border-radius: var(--radius-md);
          color: var(--color-error);
          font-size: var(--text-sm);
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          width: 100%;
          padding: var(--space-3);
          background: var(--color-accent-secondary);
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: white;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--color-accent-secondary-hover);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin: var(--space-6) 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--color-border-subtle);
        }

        .divider-text {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .toggle-mode {
          text-align: center;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .toggle-link {
          color: var(--color-accent-secondary);
          cursor: pointer;
          font-weight: var(--font-medium);
        }

        .toggle-link:hover {
          text-decoration: underline;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                fill="white"
                fillOpacity="0.8"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="auth-title">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="auth-subtitle">
            {isLogin
              ? "Sign in to your StreamStudio account"
              : "Get started with your free account"}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={16} className="spinner" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="divider">
          <span className="divider-line" />
          <span className="divider-text">or</span>
          <span className="divider-line" />
        </div>

        <p className="toggle-mode">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}
