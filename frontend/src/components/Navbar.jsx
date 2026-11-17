import React from 'react';
import { Droplets, MapPin, PlusCircle, ShieldAlert, Award, UserCheck, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  unreadAlertsCount = 0,
}) {
  const { user, quickDemoSwitch, logout } = useAuth();

  const roleBadgeColors = {
    citizen: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tester: 'bg-sky-50 text-sky-700 border-sky-200',
    authority: 'bg-amber-50 text-amber-800 border-amber-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Identity (Click to return to Live Risk Map) */}
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          title="Go to Live Risk Map"
          className="flex items-center gap-3 text-left cursor-pointer group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-sky-300 transition-colors">
                JalSuraksha
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Group G315 • SDG 6 & 3
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Community Water Contamination Reporting & Live Risk-Mapping Portal (Greater Noida / GB Nagar)
            </p>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/70">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'map'
                ? 'bg-sky-500 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Live Risk Map
          </button>

          <button
            onClick={() => onOpenReportModal(null)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
          >
            <PlusCircle className="w-4 h-4" />
            Report Source / Test
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-sky-500 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            PHED Authority Dashboard
            {unreadAlertsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('standards')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'standards'
                ? 'bg-sky-500 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Award className="w-4 h-4" />
            BIS IS 10500 Guide
          </button>
        </nav>

        {/* Role Switcher & Active User Profile */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] text-slate-400 font-medium">Role View:</span>
            <select
              aria-label="Switch Role View"
              value={user ? user.role : 'anonymous'}
              onChange={(e) => quickDemoSwitch(e.target.value)}
              className="bg-slate-900 text-xs font-semibold text-white px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="anonymous">Public Citizen (No Login)</option>
              <option value="citizen">Logged-in Citizen (Ramesh)</option>
              <option value="tester">Field Tester (Abhibhav Sharma)</option>
              <option value="authority">PHED Officer (Er. Shivam Upmanyu)</option>
              <option value="admin">Platform Admin (G315)</option>
            </select>
          </div>

          {user && (
            <div className="hidden xl:flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  roleBadgeColors[user.role] || 'bg-slate-100 text-slate-800'
                }`}
              >
                {user.name}
              </span>
              <button
                onClick={logout}
                title="Switch to Anonymous Citizen"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
