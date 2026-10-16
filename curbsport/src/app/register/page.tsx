import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = { title: "Join the set" };

export default function RegisterPage() {
  return <AuthScreen><AuthForm mode="register" /></AuthScreen>;
}
