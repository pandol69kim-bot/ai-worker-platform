"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  BrainCircuit,
  LayoutDashboard,
  Store,
  PlusCircle,
  LogOut,
  User,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">AI 직원 메이커</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link href="/market">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Store className="h-4 w-4" />
                마켓
              </Button>
            </Link>

            {session ? (
              <>
                <Link href="/studio">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <PlusCircle className="h-4 w-4" />
                    제작 센터
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    대시보드
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Shield className="h-4 w-4" />
                      관리자
                    </Button>
                  </Link>
                )}
                <div className="ml-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600">{user?.name ?? user?.email}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">시작하기</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          <Link href="/market" className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-indigo-600" onClick={() => setMobileOpen(false)}>
            <Store className="h-4 w-4" /> 마켓
          </Link>
          {session ? (
            <>
              <Link href="/studio" className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-indigo-600" onClick={() => setMobileOpen(false)}>
                <PlusCircle className="h-4 w-4" /> 제작 센터
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-indigo-600" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard className="h-4 w-4" /> 대시보드
              </Link>
              <button
                className="flex w-full items-center gap-2 py-2 text-sm text-red-600"
                onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
              >
                <LogOut className="h-4 w-4" /> 로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-2 py-2 text-sm text-gray-700" onClick={() => setMobileOpen(false)}>
                <User className="h-4 w-4" /> 로그인
              </Link>
              <Link href="/register" className="flex items-center gap-2 py-2 text-sm text-indigo-600 font-medium" onClick={() => setMobileOpen(false)}>
                시작하기
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
