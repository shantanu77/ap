import { Suspense } from "react";
import LoginForm from "@/app/login/LoginForm";

export const metadata = {
  title: "Sign in · AllShare Learning Companion",
};

export default function LoginPage() {
  return <Suspense fallback={<div className="p-12 text-center text-slate-500">Opening your sign-in…</div>}><LoginForm /></Suspense>;
}
