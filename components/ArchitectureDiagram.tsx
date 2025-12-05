import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IANode } from '../types';
import { generateIA } from '../services/gemini';
import { Loader2, GitGraph, Download, FileImage, FileText, Maximize2, X } from 'lucide-react';
import { downloadAsImage, downloadAsPDF } from '../utils/export';

export const ArchitectureDiagram: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IANode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await generateIA(topic);
      setData(result);
    } catch (e: any) {
      setError(e.message || "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'image' | 'pdf') => {
    // Determine which element to export based on view mode
    const targetRef = isFullscreen ? captureRef.current : captureRef.current;
    if (!targetRef) return;
    
    setExporting(true);
    setShowExportMenu(false);
    try {
      const filename = `IA_Diagram_${topic || 'Sitemap'}`;
      if (type === 'image') {
        await downloadAsImage(targetRef, filename);
      } else {
        await downloadAsPDF(targetRef, filename);
      }
    } finally {
      setExporting(false);
    }
  };

  const updateNodeName = (nodeData: IANode, newName: string) => {
     if (!data) return;
     const cloneData = JSON.parse(JSON.stringify(data));
     
     const findAndUpdate = (node: IANode) => {
        if (node.name === nodeData.name && node.type === nodeData.type) {
           node.name = newName;
           return true;
        }
        if (node.children) {
           for (const child of node.children) {
              if (findAndUpdate(child)) return true;
           }
        }
        return false;
     };
     
     findAndUpdate(cloneData);
     setData(cloneData);
  };

  // D3 Rendering Logic
  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Calculate strict dimensions based on the tree data itself
    const root = d3.hierarchy<IANode>(data);
    
    // Layout Config
    const leafCount = root.leaves().length;
    const maxDepth = root.height; // How deep the tree is (0-based)
    
    // INCREASED SPACING TO PREVENT OVERLAP
    const nodeHeight = 80; // Vertical spacing per leaf (was 50)
    const levelWidth = 300; // Horizontal spacing per level (was 240)
    
    // Dynamic Size Calculation
    const requiredHeight = Math.max(800, leafCount * nodeHeight);
    const requiredWidth = Math.max(1000, (maxDepth + 2) * levelWidth); 

    // Set SVG dimensions
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };
    const width = requiredWidth - margin.left - margin.right;
    const height = requiredHeight - margin.top - margin.bottom;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", requiredWidth)
      .attr("height", requiredHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create tree layout
    // size([height, width]) creates a horizontal tree
    const treeLayout = d3.tree<IANode>()
        .size([height, width])
        .separation((a, b) => (a.parent === b.parent ? 1.5 : 2)); // Increased separation for clarity

    treeLayout(root);

    // Links
    svg.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('d', d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      );

    // Nodes
    const nodes = svg.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', (d: any) => `node cursor-pointer ${d.children ? 'node--internal' : 'node--leaf'}`)
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .on('dblclick', (event, d) => {
         event.stopPropagation();
         const newName = prompt("修改节点名称:", d.data.name);
         if (newName && newName !== d.data.name) {
            updateNodeName(d.data, newName);
         }
      });

    // Node Circles
    nodes.append('circle')
      .attr('r', 6)
      .attr('fill', (d: any) => d.children ? '#4f46e5' : '#fff')
      .attr('stroke', '#4f46e5')
      .attr('stroke-width', 2);

    // Labels with background for readability
    const labels = nodes.append('g')
         .attr('transform', (d: any) => `translate(${d.children ? -14 : 14}, 5)`);
    
    // Background rect for text to ensure legibility over lines
    // We add this dynamically after rendering text usually, but simple stroke halo works well too.
    
    // Halo text (Stroke)
    labels.append('text')
      .style('text-anchor', (d: any) => d.children ? 'end' : 'start')
      .text((d: any) => d.data.name)
      .attr('class', 'stroke-white stroke-[4px] font-sans text-sm font-medium select-none')
      .style('paint-order', 'stroke');
      
    // Foreground Text
    labels.append('text')
      .style('text-anchor', (d: any) => d.children ? 'end' : 'start')
      .text((d: any) => d.data.name)
      .attr('class', 'fill-slate-700 font-sans text-sm font-medium select-none');

  }, [data, isFullscreen]);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header / Toolbar */}
      <div className={`bg-white p-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20 ${isFullscreen ? 'px-8 py-4' : ''}`}>
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          
          {/* Input Area */}
          {!isFullscreen ? (
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                你想构建什么产品的信息架构(IA)?
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如：企业后台管理系统、旅行预订网站..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading || !topic}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <GitGraph className="h-5 w-5" />}
                  {loading ? '构建中...' : '生成架构图'}
                </button>
              </div>
              {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <GitGraph className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                   <h2 className="font-bold text-gray-900 text-lg">全屏编辑模式</h2>
                   <p className="text-xs text-gray-500">双击节点修改名称</p>
                </div>
            </div>
          )}

          {/* Action Buttons */}
          {data && (
             <div className={`flex gap-3 ${!isFullscreen ? 'absolute top-28 right-8 z-30' : ''}`}>
                <div className="relative">
                    <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={exporting}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2"
                    >
                        {exporting ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
                        <span>导出图表</span>
                    </button>
                    
                    {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
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

                {!isFullscreen ? (
                   <button 
                     onClick={() => setIsFullscreen(true)}
                     className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 transition shadow-sm flex items-center gap-2"
                   >
                     <Maximize2 className="h-4 w-4" />
                     <span>放大</span>
                   </button>
                ) : (
                  <button 
                    onClick={() => setIsFullscreen(false)}
                    className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
             </div>
          )}
        </div>
      </div>

      {/* Visualization Area */}
      <div className="flex-1 overflow-auto bg-gray-50 relative" ref={containerRef}>
        {!data && !loading && (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
            <GitGraph className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg">AI 智能生成层级分明的信息架构图</p>
          </div>
        )}

        {loading && (
           <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
             <div className="text-indigo-600 flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <span>正在规划信息层级...</span>
             </div>
           </div>
        )}

        {data && (
           <div 
             className={`flex justify-center transition-all origin-top-left
               ${isFullscreen ? 'p-8' : 'p-4'}`}
             style={!isFullscreen ? { zoom: '65%' } : {}}
           >
              <div 
                 ref={captureRef}
                 className="bg-white shadow-lg rounded-lg border border-gray-100 inline-block"
              >
                  <svg ref={svgRef} className="block font-sans bg-white"></svg>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
