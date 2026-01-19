import React, { useState } from 'react';
import { QRGenerator } from './components/QRGenerator';
import { QRScanner } from './components/QRScanner';
import { QrCode, Scan } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'scan'>('create');

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8 font-sans text-gray-100">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header - Compact Version */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-lg shadow-green-900/30">
                  <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  QR Pro Studio
                </h1>
                <p className="text-xs text-gray-400">
                  Tạo và Quét mã QR chuyên nghiệp
                </p>
              </div>
           </div>

          {/* Navigation Tabs - Compact */}
          <div className="bg-gray-900/50 p-1 rounded-lg border border-gray-700 flex">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <QrCode size={16} />
              Tạo Mã
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'scan'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Scan size={16} />
              Quét Mã
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700/80">
          {activeTab === 'create' ? (
            <div className="p-4 sm:p-6 animate-fadeIn">
              <QRGenerator />
            </div>
          ) : (
            <div className="p-6 sm:p-8 animate-fadeIn flex justify-center min-h-[400px]">
              <QRScanner />
            </div>
          )}
        </div>
        
        <footer className="text-center text-gray-600 text-xs">
          &copy; {new Date().getFullYear()} QR Pro Studio.
        </footer>
      </div>
    </div>
  );
};

export default App;