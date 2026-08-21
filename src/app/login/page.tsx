import { googleEnabled } from "@/lib/google";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <LoginForm googleEnabled={googleEnabled()} error={error} />;
}
