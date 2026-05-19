'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, LayoutDashboard, Lock, LogOut, Eye, EyeOff, AlertTriangle,
  Calendar, Package, Receipt, Users, BarChart3, ListChecks, Menu, X, Plus,
} from 'lucide-react';
import ManualBookingModal from './dashboard/ManualBookingModal';

import {
  getBookings, getLocalBookings, supabaseConfigured,
} from '@/lib/bookings';
import { listInventoryParts } from '@/lib/inventory';
import { listAllUsedParts } from '@/lib/usedParts';
import { listExpenses } from '@/lib/expenses';
import { listSalaries } from '@/lib/salaries';

import OverviewTab from './dashboard/OverviewTab';
import BookingsTab from './dashboard/BookingsTab';
import InventoryTab from './dashboard/InventoryTab';
import ExpensesTab from './dashboard/ExpensesTab';
import SalariesTab from './dashboard/SalariesTab';
import ReportsTab from './dashboard/ReportsTab';

// ── Auth gate ─────────────────────────────────────────────────
const SESSION_AUTH_KEY = 'rosso_dashboard_auth';
const DASHBOARD_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD;

export default function BookingsDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_AUTH_KEY) === '1') {
        setUnlocked(true);
      }
    } catch {}
    setAuthChecked(true);
  }, []);

  const onUnlock = () => {
    try { window.sessionStorage.setItem(SESSION_AUTH_KEY, '1'); } catch {}
    setUnlocked(true);
  };
  const onLogout = () => {
    try { window.sessionStorage.removeItem(SESSION_AUTH_KEY); } catch {}
    setUnlocked(false);
  };

  if (!authChecked) return null;
  if (!unlocked) return <PasswordScreen onUnlock={onUnlock} />;
  return <Dashboard onLogout={onLogout} />;
}

