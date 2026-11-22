import LoginForm from "@/app/login/LoginForm";

export const metadata = {
  title: "Sign in · BrightKids.Space",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;
  return <LoginForm nextPath={nextPath} />;
}
