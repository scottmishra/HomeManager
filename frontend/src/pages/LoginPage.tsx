import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { Home } from "lucide-react";

const INPUT_CLASS =
  "w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left editorial panel — desktop only */}
      <div className="hidden md:flex md:w-1/2 md:flex-col md:justify-between bg-warm-900 p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-white">HomeManager</span>
        </div>

        {/* Hero text */}
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight text-white mb-4">
            Your home,<br />intelligently<br />maintained.
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-warm-400">
            Track appliances, schedule maintenance, and get AI-powered guidance —
            all in one place.
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-warm-600">
          Built for homeowners who care about their homes.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-warm-50 p-6">
        {/* Mobile logo — only on small screens */}
        <div className="mb-8 text-center md:hidden">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Home className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-warm-900">HomeManager</h1>
          <p className="mt-1 text-sm text-warm-600">AI-powered home maintenance</p>
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-warm-900 mb-1">
              {isSignUp ? "Create account" : "Welcome back"}
            </h2>
            <p className="text-sm text-warm-600">
              {isSignUp
                ? "Start managing your home today."
                : "Sign in to your home."}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-warm-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-warm-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className={INPUT_CLASS}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Loading…" : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-warm-600">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
