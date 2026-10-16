import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return <AuthScreen><AuthForm mode="login" /></AuthScreen>;
}
