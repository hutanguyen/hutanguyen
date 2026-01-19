import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { DotType, CornerSquareType, CornerDotType, QRConfig, FrameStyle } from '../types';
import { Download, Upload, Palette, Type, Image as ImageIcon, Frame, ChevronDown, ChevronRight, Square, Sliders, BoxSelect } from 'lucide-react';

const DEFAULT_CONFIG: QRConfig = {
  width: 500,
  height: 500,
  margin: 0,
  data: 'https://example.com',
  image: '',
  dotsOptions: {
    color: '#15803d',
    type: 'rounded'
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 10,
    imageSize: 0.4
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
    color: '#15803d'
  },
  cornersDotOptions: {
    type: 'dot',
    color: '#15803d'
  },
  frameOptions: {
    enabled: false,
    style: 'solid',
    color: '#15803d',
    thickness: 10,
    cornerRadius: 0 // Default: Square (No radius)
  }
};

export const QRGenerator: React.FC = () => {
  const [config, setConfig] = useState<QRConfig>(DEFAULT_CONFIG);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State to manage collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    appearance: false,
    frame: false,
    logo: false
  });

  const qrCode = useRef<QRCodeStyling>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    qrCode.current = new QRCodeStyling(DEFAULT_CONFIG);
    if (ref.current) {
      qrCode.current.append(ref.current);
    }
  }, []);

  useEffect(() => {
    if (qrCode.current) {
      qrCode.current.update(config);
    }
  }, [config]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleChange = (key: keyof QRConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFrameChange = (key: keyof QRConfig['frameOptions'], value: any) => {
    setConfig(prev => ({
      ...prev,
      frameOptions: {
        ...prev.frameOptions,
        [key]: value
      }
    }));
  };

  const handleDotStyleChange = (type: DotType) => {
    setConfig(prev => ({
      ...prev,
      dotsOptions: { ...prev.dotsOptions, type }
    }));
  };

  const handleCornerSquareStyleChange = (type: CornerSquareType) => {
    setConfig(prev => ({
      ...prev,
      cornersSquareOptions: { ...prev.cornersSquareOptions, type, color: prev.dotsOptions.color }
    }));
  };

  const handleCornerDotStyleChange = (type: CornerDotType) => {
    setConfig(prev => ({
      ...prev,
      cornersDotOptions: { ...prev.cornersDotOptions, type, color: prev.dotsOptions.color }
    }));
  };

  const handleColorChange = (color: string) => {
    setConfig(prev => ({
      ...prev,
      dotsOptions: { ...prev.dotsOptions, color },
      cornersSquareOptions: { ...prev.cornersSquareOptions, color, type: prev.cornersSquareOptions?.type || 'extra-rounded' },
      cornersDotOptions: { ...prev.cornersDotOptions, color, type: prev.cornersDotOptions?.type || 'dot' }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleChange('image', event.target.result as string);
          setExpandedSections(prev => ({ ...prev, logo: true }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Custom Download Logic to handle Border/Frame with Radius
  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      if (!config.frameOptions.enabled) {
        // Normal download if no frame
        if (qrCode.current) {
          await qrCode.current.download({ name: 'qr-pro-studio', extension: 'png' });
        }
      } else {
        // Custom canvas composition for Frame
        const rawBlob = await qrCode.current?.getRawData('png');
        if (!rawBlob) throw new Error("Failed to generate QR");

        const img = new Image();
        img.src = URL.createObjectURL(rawBlob);
        
        await new Promise((resolve) => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context not available");

        const border = config.frameOptions.thickness;
        const radius = config.frameOptions.cornerRadius;

        // Total size = QR size + border * 2
        canvas.width = img.width + (border * 2);
        canvas.height = img.height + (border * 2);

        // 1. Draw Background (White) for the whole area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw QR Code in the middle FIRST (so border draws on top)
        ctx.drawImage(img, border, border);

        // 3. Draw Frame ON TOP
        ctx.lineWidth = border;
        ctx.strokeStyle = config.frameOptions.color;
        
        // Handle dash styles
        if (config.frameOptions.style === 'dashed') {
           ctx.setLineDash([border * 2, border]);
        } else if (config.frameOptions.style === 'dotted') {
           ctx.setLineDash([border, border]);
        } else {
           ctx.setLineDash([]);
        }

        // Draw rounded rectangle
        ctx.beginPath();
        // Check for browser support of roundRect (Standard in 2024+) or fallback
        if (ctx.roundRect) {
            ctx.roundRect(border / 2, border / 2, canvas.width - border, canvas.height - border, radius);
        } else {
            // Fallback for older browsers
            const x = border / 2;
            const y = border / 2;
            const w = canvas.width - border;
            const h = canvas.height - border;
            const r = radius;
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }
        ctx.stroke();

        // 4. Download
        const link = document.createElement('a');
        link.download = 'qr-pro-frame.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Có lỗi xảy ra khi tải ảnh.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeLogo = () => {
    handleChange('image', '');
    setFileInputKey(Date.now());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* LEFT COLUMN: Settings */}
      <div className="lg:col-span-7 space-y-3">
        
        {/* SECTION 1: CONTENT */}
        <div className="bg-gray-900/40 rounded-xl border border-gray-700/50 overflow-hidden">
          <button 
            onClick={() => toggleSection('content')}
            className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
             <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-gray-200 text-sm">Nội dung QR</span>
             </div>
             {expandedSections.content ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
          
          {expandedSections.content && (
            <div className="p-4 border-t border-gray-700/50 animate-fadeIn">
               <textarea
                  rows={2}
                  value={config.data}
                  onChange={(e) => handleChange('data', e.target.value)}
                  className="block w-full rounded-lg bg-gray-900 border-gray-600 text-white placeholder-gray-500 border p-3 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none"
                  placeholder="https://example.com"
                />
            </div>
          )}
        </div>

        {/* SECTION 2: APPEARANCE */}
        <div className="bg-gray-900/40 rounded-xl border border-gray-700/50 overflow-hidden">
          <button 
            onClick={() => toggleSection('appearance')}
            className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
             <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-gray-200 text-sm">Giao diện & Màu sắc</span>
             </div>
             {expandedSections.appearance ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {expandedSections.appearance && (
            <div className="p-4 border-t border-gray-700/50 space-y-5 animate-fadeIn">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-400">Màu chủ đạo:</span>
                        <div className="flex items-center gap-2 bg-gray-900 px-2 py-1 rounded border border-gray-700">
                             <input
                                type="color"
                                value={config.dotsOptions.color}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                             />
                             <span className="font-mono text-xs text-gray-300">{config.dotsOptions.color}</span>
                        </div>
                     </div>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Dots */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Kiểu chấm</label>
                            <div className="grid grid-cols-3 gap-1">
                                {(['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'] as DotType[]).map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => handleDotStyleChange(style)}
                                        className={`px-1 py-1.5 text-[10px] font-medium rounded border transition-all truncate ${
                                            config.dotsOptions.type === style
                                                ? 'bg-green-600/20 text-green-400 border-green-500/50'
                                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                        }`}
                                    >
                                        {style.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Corners */}
                        <div>
                             <label className="block text-xs font-medium text-gray-400 mb-1.5">Viền góc</label>
                             <div className="flex gap-1 mb-2">
                                {(['square', 'extra-rounded', 'dot'] as CornerSquareType[]).map(type => (
                                     <button
                                        key={type}
                                        onClick={() => handleCornerSquareStyleChange(type)}
                                        className={`flex-1 py-1.5 text-[10px] font-medium rounded border transition-all ${
                                            config.cornersSquareOptions?.type === type 
                                            ? 'bg-green-600/20 text-green-400 border-green-500/50' 
                                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                        }`}
                                     >
                                        {type === 'extra-rounded' ? 'Rounded' : type}
                                     </button>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* SECTION 3: FRAME (BORDER) */}
        <div className="bg-gray-900/40 rounded-xl border border-gray-700/50 overflow-hidden">
           <button 
            onClick={() => toggleSection('frame')}
            className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
             <div className="flex items-center gap-2">
                <BoxSelect className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-gray-200 text-sm">Khung viền (Border)</span>
             </div>
             {expandedSections.frame ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

           {expandedSections.frame && (
             <div className="p-4 border-t border-gray-700/50 animate-fadeIn space-y-4">
                 
                 {/* Enable Toggle */}
                 <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                     <span className="text-sm font-medium text-gray-300">Bật khung viền</span>
                     <button 
                        onClick={() => handleFrameChange('enabled', !config.frameOptions.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.frameOptions.enabled ? 'bg-green-600' : 'bg-gray-600'}`}
                     >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${config.frameOptions.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                 </div>

                 {config.frameOptions.enabled && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Frame Style & Color */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">Kiểu viền</label>
                                <select 
                                    value={config.frameOptions.style}
                                    onChange={(e) => handleFrameChange('style', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2"
                                >
                                    <option value="solid">Nét liền (Solid)</option>
                                    <option value="dashed">Nét đứt (Dashed)</option>
                                    <option value="dotted">Chấm (Dotted)</option>
                                    <option value="double">Nét đôi (Double)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">Màu viền</label>
                                <div className="flex items-center gap-2 bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-700 h-[38px]">
                                    <input
                                        type="color"
                                        value={config.frameOptions.color}
                                        onChange={(e) => handleFrameChange('color', e.target.value)}
                                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                                    />
                                    <span className="font-mono text-xs text-gray-300">{config.frameOptions.color}</span>
                                </div>
                            </div>
                        </div>

                        {/* Sliders Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Thickness Slider */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-medium text-gray-400">Độ dày</label>
                                    <span className="text-xs text-green-400 font-mono">{config.frameOptions.thickness}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={config.frameOptions.thickness}
                                    onChange={(e) => handleFrameChange('thickness', Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                            </div>

                            {/* Radius Slider */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-medium text-gray-400">Bo góc</label>
                                    <span className="text-xs text-green-400 font-mono">
                                        {config.frameOptions.cornerRadius === 0 ? 'Vuông' : `${config.frameOptions.cornerRadius}px`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={config.frameOptions.cornerRadius}
                                    onChange={(e) => handleFrameChange('cornerRadius', Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                            </div>
                        </div>
                    </div>
                 )}
             </div>
           )}
        </div>

        {/* SECTION 4: LOGO */}
        <div className="bg-gray-900/40 rounded-xl border border-gray-700/50 overflow-hidden">
           <button 
            onClick={() => toggleSection('logo')}
            className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
             <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-gray-200 text-sm">Logo thương hiệu</span>
             </div>
             {expandedSections.logo ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

           {expandedSections.logo && (
             <div className="p-4 border-t border-gray-700/50 animate-fadeIn">
                 <div className="flex gap-3 items-center">
                    <label className="flex-1 cursor-pointer bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 hover:border-green-500 transition-all flex items-center justify-center gap-2 shadow-sm group">
                        <Upload className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-400" />
                        <span className="font-medium text-xs">Tải ảnh lên</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} key={fileInputKey} />
                    </label>
                    {config.image && (
                        <button 
                            onClick={removeLogo} 
                            className="px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg text-xs font-medium transition-colors border border-red-900/30"
                        >
                            Xóa
                        </button>
                    )}
                 </div>
                 
                 {config.image && (
                     <div className="mt-3 flex items-center gap-3">
                        <span className="text-xs text-gray-400 whitespace-nowrap">Cỡ Logo:</span>
                        <input
                            type="range"
                            min="0.2"
                            max="1.0"
                            step="0.05"
                            value={config.imageOptions.imageSize || 0.4}
                            onChange={(e) => setConfig(p => ({...p, imageOptions: {...p.imageOptions, imageSize: Number(e.target.value)}}))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                     </div>
                 )}
            </div>
           )}
        </div>

        {/* Compact Sliders Section */}
         <div className="bg-gray-900/40 rounded-xl border border-gray-700/50 p-4">
             <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1">
                     <div className="flex justify-between">
                        <label className="text-[10px] uppercase font-semibold text-gray-500">Độ phân giải</label>
                        <span className="text-[10px] text-green-400 font-mono">{config.width}px</span>
                     </div>
                     <input
                        type="range"
                        min="500"
                        max="2000"
                        step="100"
                        value={config.width}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setConfig(p => ({...p, width: val, height: val}));
                        }}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                 </div>
                 <div className="flex flex-col gap-1">
                     <div className="flex justify-between">
                        <label className="text-[10px] uppercase font-semibold text-gray-500">Khoảng cách lề</label>
                        <span className="text-[10px] text-green-400 font-mono">{config.margin}px</span>
                     </div>
                     <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={config.margin || 0}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setConfig(p => ({...p, margin: val}));
                        }}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                 </div>
             </div>
         </div>

      </div>

      {/* RIGHT COLUMN: Preview Panel */}
      <div className="lg:col-span-5">
         <div className="sticky top-4">
             <div className="bg-gray-900/50 rounded-2xl border border-gray-700/50 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="mb-6 relative group z-10">
                    <div className="absolute -inset-2 bg-gradient-to-tr from-green-500/20 to-blue-500/20 rounded-xl blur-lg opacity-50"></div>
                    
                    {/* QR Code Container with Dynamic CSS Border */}
                    <div 
                        className="relative bg-white shadow-xl mx-auto transition-all duration-300"
                        style={{
                            padding: config.frameOptions.enabled ? '0px' : '0px',
                            // Dynamic border styling for preview
                            border: config.frameOptions.enabled 
                                ? `${config.frameOptions.thickness}px ${config.frameOptions.style} ${config.frameOptions.color}` 
                                : 'none',
                            // Apply rounded corners to preview
                            borderRadius: config.frameOptions.enabled ? `${config.frameOptions.cornerRadius}px` : '0px'
                        }}
                    >
                        <div ref={ref} className="[&>canvas]:max-w-full [&>canvas]:h-auto"></div>
                    </div>
                </div>
                
                <button
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 ${
                        isProcessing 
                        ? 'bg-gray-600 cursor-wait' 
                        : 'bg-green-600 hover:bg-green-700 shadow-green-900/40'
                    }`}
                >
                    <Download className="w-4 h-4" />
                    {isProcessing ? 'Đang xử lý...' : 'Tải xuống PNG'}
                </button>
                {config.frameOptions.enabled && (
                    <p className="mt-3 text-[10px] text-center text-gray-500">
                        * Khung viền sẽ được tự động vẽ vào ảnh khi tải xuống.
                    </p>
                )}
             </div>
         </div>
      </div>
    </div>
  );
};