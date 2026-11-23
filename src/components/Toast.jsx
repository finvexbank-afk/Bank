import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';

const VARIANTS = {
  success: { bg: '#ECFDF5', border: '#A7F3D0', accent: '#059669', Icon: CheckCircle2, iconColor: '#059669' },
  error: { bg: '#FEF2F2', border: '#FECACA', accent: '#DC2626', Icon: XCircle, iconColor: '#DC2626' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', accent: '#D97706', Icon: AlertTriangle, iconColor: '#D97706' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', accent: '#2563EB', Icon: Info, iconColor: '#2563EB' }
};

const TOAST_EVENT = 'finvex-toast';
const CONFIRM_EVENT = 'finvex-confirm';

const dispatchToast = (detail) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
};

export const notify = (options) => {
  const detail = typeof options === 'string' ? { message: options } : options || {};
  dispatchToast({ type: 'info', duration: 4200, ...detail });
};
notify.success = (message, title) => dispatchToast({ type: 'success', message, title, duration: 4200 });
notify.error = (message, title) => dispatchToast({ type: 'error', message, title, duration: 5200 });
notify.warning = (message, title) => dispatchToast({ type: 'warning', message, title, duration: 5000 });
notify.info = (message, title) => dispatchToast({ type: 'info', message, title, duration: 4200 });

export const ask = (options) => new Promise((resolve) => {
  if (typeof window === 'undefined') {
    resolve(false);
    return;
  }
  window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, {
    detail: { tone: 'danger', ...(options || {}), resolve }
  }));
});

export const ToastProvider = ({ children }) => {
  const { language } = useLanguage();
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((detail) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const type = VARIANTS[detail.type] ? detail.type : 'info';
    setToasts((prev) => [...prev, { ...detail, id, type }].slice(-4));
    if (detail.duration !== 0) {
      const timer = setTimeout(() => dismiss(id), detail.duration || 4200);
      timers.current.set(id, timer);
    }
  }, [dismiss]);

  useEffect(() => {
    const onToast = (event) => showToast(event.detail || {});
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [showToast]);

  useEffect(() => {
    const onConfirm = (event) => setConfirmState(event.detail || null);
    window.addEventListener(CONFIRM_EVENT, onConfirm);
    return () => window.removeEventListener(CONFIRM_EVENT, onConfirm);
  }, []);

  useEffect(() => {
    if (!confirmState) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        confirmState.resolve(false);
        setConfirmState(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmState]);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
  }, []);

  const defaultTitle = (type) => t(`toast.${type}`, language);
  const confirmVariant = confirmState?.tone === 'danger' ? VARIANTS.error : VARIANTS.info;
  const ConfirmIcon = confirmState?.tone === 'danger' ? ShieldAlert : Info;

  return (
    <>
      {children}

      <div className="finvex-toast-stack" aria-live="polite">
        {toasts.map((item) => {
          const variant = VARIANTS[item.type] || VARIANTS.info;
          const Icon = variant.Icon;
          return (
            <div
              key={item.id}
              className="finvex-toast"
              role="status"
              style={{ background: '#FFFFFF', borderColor: variant.border, boxShadow: '0 18px 45px rgba(15,23,42,0.14)' }}
            >
              <span className="finvex-toast-accent" style={{ background: variant.accent }} />
              <div className="finvex-toast-icon" style={{ background: variant.bg, color: variant.iconColor }}>
                <Icon size={19} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="finvex-toast-title">{item.title || defaultTitle(item.type)}</p>
                {item.message && <p className="finvex-toast-message">{item.message}</p>}
              </div>
              <button className="finvex-toast-close" onClick={() => dismiss(item.id)} aria-label={t('common.close', language)}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div
          className="finvex-confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              confirmState.resolve(false);
              setConfirmState(null);
            }
          }}
        >
          <div className="finvex-confirm-card" role="alertdialog" aria-modal="true">
            <div className="finvex-confirm-icon" style={{ background: confirmVariant.bg, color: confirmVariant.iconColor }}>
              <ConfirmIcon size={26} />
            </div>
            <h3 className="finvex-confirm-title">{confirmState.title || t('common.confirm', language)}</h3>
            {confirmState.message && <p className="finvex-confirm-message">{confirmState.message}</p>}
            <div className="finvex-confirm-actions">
              <button
                className="finvex-btn-secondary"
                onClick={() => { confirmState.resolve(false); setConfirmState(null); }}
              >
                {confirmState.cancelLabel || t('common.cancel', language)}
              </button>
              <button
                className="finvex-btn-primary"
                style={{ background: confirmState.tone === 'danger' ? '#DC2626' : '#0EA5E9' }}
                onClick={() => { confirmState.resolve(true); setConfirmState(null); }}
              >
                {confirmState.confirmLabel || t('common.confirm', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes finvexToastIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes finvexFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes finvexModalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .finvex-toast-stack {
          position: fixed;
          top: 22px;
          right: 22px;
          z-index: 4000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: min(380px, calc(100vw - 32px));
          pointer-events: none;
        }
        .finvex-toast {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 16px 16px 18px;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          pointer-events: auto;
          animation: finvexToastIn 0.28s cubic-bezier(.2,.8,.2,1) both;
          overflow: hidden;
        }
        .finvex-toast-accent {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }
        .finvex-toast-icon {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .finvex-toast-title {
          margin: 1px 0 3px;
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.3;
        }
        .finvex-toast-message {
          margin: 0;
          font-size: 13px;
          color: #475569;
          line-height: 1.45;
          word-break: break-word;
        }
        .finvex-toast-close {
          border: none;
          background: transparent;
          color: #94A3B8;
          cursor: pointer;
          padding: 3px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .finvex-toast-close:hover { background: #F1F5F9; color: #475569; }
        .finvex-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 5000;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: finvexFadeIn 0.2s ease both;
        }
        .finvex-confirm-card {
          width: min(440px, 100%);
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 22px;
          padding: 30px;
          box-shadow: 0 30px 70px rgba(15,23,42,0.25);
          animation: finvexModalIn 0.25s cubic-bezier(.2,.8,.2,1) both;
        }
        .finvex-confirm-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }
        .finvex-confirm-title {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
        }
        .finvex-confirm-message {
          margin: 0;
          font-size: 14px;
          color: #64748B;
          line-height: 1.55;
        }
        .finvex-confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 26px;
          flex-wrap: wrap;
        }
        .finvex-btn-secondary, .finvex-btn-primary {
          padding: 11px 20px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          border: 1px solid #E2E8F0;
        }
        .finvex-btn-secondary { background: white; color: #475569; }
        .finvex-btn-secondary:hover { background: #F8FAFC; }
        .finvex-btn-primary { color: white; border-color: transparent; }
        .finvex-btn-primary:hover { filter: brightness(0.96); }
        @media (max-width: 520px) {
          .finvex-toast-stack { top: 12px; right: 12px; left: 12px; width: auto; }
          .finvex-confirm-card { padding: 24px; }
        }
      `}</style>
    </>
  );
};

export default ToastProvider;
