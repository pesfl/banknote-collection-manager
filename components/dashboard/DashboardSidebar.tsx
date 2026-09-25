'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardSidebarProps {
  open: boolean;
  onToggle: (open: boolean) => void;
}

export default function DashboardSidebar({ open }: DashboardSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/banknotes', label: 'Collection', icon: '📚' },
    { href: '/valuation', label: 'Valuation', icon: '💰' },
    { href: '/analytics', label: 'Analytics', icon: '📊' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside
      className={`${
        open ? 'w-64' : 'w-20'
      } transition-all duration-300 bg-white/10 backdrop-blur-xl border-r border-white/20 flex flex-col`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-white/20">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {open ? '🏦 Banknotes' : '🏦'}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
              pathname === item.href
                ? 'bg-white/20 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {open && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/20 p-4">
        <div className="text-xs text-gray-400">
          {open ? 'v1.0.0' : ''}
        </div>
      </div>
    </aside>
  );
}
