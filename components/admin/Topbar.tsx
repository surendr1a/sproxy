"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const [email, setEmail] = useState("admin@sproxy.io");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.email) setEmail(data.user.email);
      })
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">SProxy Admin</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{email}</span>
        <button className="text-sm text-red-500 hover:underline" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
