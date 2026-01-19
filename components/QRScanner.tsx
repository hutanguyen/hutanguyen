import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Copy, RefreshCw, AlertCircle, ExternalLink, Zap } from 'lucide-react';

export const QRScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [autoRedirect, setAutoRedirect] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Helper to check URL
  const isUrl = (text: string) => {
    try {
      // Basic check to ensure it has protocol
      const url = new URL(text);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  useEffect(() => {
    const scannerId = "reader";
    
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
    }

    const scanner = new Html5QrcodeScanner(
      scannerId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      /* verbose= */ false
    );
    
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        scanner.pause(true); 
      },
      (errorMessage) => {
        // console.log(errorMessage);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to cleanup scanner", err));
        scannerRef.current = null;
      }
    };
  }, []);

  // Effect to handle Auto Redirect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (scanResult && autoRedirect && isUrl(scanResult)) {
      setCountdown(3); // Start countdown from 3 (visually safer than instant jump)
      
      // Reduce countdown for visual feedback or instant redirect?
      // For "Auto redirect" requested, usually immediate is expected, but a small delay
      // helps user realize something happened. Let's do a fast redirect (1s).
      
      timer = setTimeout(() => {
        window.location.href = scanResult;
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [scanResult, autoRedirect]);

  const handleReset = () => {
    setScanResult(null);
    setCountdown(null);
    if (scannerRef.current) {
      scannerRef.current.resume();
    }
  };

  const copyToClipboard = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult);
      alert('Đã sao chép nội dung vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full space-y-4">
      
      {/* Settings Bar */}
      <div className="w-full bg-gray-900/50 p-3 rounded-xl border border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
             <Zap className={`w-4 h-4 ${autoRedirect ? 'text-yellow-400' : 'text-gray-500'}`} />
             Tự động mở liên kết
          </div>
          <button 
             onClick={() => setAutoRedirect(!autoRedirect)}
             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoRedirect ? 'bg-green-600' : 'bg-gray-700'}`}
          >
             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${autoRedirect ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
      </div>

      {!scanResult && (
        <div className="w-full">
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-4 flex gap-3">
             <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
             <p className="text-sm text-blue-200">
               Cấp quyền Camera để bắt đầu. {autoRedirect ? "Ứng dụng sẽ tự động chuyển hướng nếu quét được URL." : ""}
             </p>
          </div>
          <div id="reader" className="w-full overflow-hidden rounded-xl shadow-inner bg-black border-4 border-gray-700"></div>
        </div>
      )}

      {scanResult && (
        <div className="w-full animate-fadeInUp">
          <div className="bg-gray-800 rounded-xl border border-green-700/50 shadow-lg p-6 text-center relative overflow-hidden">
             
             {/* Auto Redirect Loading Overlay */}
             {autoRedirect && isUrl(scanResult) && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
                   <div className="h-full bg-green-500 animate-[width_1s_linear_forwards]" style={{width: '0%'}}></div>
                </div>
             )}

             <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-800">
               <CheckIcon className="w-8 h-8 text-green-500" />
             </div>
             
             <h3 className="text-xl font-bold text-white mb-2">Quét thành công!</h3>
             
             {autoRedirect && isUrl(scanResult) && (
                 <p className="text-sm text-green-400 mb-4 animate-pulse">
                    Đang chuyển hướng đến trang web...
                 </p>
             )}
             
             <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700 break-all text-green-400 font-mono text-sm">
               {scanResult}
             </div>

             <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 font-medium transition-colors"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Sao chép
                </button>
                
                {isUrl(scanResult) && (
                  <a
                    href={scanResult}
                    className="flex items-center justify-center px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Truy cập ngay
                  </a>
                )}

                <button
                  onClick={handleReset}
                  className="flex items-center justify-center px-4 py-2 bg-gray-800 text-green-500 border border-green-700 rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Quét lại
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);