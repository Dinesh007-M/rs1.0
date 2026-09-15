import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({ value, size = 200, className = '' }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800 ${className}`}
      >
        <span className="text-xs text-slate-500 font-mono animate-pulse">Generating QR...</span>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`p-2 bg-white rounded-lg shadow-md flex items-center justify-center ${className}`}
    >
      <img
        src={dataUrl}
        alt={`QR code for ${value}`}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
