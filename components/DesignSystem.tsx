import React, { useState, useRef } from 'react';
import { DesignSystemData, ColorPalette, TypographyRule } from '../types';
import { generateDesignSystem } from '../services/gemini';
import { Loader2, Palette, Copy, Check, Download, FileImage, FileText, Maximize2, X } from 'lucide-react';
import { downloadAsImage, downloadAsPDF } from '../utils/export';
import { Editable } from './Editable';

export const DesignSystem: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DesignSystemData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateDesignSystem(topic);
      setData(result);
    } catch (e: any) {
      setError(e.message || "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'image' | 'pdf') => {
    const element = isFullscreen ? fullscreenRef.current : previewRef.current;
    const target = element?.querySelector('.design-system-capture') as HTMLElement;
    if (!target) return;

    setExporting(true);
    setShowExportMenu(false);
    try {
      const filename = `Design_System_${topic || 'Doc'}`;
      if (type === 'image') {
        await downloadAsImage(target, filename);
      } else {
        await downloadAsPDF(target, filename);
      }
    } finally {
      setExporting(false);
    }
  };

  const updateColor = (category: 'primaryColors' | 'secondaryColors' | 'neutralColors', index: number, field: keyof ColorPalette, value: string) => {
    if (!data) return;
    const newData = { ...data };
    const newColors = [...newData[category]];
    newColors[index] = { ...newColors[index], [field]: value };
    newData[category] = newColors;
    setData(newData);
  };

  const updateTypography = (index: number, field: keyof TypographyRule, value: string) => {
    if (!data) return;
    const newData = { ...data };
    const newTypo = [...newData.typography];
    newTypo[index] = { ...newTypo[index], [field]: value };
    newData.typography = newTypo;
    setData(newData);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Input */}
      <div className="bg-white p-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20 relative">
        <div className="max-w-4xl mx-auto w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            为您的产品定义设计规范
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：现代极简风格的摄影作品集、充满活力的运动品牌..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Palette className="h-5 w-5" />}
              {loading ? '生成规范' : '生成设计系统'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden bg-slate-100 relative flex flex-col">
        {!data && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Palette className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg">一键生成色彩系统与排版规范</p>
          </div>
        )}

        {loading && !data && (
           <div className="h-full flex flex-col items-center justify-center text-gray-400">
             <Loader2 className="animate-spin h-12 w-12 mb-4 text-indigo-400" />
             <p>AI 正在挑选配色方案...</p>
           </div>
        )}

        {data && (
          <>
             <div className="absolute top-4 right-4 z-10">
               <button 
                  onClick={() => setIsFullscreen(true)}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium shadow-sm border border-indigo-100 hover:bg-indigo-50 transition flex items-center gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>全屏查看 / 编辑 / 下载</span>
                </button>
            </div>

            <div className="flex-1 overflow-auto p-8" ref={previewRef}>
                <div style={{ zoom: '65%' }} className="origin-top-left">
                  <div className="bg-white shadow-xl rounded-xl border border-gray-200 select-none inline-block min-w-[800px]">
                      <DesignSystemContent data={data} readOnly />
                  </div>
                </div>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && data && (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-in fade-in duration-200">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                    <Palette className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                    <h2 className="font-bold text-gray-900 text-lg">全屏编辑模式</h2>
                    <p className="text-xs text-gray-500">点击任意色值或文字进行修改</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                    <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={exporting}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"
                    >
                        {exporting ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
                        <span>保存图片/PDF</span>
                    </button>
                    
                    {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                            <button 
                                onClick={() => handleExport('image')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                            >
                                <FileImage className="h-4 w-4 text-indigo-500" />
                                <span>保存为图片 (PNG)</span>
                            </button>
                            <button 
                                onClick={() => handleExport('pdf')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 flex items-center gap-2 border-t border-gray-100"
                            >
                                <FileText className="h-4 w-4 text-red-500" />
                                <span>保存为 PDF</span>
                            </button>
                        </div>
                    )}
                    {showExportMenu && (
                        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                    )}
                    </div>

                    <button 
                    onClick={() => setIsFullscreen(false)}
                    className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition"
                    title="Close Fullscreen"
                    >
                    <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 p-8" ref={fullscreenRef}>
                <div className="bg-white shadow-lg rounded-xl max-w-5xl mx-auto">
                    <DesignSystemContent 
                      data={data} 
                      onUpdateColor={updateColor}
                      onUpdateTypography={updateTypography}
                      onUpdateThemeName={(val) => setData({...data, themeName: val})}
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Reusable Content Component
const DesignSystemContent: React.FC<{ 
    data: DesignSystemData; 
    readOnly?: boolean; 
    onUpdateThemeName?: (val: string) => void;
    onUpdateColor?: (cat: any, idx: number, field: any, val: string) => void;
    onUpdateTypography?: (idx: number, field: any, val: string) => void;
}> = ({ data, readOnly = false, onUpdateThemeName, onUpdateColor, onUpdateTypography }) => {
    return (
        <div className="design-system-capture p-12 min-w-[800px]">
            {/* Theme Title */}
            <div className="text-center mb-12">
            <span className="text-indigo-500 font-semibold tracking-wider text-sm uppercase">Design System</span>
            {readOnly ? (
                 <h1 className="text-4xl font-bold text-gray-900 mt-2">{data.themeName}</h1>
            ) : (
                <div className="mt-2 flex justify-center">
                    <Editable 
                        tagName="h1" 
                        value={data.themeName} 
                        onChange={(v) => onUpdateThemeName?.(v)} 
                        className="text-4xl font-bold text-gray-900 text-center"
                    />
                </div>
            )}
            </div>

            {/* Colors */}
            <section className="mb-12">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-2 h-8 bg-indigo-500 rounded"></div> 色彩系统
            </h3>
            
            <div className="space-y-8">
                <ColorGroup 
                   title="Primary Brand Colors" 
                   colors={data.primaryColors} 
                   readOnly={readOnly} 
                   onUpdate={(idx, f, v) => onUpdateColor?.('primaryColors', idx, f, v)}
                />
                <ColorGroup 
                   title="Secondary / Accent Colors" 
                   colors={data.secondaryColors} 
                   readOnly={readOnly}
                   onUpdate={(idx, f, v) => onUpdateColor?.('secondaryColors', idx, f, v)}
                />
                <ColorGroup 
                   title="Neutral Colors" 
                   colors={data.neutralColors} 
                   readOnly={readOnly}
                   onUpdate={(idx, f, v) => onUpdateColor?.('neutralColors', idx, f, v)}
                />
            </div>
            </section>

            {/* Typography */}
            <section>
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-2 h-8 bg-indigo-500 rounded"></div> 字体排印
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-semibold text-gray-600 text-sm">Role</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Specs</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Preview</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm w-1/4">Usage</th>
                    </tr>
                </thead>
                <tbody>
                    {data.typography.map((type, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        <td className="p-4 text-gray-500 font-mono text-sm align-top whitespace-nowrap">
                            {readOnly ? type.role : <Editable value={type.role} onChange={v => onUpdateTypography?.(idx, 'role', v)} />}
                        </td>
                        <td className="p-4 text-gray-500 text-sm align-top whitespace-nowrap">
                           <div className="flex items-center gap-1">
                             <span className="text-xs text-gray-400 w-10">Size:</span>
                             {readOnly ? type.size : <Editable value={type.size} onChange={v => onUpdateTypography?.(idx, 'size', v)} />}
                           </div>
                           <div className="flex items-center gap-1 mt-1">
                             <span className="text-xs text-gray-400 w-10">Wght:</span>
                             {readOnly ? type.weight : <Editable value={type.weight} onChange={v => onUpdateTypography?.(idx, 'weight', v)} />}
                           </div>
                        </td>
                        <td className="p-4 align-middle">
                        <span 
                            style={{ 
                            fontSize: type.size, 
                            fontWeight: type.weight === 'Bold' ? 700 : type.weight === 'Medium' ? 500 : 400,
                            lineHeight: 1.4
                            }}
                            className="text-gray-900 block truncate max-w-md"
                        >
                            The quick brown fox jumps over the lazy dog.
                        </span>
                        </td>
                        <td className="p-4 text-gray-600 text-sm align-top">
                             {readOnly ? type.usage : <Editable multiline value={type.usage} onChange={v => onUpdateTypography?.(idx, 'usage', v)} />}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </section>
        </div>
    )
}

const ColorGroup: React.FC<{ 
    title: string, 
    colors: ColorPalette[], 
    readOnly?: boolean, 
    onUpdate?: (idx: number, field: keyof ColorPalette, val: string) => void 
}> = ({ title, colors, readOnly, onUpdate }) => {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {colors.map((color, idx) => (
          <ColorCard 
             key={idx} 
             color={color} 
             readOnly={readOnly} 
             onUpdate={(f, v) => onUpdate?.(idx, f, v)}
          />
        ))}
      </div>
    </div>
  );
};

const ColorCard: React.FC<{ 
    color: ColorPalette, 
    readOnly?: boolean,
    onUpdate?: (field: keyof ColorPalette, val: string) => void
}> = ({ color, readOnly, onUpdate }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
      <div 
        className="h-24 w-full relative group/color" 
        style={{ backgroundColor: color.hex }}
      >
        {!readOnly && (
           <input 
             type="color" 
             value={color.hex}
             onChange={(e) => onUpdate?.('hex', e.target.value)}
             className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
           />
        )}
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 mr-2">
            <div className="font-bold text-gray-800 text-sm truncate">
                {readOnly ? color.name : <Editable value={color.name} onChange={(v) => onUpdate?.('name', v)} />}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1 uppercase flex items-center">
                 {readOnly ? color.hex : <Editable value={color.hex} onChange={(v) => onUpdate?.('hex', v)} />}
            </div>
          </div>
          <button 
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-indigo-600 transition flex-shrink-0"
            title="Copy Hex"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-[10px] text-gray-400 mt-2 leading-tight">
          {readOnly ? color.usage : <Editable multiline value={color.usage} onChange={(v) => onUpdate?.('usage', v)} />}
        </div>
      </div>
    </div>
  );
};
