'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const menu = [
  { name: 'Dashboard', path: '/admin' },
  { name: 'Users', path: '/admin/users' },
  { name: 'Proxies', path: '/admin/proxies' },
  { name: 'Usage', path: '/admin/usage' },
  { name: 'Plans', path: '/admin/plans' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-white transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 text-xl font-bold">
          <span>SProxy Admin</span>
          <button
            type="button"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 md:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2 px-4">
          {menu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              className={`block rounded-md px-4 py-2 ${
                pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