// ── Password screen ───────────────────────────────────────────
function PasswordScreen({ onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const missingEnv = !DASHBOARD_PASSWORD;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (missingEnv) return;
    if (value === DASHBOARD_PASSWORD) {
      setError('');
      onUnlock();
    } else {
      setError('Incorrect password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-5"
         style={{ fontFamily: "'Archivo', sans-serif" }}>
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs uppercase tracking-[0.2em] mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to site
        </Link>

        <div className="relative bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-white/10 p-8 md:p-10">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#E10600]" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#E10600]" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#E10600]" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#E10600]" />

          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-14 h-14 bg-[#E10600]/10 border border-[#E10600]/40 flex items-center justify-center mb-5">
              <Lock size={22} className="text-[#E10600]" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#E10600] font-bold">— PROTECTED</span>
            <h1 className="display-font text-2xl md:text-3xl uppercase mt-3 leading-tight">Dashboard Access</h1>
            <p className="text-white/50 text-sm mt-2 max-w-xs">Enter the password to view bookings.</p>
          </div>

          {missingEnv ? (
            <div className="flex items-start gap-3 px-4 py-3 bg-[#E10600]/10 border border-[#E10600]/40 text-sm text-white/90">
              <AlertTriangle size={16} className="text-[#E10600] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold mb-1">Configuration error</div>
                <div className="text-white/70 text-xs leading-relaxed">
                  <code className="mono-font text-[#E10600]">NEXT_PUBLIC_DASHBOARD_PASSWORD</code> is not set.
                  Add it to your environment variables (e.g. <code className="mono-font">.env.local</code> or your Vercel project settings) and redeploy.
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-white/50 mb-2 block">Password</span>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={value}
                         onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
                         autoFocus autoComplete="current-password"
                         className="w-full bg-black/40 border border-white/10 focus:border-[#E10600] outline-none py-3 pl-4 pr-11 text-sm placeholder-white/30 transition-colors"
                         placeholder="••••••••" aria-invalid={!!error || undefined} />
                  <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1}
                          aria-label={show ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/40 hover:text-white">
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </label>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#E10600]/10 border border-[#E10600]/40 text-xs text-white/90">
                  <AlertTriangle size={12} className="text-[#E10600] shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={value.length === 0}
                      className="w-full py-3.5 bg-[#E10600] hover:bg-[#FF1A0F] disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-white text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2">
                <Lock size={12} /> Unlock dashboard
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] uppercase tracking-widest text-white/30 mt-6">
          Access is remembered for this browser session.
        </p>
      </div>
    </div>
  );
}

// ── Dashboard container ──────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Overview',  Icon: BarChart3 },
  { key: 'bookings',  label: 'Bookings',  Icon: ListChecks },
  { key: 'inventory', label: 'Inventory', Icon: Package },
  { key: 'expenses',  label: 'Expenses',  Icon: Receipt },
  { key: 'salaries',  label: 'Salaries',  Icon: Users },
  { key: 'reports',   label: 'Reports',   Icon: Calendar },
];

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [inventoryInitialFilter, setInventoryInitialFilter] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [usedParts, setUsedParts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const navigate = useCallback((target, opts) => {
    if (target === 'inventory') setInventoryInitialFilter(opts || null);
    setTab(target);
    setMobileNavOpen(false);
  }, []);

  const refresh = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    setLoadError('');
    try {
      const [b, up, inv, ex, sal] = await Promise.all([
        getBookings(),
        listAllUsedParts().catch(() => []),
        listInventoryParts().catch(() => []),
        listExpenses().catch(() => []),
        listSalaries().catch(() => []),
      ]);
      setBookings(b);
      setUsedParts(up);
      setInventory(inv);
      setExpenses(ex);
      setSalaries(sal);
    } catch (e) {
      setLoadError(e?.message || 'Failed to load.');
      try { setBookings(getLocalBookings()); } catch {}
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh({ silent: true });
    window.addEventListener('rosso:bookings-changed', onChange);
    return () => window.removeEventListener('rosso:bookings-changed', onChange);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#E10600] selection:text-white"
         style={{ fontFamily: "'Archivo', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/85 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-14 md:h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group min-w-0">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span className="text-[11px] md:text-xs uppercase tracking-[0.2em] truncate hidden xs:inline">Back to site</span>
            <span className="text-[11px] uppercase tracking-[0.2em] xs:hidden">Site</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
            <LayoutDashboard size={14} className="text-[#E10600]" />
            <span>ROSSO admin</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick "Add manual" CTA — compact on mobile */}
            <button onClick={() => setManualOpen(true)} title="Add manual booking / walk-in"
                    className="inline-flex items-center gap-2 px-2.5 md:px-4 py-2 bg-[#E10600] hover:bg-[#FF1A0F] text-white text-[10px] md:text-xs uppercase tracking-widest font-bold transition-all">
              <Plus size={12} />
              <span className="hidden sm:inline">Add manual</span>
            </button>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu"
                    className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 transition-all">
              <Menu size={18} />
            </button>

            {/* Logout — visible on desktop only; on mobile it's in the drawer */}
            <button onClick={onLogout} title="Log out" aria-label="Log out"
                    className="hidden md:inline-flex items-center gap-2 px-3 md:px-4 py-2 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 hover:text-[#E10600] text-xs uppercase tracking-widest transition-all">
              <LogOut size={12} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Desktop / tablet tab bar */}
        <nav className="hidden md:block max-w-[1400px] mx-auto px-4 md:px-10 border-t border-white/5">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button key={key} onClick={() => setTab(key)}
                        className={[
                          'shrink-0 inline-flex items-center gap-2 px-3 md:px-4 py-3 text-[11px] uppercase tracking-widest transition-colors border-b-2',
                          active
                            ? 'text-white border-[#E10600]'
                            : 'text-white/50 border-transparent hover:text-white hover:border-white/20'
                        ].join(' ')}>
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile current-tab indicator strip */}
        <div className="md:hidden max-w-[1400px] mx-auto px-4 border-t border-white/5 py-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/70">
          {(() => {
            const cur = TABS.find(t => t.key === tab);
            const Icon = cur?.Icon;
            return (
              <>
                {Icon && <Icon size={13} className="text-[#E10600]" />}
                <span>{cur?.label}</span>
              </>
            );
          })()}
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm anim-fade-up"
             onClick={() => setMobileNavOpen(false)}>
          <div className="absolute top-0 right-0 bottom-0 w-[80%] max-w-xs bg-[#0F0F0F] border-l border-white/10 flex flex-col"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/5">
              <span className="text-xs uppercase tracking-[0.2em] text-white/60 inline-flex items-center gap-2">
                <LayoutDashboard size={14} className="text-[#E10600]" />
                ROSSO admin
              </span>
              <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu"
                      className="w-10 h-10 inline-flex items-center justify-center text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {TABS.map(({ key, label, Icon }) => {
                const active = tab === key;
                return (
                  <button key={key} onClick={() => { setTab(key); setMobileNavOpen(false); }}
                          className={[
                            'w-full flex items-center gap-3 px-3 py-3 text-sm uppercase tracking-[0.18em] border-l-2 transition-colors mb-1',
                            active
                              ? 'border-[#E10600] bg-[#E10600]/10 text-white font-bold'
                              : 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.04]'
                          ].join(' ')}>
                    <Icon size={15} className={active ? 'text-[#E10600]' : 'text-white/50'} />
                    {label}
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-white/5">
              <button onClick={() => { setMobileNavOpen(false); onLogout(); }}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 hover:text-[#E10600] text-xs uppercase tracking-widest transition-all">
                <LogOut size={12} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-14">
        {loading && bookings.length === 0 && usedParts.length === 0 && inventory.length === 0 ? (
          <div className="bg-black/30 border border-white/10 px-6 py-14 text-center">
            <div className="inline-block w-6 h-6 border-2 border-white/15 border-t-[#E10600] rounded-full animate-spin mb-3" />
            <p className="text-white/50 text-xs uppercase tracking-widest">Loading dashboard…</p>
          </div>
        ) : (
          <>
            {tab === 'overview'  && <OverviewTab  bookings={bookings} usedParts={usedParts} inventory={inventory} expenses={expenses} salaries={salaries} onNavigate={navigate} />}
            {tab === 'bookings'  && <BookingsTab  bookings={bookings} usedParts={usedParts} inventory={inventory}
                                                  refresh={() => refresh({ silent: true })}
                                                  loadError={loadError} supabaseConfigured={supabaseConfigured} />}
            {tab === 'inventory' && <InventoryTab inventory={inventory} refresh={() => refresh({ silent: true })} initialFilter={inventoryInitialFilter} />}
            {tab === 'expenses'  && <ExpensesTab  expenses={expenses}   refresh={() => refresh({ silent: true })} />}
            {tab === 'salaries'  && <SalariesTab  salaries={salaries}   refresh={() => refresh({ silent: true })} />}
            {tab === 'reports'   && <ReportsTab   bookings={bookings} usedParts={usedParts} inventory={inventory} expenses={expenses} salaries={salaries} />}
          </>
        )}
      </main>

      <ManualBookingModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        refresh={() => refresh({ silent: true })}
      />
    </div>
  );
}
