import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ShieldCheck, MessageSquare, Lock, Key, CheckCircle2, AlertTriangle, ExternalLink, X, User } from 'lucide-react';

interface ClientLicenseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
}

export const ClientLicenseViewModal: React.FC<ClientLicenseViewModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
}) => {
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getClientLicenseInfo()
        .then(res => {
          setLicenseInfo(res?.license || null);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContactDevWhatsApp = () => {
    const acc = licenseInfo?.mt5Account || 'my account';
    const msg = `Hi Dennis1.0 Developer! 👋 I am running Dennis 1.0 EA on MT5 (Account #${acc}) via Glera Bridge. I need assistance with my license / configuration.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121316] border border-zinc-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">EA License & Security</h3>
              <p className="text-xs text-zinc-400 font-mono">Managed by EA Developer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-4 font-mono">
          {/* Status Banner */}
          <div className="p-3.5 rounded-2xl bg-[#08080A] border border-emerald-500/30 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-400 block">Authorized Dennis1.0 Terminal</span>
              <span className="text-[11px] text-zinc-400">Your EA license is active and authorized for automated trade management.</span>
            </div>
          </div>

          {/* License Metadata */}
          <div className="bg-[#08080A] border border-zinc-800 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
              <span className="text-zinc-400">Assigned Trader</span>
              <span className="font-bold text-white">{licenseInfo?.clientName || 'Trader'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
              <span className="text-zinc-400">Allowed MT5 Account</span>
              <span className="font-bold text-amber-400">{licenseInfo?.mt5Account ? `#${licenseInfo.mt5Account}` : 'Universal'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
              <span className="text-zinc-400">License Key</span>
              <span className="font-bold text-zinc-300 font-mono text-[11px]">
                {licenseInfo?.maskedKey || 'gb_ea_••••••••••••44f5'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Plan & Validity</span>
              <span className="font-bold text-emerald-400">
                {licenseInfo?.expiresAt ? `Valid to ${new Date(licenseInfo.expiresAt).toLocaleDateString()}` : '⭐ Lifetime VIP'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            EA keys are distributed directly by the Dennis1.0 developer to protect the algorithm. If you need key renewals or a new account authorization, contact the developer.
          </p>

          {/* Contact Developer on WhatsApp */}
          <button
            onClick={handleContactDevWhatsApp}
            className="w-full py-3 px-4 rounded-xl font-extrabold text-xs text-black bg-[#25D366] hover:bg-[#22c55e] transition-all shadow-md shadow-[#25D366]/20 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Contact Developer on WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Developer PIN login trigger */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Are you the developer?</span>
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
            >
              <Lock className="w-3 h-3" />
              <span>Developer Admin Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
