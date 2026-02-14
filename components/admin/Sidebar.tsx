'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menu = [
  { name: 'Dashboard', path: '/admin' },
  { name: 'Users', path: '/admin/users' },
  { name: 'Proxies', path: '/admin/proxies' },
  { name: 'Usage', path: '/admin/usage' },
  { name: 'Plans', path: '/admin/plans' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r">
      <div className="p-6 text-xl font-bold">SProxy Admin</div>

      <nav className="px-4 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`block px-4 py-2 rounded-md ${
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
  );
}
