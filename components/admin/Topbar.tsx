'use client';

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">SProxy Admin</h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">admin@sproxy.io</span>
        <button className="text-sm text-red-500 hover:underline">
          Logout
        </button>
      </div>
    </header>
  );
}
