"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      if (password.length < 8) {
        setError("Password minimal 8 karakter");
        setIsLoading(false);
        return;
      }

      try {
        const result = await signIn.email({
          email,
          password,
        });

        if (result.error) {
          setError(result.error.message || "Email atau password salah");
        } else {
          router.push("/dashboard");
        }
      } catch {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, router]
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Background Image with low opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.12] pointer-events-none"
        style={{ backgroundImage: `url('/background.png')` }}
      />
      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center relative overflow-hidden">
              {/* Background image inside logo with low opacity */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
                style={{ backgroundImage: `url('/background.png')` }}
              />
              <img src="/favicon.ico" alt="InboundOS Logo" className="h-7 w-7 object-contain z-10 relative" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-industrial-blue">InboundOS</h1>
          <p className="text-sm text-on-surface-variant">
            Masuk ke aplikasi warehouse scanner
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-outline-variant bg-surface-container-lowest">
          <CardContent className="p-5 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-background border-outline-variant text-sm"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-12 w-full min-w-0 rounded-xl bg-background border border-outline-variant text-sm px-3.5 py-1 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-12"
                    required
                    minLength={8}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-status-bg-red border border-danger-signal/20">
                  <AlertTriangle className="h-4 w-4 text-danger-signal shrink-0" />
                  <p className="text-xs text-danger-signal font-medium">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-12 rounded-xl text-sm font-semibold bg-industrial-blue hover:bg-industrial-blue/90 gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? "Masuk..." : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-on-surface-variant">
          Hubungi admin untuk membuat akun baru.
        </p>
      </div>
    </div>
  );
}
