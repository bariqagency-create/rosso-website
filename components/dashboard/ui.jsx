'use client';

import React, { useEffect } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';

export const cx = (...c) => c.filter(Boolean).join(' ');

// ── Stat card ─────────────────────────────────────────────────
// Uses clamp() so big EGP values (e.g. "EGP 1,234,567") shrink on small cards
// rather than overflow. Padding + label sizing also reduces on mobile.
export function StatCard({ label, value, accent = '#FFFFFF', highlight, hint }) {
  return (
    <div className={cx(
      'bg-[#0A0A0A] px-3 md:px-5 py-4 md:py-6 flex flex-col gap-1 md:gap-1.5 transition-colors overflow-hidden',
      highlight ? 'bg-[#E10600]/5' : 'hover:bg-white/[0.02]'
    )}>
      <span
        className="mono-font leading-none break-words"
        style={{ color: accent, fontSize: 'clamp(1.05rem, 4vw, 1.85rem)' }}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </span>
      <span className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-white/40 truncate">{label}</span>
      {hint && <span className="text-[10px] text-white/30 hidden md:inline">{hint}</span>}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────
export function SectionHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        {eyebrow && <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-[#E10600] font-bold">— {eyebrow}</span>}
        <h2 className="display-font text-2xl md:text-3xl uppercase mt-2 leading-tight">{title}</h2>
        {subtitle && <p className="text-white/50 text-sm mt-1.5 max-w-xl">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm anim-fade-up"
         onClick={onClose}>
      <div className={cx('bg-[#0F0F0F] border border-white/10 w-full max-h-[90vh] flex flex-col', wide ? 'max-w-3xl' : 'max-w-lg')}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-4 border-b border-white/5">
          <h3 className="display-font text-lg md:text-xl uppercase">{title}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 md:px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 md:px-6 py-4 border-t border-white/5 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form field wrappers ───────────────────────────────────────
export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      <span className="text-[10px] uppercase tracking-widest text-white/50 mb-1.5 block">{label}</span>
      {children}
      {hint && !error && <span className="text-[10px] text-white/30 mt-1 block">{hint}</span>}
      {error && <span className="text-[10px] text-[#E10600] mt-1 block">{error}</span>}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className={cx(
        'w-full bg-black/40 border border-white/10 focus:border-[#E10600] outline-none py-2.5 px-3 text-sm placeholder-white/30 transition-colors',
        props.className
      )}
    />
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className={cx(
        'w-full bg-black/40 border border-white/10 focus:border-[#E10600] outline-none py-2.5 px-3 text-sm placeholder-white/30 transition-colors resize-none',
        props.className
      )}
    />
  );
}

export function Select({ children, ...rest }) {
  return (
    <select
      {...rest}
      className={cx(
        'w-full bg-black/40 border border-white/10 focus:border-[#E10600] outline-none py-2.5 px-3 text-sm transition-colors',
        rest.className
      )}>
      {children}
    </select>
  );
}

// ── Primary buttons ───────────────────────────────────────────
export function PrimaryButton({ children, className, ...rest }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E10600] hover:bg-[#FF1A0F] disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-white text-[11px] uppercase tracking-widest font-bold transition-all',
        className
      )}>
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...rest }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 px-3 py-2 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] uppercase tracking-widest transition-all',
        className
      )}>
      {children}
    </button>
  );
}

// ── Inline error / success banners ────────────────────────────
export function ErrorBanner({ children, onRetry }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-[#E10600]/10 border border-[#E10600]/40 text-sm text-white/90">
      <AlertTriangle size={16} className="text-[#E10600] shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
      {onRetry && (
        <button onClick={onRetry}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E10600]/40 hover:border-[#E10600] hover:bg-[#E10600]/20 text-[10px] uppercase tracking-widest transition-all">
          Retry
        </button>
      )}
    </div>
  );
}

export function SuccessTick({ visible }) {
  if (!visible) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[#25D366]">
      <Check size={11} />
      Saved
    </span>
  );
}

// ── Confirm modal ─────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title = 'Delete?', message, danger = true }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-white/70">{message}</p>
      <div className="mt-6 flex gap-2 justify-end">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <button onClick={onConfirm}
                className={cx(
                  'inline-flex items-center gap-2 px-4 py-2.5 text-white text-[11px] uppercase tracking-widest font-bold transition-all',
                  danger ? 'bg-[#E10600] hover:bg-[#FF1A0F]' : 'bg-[#25D366] hover:bg-[#1ebd57]'
                )}>
          Confirm
        </button>
      </div>
    </Modal>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function Empty({ icon, title, hint, action }) {
  return (
    <div className="bg-black/30 border border-white/10 px-6 py-12 text-center">
      {icon && <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E10600]/10 border border-[#E10600]/30 mb-4">{icon}</div>}
      <h3 className="display-font text-lg md:text-xl uppercase">{title}</h3>
      {hint && <p className="text-white/50 text-sm mt-2 max-w-md mx-auto">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
