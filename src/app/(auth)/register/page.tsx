"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, Loader2, Users, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Role = "user" | "maker";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "회원가입에 실패했습니다.");
        return;
      }

      router.push("/login?registered=true");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4">
            <BrainCircuit className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI 직원 메이커 가입</h1>
          <p className="text-gray-500 mt-1">역할을 선택하고 시작하세요</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">회원가입</CardTitle>
            <CardDescription>역할을 선택해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  role === "user"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Users className={cn("h-6 w-6", role === "user" ? "text-indigo-600" : "text-gray-400")} />
                <span className={cn("font-medium text-sm", role === "user" ? "text-indigo-700" : "text-gray-600")}>
                  구매자
                </span>
                <span className="text-xs text-gray-400 text-center">AI 직원 도입</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("maker")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  role === "maker"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Wand2 className={cn("h-6 w-6", role === "maker" ? "text-indigo-600" : "text-gray-400")} />
                <span className={cn("font-medium text-sm", role === "maker" ? "text-indigo-700" : "text-gray-600")}>
                  메이커
                </span>
                <span className="text-xs text-gray-400 text-center">AI 직원 제작</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">비밀번호 (8자 이상)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {role === "maker" ? "메이커로 가입" : "가입하기"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:underline">
                로그인
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
