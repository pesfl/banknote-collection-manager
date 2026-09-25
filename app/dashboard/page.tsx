'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function DashboardHome() {
  const { data: session } = useSession();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 rounded-xl p-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {session?.user?.email?.split('@')[0] || 'Collector'}! 👋
        </h1>
        <p className="text-gray-300">
          Manage your banknote collection with AI-powered insights and multi-source valuation.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            href: '/dashboard/banknotes',
            title: 'Collection',
            description: 'View and manage your specimens',
            icon: '📚',
            color: 'from-blue-500 to-blue-600',
          },
          {
            href: '/dashboard/valuation',
            title: 'Valuation',
            description: 'Multi-source price tracking',
            icon: '💰',
            color: 'from-green-500 to-green-600',
          },
          {
            href: '/dashboard/analytics',
            title: 'Analytics',
            description: 'Portfolio insights & trends',
            icon: '📊',
            color: 'from-purple-500 to-purple-600',
          },
          {
            href: '/capture',
            title: 'Capture',
            description: 'Add new specimens',
            icon: '📷',
            color: 'from-orange-500 to-orange-600',
          },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:border-white/40 hover:bg-white/15 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
              {link.icon}
            </div>
            <h3 className="font-bold text-white text-lg mb-1">{link.title}</h3>
            <p className="text-sm text-gray-400">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Last Captured</p>
          <p className="text-2xl font-bold text-blue-300">Today</p>
          <p className="text-xs text-gray-500 mt-2">India ₹10</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Highest Grade</p>
          <p className="text-2xl font-bold text-green-300">UNC</p>
          <p className="text-xs text-gray-500 mt-2">Uncirculated</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Total Value</p>
          <p className="text-2xl font-bold text-purple-300">$0</p>
          <p className="text-xs text-gray-500 mt-2">Pending valuation sync</p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">✨ Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            '🤖 AI-Powered Identification with Gemini Vision',
            '📱 Mobile-First Capture with Offline Support',
            '☁️ Auto-Sync When Wi-Fi Available',
            '💾 Local Storage with Sync Queue Management',
            '📊 Advanced Filtering & Sorting',
            '💰 Multi-Source Valuation (Coming Soon)',
          ].map(feature => (
            <div key={feature} className="flex items-start gap-3">
              <span className="text-lg">✓</span>
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
