import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/server-auth";

export const Route = createFileRoute("/login")({ component: Login });

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-muted/30 p-4"><section className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-elegant"><Link to="/" className="text-lg font-bold">Spendly</Link><h1 className="mt-8 text-3xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p><div className="mt-7">{children}</div></section></main>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><Label>{label}</Label>{children}</label>;
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { await signIn({ data: { email, password, rememberMe } }); await navigate({ to: "/dashboard" }); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to sign in"); } finally { setBusy(false); } };

  return <AuthFrame title="Welcome back" subtitle="Sign in to your Spendly workspace"><form onSubmit={submit} className="grid gap-4"><Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field><Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></Field><div className="flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} /><span>Remember me</span></label><Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link></div><Button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button></form><p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link></p></AuthFrame>;
}
