import React, { useState } from 'react';
import { EALicense } from '../types';
import { MessageSquare, Copy, Check, ExternalLink, Share2, X, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';

interface WhatsAppShareModalProps {
  license: EALicense | null;
  serverUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  license,
  serverUrl,
  isOpen,
  onClose,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(license?.phoneNumber || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !license) return null;

  const dashboardUrl = typeof window !== 'undefined' ? window.location.origin : 'https://glera-bridge.app';

  const planLabel = license.plan === 'LIFETIME'
    ? '⭐ Lifetime VIP License'
    : license.plan === 'TRIAL_7D'
    ? '⏳ 7-Day Free Trial'
    : license.plan === 'MONTHLY'
    ? '📅 30-Day Monthly Active'
    : 'Custom License';

  const expiryText = license.expiresAt
    ? `📅 *Expires On:* ${new Date(license.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `⭐ *Validity:* Lifetime (No Expiration)`;

  const messageTemplate = 
`🤖 *DENNIS 1.0 EA — MT5 ACTIVATION KEY*
----------------------------------------
👤 *Trader / Client:* ${license.clientName}
🔑 *InpApiKey:* \`${license.connectionKey}\`
🌐 *InpServerUrl:* \`${serverUrl}\`
🎯 *Allowed MT5 Account:* ${license.mt5Account === 'Any' ? 'Any Account' : `#${license.mt5Account}`}
📋 *License Plan:* ${planLabel}
${expiryText}

📋 *QUICK 3-STEP MT5 VPS SETUP:*
1️⃣ In MT5, open *Tools* ➔ *Options* ➔ *Expert Advisors*
2️⃣ Check *"Allow WebRequest for listed URL"* and add:
   \`${serverUrl}\`
3️⃣ Attach *Dennis1.0 EA* to any chart, paste your *InpApiKey*, and turn ON *Algo Trading*!

📱 *Live Remote Dashboard:*
${dashboardUrl}
----------------------------------------
_Automated Key Dispatch by Glera Bridge_`;

  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageTemplate);
    let url = '';
    if (cleanPhone) {
      const formattedNumber = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
      url = `https://wa.me/${formattedNumber}?text=${encoded}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encoded}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Dennis 1.0 EA Key - ${license.clientName}`,
          text: messageTemplate,
        });
      } catch {}
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121316] border border-zinc-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/10">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                <span>Send EA Key on WhatsApp</span>
                <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full font-mono font-bold">
                  Direct Dispatch
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Recipient: <span className="text-amber-400 font-semibold">{license.clientName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono">
              Client WhatsApp Number (with country code):
            </label>
            <div className="relative">
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="e.g. +27 71 234 5678 or +1 555 0199"
                className="w-full bg-[#08080A] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#25D366] pl-9"
              />
              <PhoneCall className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              If left blank, clicking WhatsApp will open your WhatsApp contact picker to choose any contact or group.
            </p>
          </div>

          {/* Message Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                Message Preview
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Formatted with Markdown</span>
            </div>
            <div className="bg-[#08080A] border border-zinc-800/90 rounded-2xl p-3.5 font-mono text-xs text-zinc-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap selection:bg-[#25D366]/30">
              {messageTemplate}
            </div>
          </div>

          {/* Key Summary Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">MT5 Account</span>
              <span className="font-bold text-amber-400">{license.mt5Account}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">Status</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {license.status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-black bg-[#25D366] hover:bg-[#22c55e] transition-all shadow-lg shadow-[#25D366]/25 flex items-center justify-center gap-2 active:scale-98"
            >
              <MessageSquare className="w-4 h-4 text-black fill-current" />
              <span>Open in WhatsApp & Send Now</span>
              <ExternalLink className="w-3.5 h-3.5 text-black ml-1" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyText}
                className="py-2.5 px-3 rounded-xl text-xs font-bold text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-xl text-xs font-bold text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Share via Device</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
