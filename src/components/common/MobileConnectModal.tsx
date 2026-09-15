import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { QrCodeSvg } from './QrCodeSvg';
import { useApp } from '../../context/AppContext';
import { Smartphone, Copy, Check, ExternalLink, ShieldCheck, Zap, Camera, MapPin } from 'lucide-react';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({ isOpen, onClose }) => {
  const { navigateTo } = useApp();
  const [copied, setCopied] = useState(false);

  // Generate mobile URL with hash route
  const getMobileUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}#/mobile-dashcam`;
  };

  const mobileUrl = getMobileUrl();

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenOnDevice = () => {
    onClose();
    navigateTo('mobile-dashcam');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Smartphone as Mobile Bus Onboard Camera"
      size="lg"
    >
      <div className="space-y-5">
        <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-3 text-cyan-200 text-xs flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Mobile Edge Telemetry Node: </span>
            Turns any smartphone or connected camera into an intelligent roving bus sensing platform equipped with edge computer vision, real GPS tracking, and automatic municipal defect synchronization.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          {/* QR Code Column */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <QrCodeSvg value={mobileUrl} size={180} />
            <div className="text-center">
              <span className="text-xs font-mono font-bold text-slate-200 block">
                Scan with Smartphone Camera
              </span>
              <span className="text-[11px] text-slate-400">
                Works instantly in Safari / Chrome on iOS & Android
              </span>
            </div>
          </div>

          {/* Instructions & Link */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                How to Connect Mobile Sensing Node:
              </div>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
                <li>Scan the QR code or open the link on your mobile phone browser.</li>
                <li>Tap <strong className="text-cyan-300">Allow</strong> when requested for Camera & GPS access permissions.</li>
                <li>Point the phone camera at the road or any picture of a pothole/hazard.</li>
                <li>Watch the onboard neural network detect the defect and transmit it to this command center in real-time!</li>
              </ol>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-[11px] font-mono text-slate-400 block">Direct Mobile URL:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={mobileUrl}
                  className="w-full bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 rounded px-2.5 py-1.5 select-all focus:outline-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={handleOpenOnDevice}
                icon={<Camera className="w-4 h-4" />}
              >
                Launch Onboard Camera on This Device
              </Button>
            </div>
          </div>
        </div>

        {/* Feature Capabilities Badge Strip */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
          <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
            <MapPin className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-slate-200">Real GPS Fix</div>
            <div className="text-[10px] text-slate-400">Lat/Lng + Speed km/h</div>
          </div>
          <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
            <Camera className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-slate-200">Edge Optical AI</div>
            <div className="text-[10px] text-slate-400">Pothole & ANPR BBoxes</div>
          </div>
          <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <div className="text-[11px] font-bold text-slate-200">Auto PWD Ticket</div>
            <div className="text-[10px] text-slate-400">Instant Dispatch</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
