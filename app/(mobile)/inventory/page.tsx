'use client';

import InventoryList from '@/components/mobile/InventoryList';

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="pb-20">
        <InventoryList />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-around">
      <NavItem href="/capture" icon="📷" label="Capture" />
      <NavItem href="/inventory" icon="📋" label="Inventory" active />
      <NavItem href="/settings" icon="⚙️" label="Settings" />
    </nav>
  );
}

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active = false }: NavItemProps) {
  return (
    <a
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </a>
  );
}
