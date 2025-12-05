import React, { useState, useRef } from 'react';
import { JourneyMapData, JourneyStage } from '../types';
import { generateJourneyMap } from '../services/gemini';
import { Loader2, Map, Target, AlertCircle, Lightbulb, User, Download, FileImage, FileText, Maximize2, X, Plus, Trash2 } from 'lucide-react';
import { downloadAsImage, downloadAsPDF } from '../utils/export';
import { Editable } from './Editable';

export const JourneyMap: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<JourneyMapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateJourneyMap(topic);
      setData(result);
    } catch (e: any) {
      setError(e.message || "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = (index: number, field: keyof JourneyStage, value: any) => {
    if (!data) return;
    const newStages = [...data.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setData({ ...data, stages: newStages });
  };

  const handleUpdateArrayItem = (stageIndex: number, field: 'actions' | 'painPoints' | 'opportunities', itemIndex: number, value: string) => {
    if (!data) return;
    const newStages = [...data.stages];
    const newArray = [...newStages[stageIndex][field]];
    newArray[itemIndex] = value;
    newStages[stageIndex] = { ...newStages[stageIndex], [field]: newArray };
    setData({ ...data, stages: newStages });
  };

  const handleAddItem = (stageIndex: number, field: 'actions' | 'painPoints' | 'opportunities') => {
    if (!data) return;
    const newStages = [...data.stages];
    newStages[stageIndex] = { 
      ...newStages[stageIndex], 
      [field]: [...newStages[stageIndex][field], "新项目 (点击编辑)"] 
    };
    setData({ ...data, stages: newStages });
  };

  const handleDeleteItem = (stageIndex: number, field: 'actions' | 'painPoints' | 'opportunities', itemIndex: number) => {
    if (!data) return;
    const newStages = [...data.stages];
    const newArray = [...newStages[stageIndex][field]];
    newArray.splice(itemIndex, 1);
    newStages[stageIndex] = { ...newStages[stageIndex], [field]: newArray };
    setData({ ...data, stages: newStages });
  };

  const handleExport = async (type: 'image' | 'pdf') => {
    // If fullscreen, use the fullscreen ref. If preview, use the content ref.
    const element = isFullscreen ? fullscreenRef.current : contentRef.current;
    
    // Find the actual content div
    const target = element?.querySelector('.journey-content-capture') as HTMLElement;

    if (!target) return;
    
    setExporting(true);
    setShowExportMenu(false);
    
    try {
      const filename = `User_Journey_${topic || 'Map'}`;
      if (type === 'image') {
        await downloadAsImage(target, filename);
      } else {
        await downloadAsPDF(target, filename);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Input Section */}
      <div className="bg-white p-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20 relative">
        <div className="max-w-4xl mx-auto w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            你想设计什么产品的用户旅程?
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：宠物领养App的领养流程、在线银行转账..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Map className="h-5 w-5" />}
              {loading ? '生成中...' : '生成旅程图'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 overflow-hidden bg-slate-100 relative flex flex-col">
        {!data && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Map className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg">输入主题，AI 将为您构建完整的用户体验旅程</p>
          </div>
        )}

        {loading && !data && (
           <div className="h-full flex flex-col items-center justify-center text-gray-400">
             <div className="animate-pulse flex flex-col items-center">
               <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
               <div className="h-64 w-full max-w-4xl bg-gray-200 rounded mb-4"></div>
               <p className="text-sm">正在分析用户痛点与机会点...</p>
             </div>
           </div>
        )}

        {data && (
          <>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
               <button 
                  onClick={() => setIsFullscreen(true)}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium shadow-sm border border-indigo-100 hover:bg-indigo-50 transition flex items-center gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>全屏查看 / 编辑 / 下载</span>
                </button>
            </div>
            
            {/* Zoomed Preview Container 
                Using `zoom` (style) works better for layout reflow in Webkit than transform:scale.
                Fallback to regular scrolling for others.
            */}
            <div className="flex-1 overflow-auto bg-slate-200/50 p-8" ref={contentRef}>
               <div style={{ zoom: '65%' }} className="origin-top-left">
                  <div className="bg-white shadow-xl rounded-xl border border-slate-200 inline-block min-w-max">
                     <JourneyMapContent data={data} readOnly={true} />
                  </div>
               </div>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Editor Modal */}
      {isFullscreen && data && (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-in fade-in duration-200">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm flex-shrink-0">
             <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                   <h2 className="font-bold text-gray-900 text-lg">全屏编辑模式</h2>
                   <p className="text-xs text-gray-500">点击任意文字进行修改</p>
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8" ref={fullscreenRef}>
             <div className="bg-white shadow-lg rounded-xl min-w-max mx-auto">
                <JourneyMapContent 
                  data={data} 
                  onUpdatePersona={(val) => setData({...data, persona: val})}
                  onUpdateScenario={(val) => setData({...data, scenario: val})}
                  onUpdateStage={handleUpdateStage}
                  onUpdateArrayItem={handleUpdateArrayItem}
                  onAddItem={handleAddItem}
                  onDeleteItem={handleDeleteItem}
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Content Component
const JourneyMapContent: React.FC<{
  data: JourneyMapData;
  readOnly?: boolean;
  onUpdatePersona?: (val: string) => void;
  onUpdateScenario?: (val: string) => void;
  onUpdateStage?: (index: number, field: keyof JourneyStage, value: any) => void;
  onUpdateArrayItem?: (stageIndex: number, field: any, itemIndex: number, value: string) => void;
  onAddItem?: (stageIndex: number, field: any) => void;
  onDeleteItem?: (stageIndex: number, field: any, itemIndex: number) => void;
}> = ({ 
  data, 
  readOnly = false, 
  onUpdatePersona, 
  onUpdateScenario,
  onUpdateStage,
  onUpdateArrayItem,
  onAddItem,
  onDeleteItem
}) => {
  
  // Grid Template: 
  // First col: Header (fixed width 200px)
  // Rest cols: Stages (min-width 320px, equal flexible width)
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `200px repeat(${data.stages.length}, minmax(320px, 1fr))`,
    width: 'fit-content' // Crucial: Ensures grid expands rather than squashing cells
  };

  return (
    <div className="journey-content-capture p-10 min-w-[1200px]">
      {/* Top Header Section */}
      <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
          <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 mt-1">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Target Persona</div>
                {readOnly ? (
                  <h2 className="text-2xl font-bold text-gray-900">{data.persona}</h2>
                ) : (
                  <Editable 
                    tagName="h2" 
                    value={data.persona} 
                    onChange={(v) => onUpdatePersona?.(v)} 
                    className="text-2xl font-bold text-gray-900 w-full block" 
                  />
                )}
                
                <div className="mt-2 text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Scenario</div>
                {readOnly ? (
                  <p className="text-gray-600 text-lg">{data.scenario}</p>
                ) : (
                  <Editable 
                    tagName="p" 
                    value={data.scenario} 
                    onChange={(v) => onUpdateScenario?.(v)} 
                    className="text-gray-600 text-lg w-full block"
                  />
                )}
              </div>
          </div>
      </div>

      {/* Main Grid */}
      <div style={gridStyle} className="border-t border-l border-gray-200 bg-white shadow-sm">
          
          {/* --- ROW 1: Stage Names --- */}
          <div className="p-4 bg-gray-50 font-bold text-gray-500 text-sm uppercase tracking-wide border-b border-r border-gray-200 flex items-center sticky left-0 z-10 shadow-sm">
              Stages
          </div>
          {data.stages.map((stage, idx) => (
             <div key={`stage-${idx}`} className="p-4 border-b border-r border-gray-200 bg-indigo-50/30">
                 <div className="text-xs uppercase tracking-wide text-indigo-500 font-bold mb-1">Step {idx + 1}</div>
                 {readOnly ? (
                    <h3 className="font-bold text-lg text-gray-900">{stage.stageName}</h3>
                 ) : (
                    <Editable 
                        tagName="h3"
                        value={stage.stageName}
                        onChange={(v) => onUpdateStage?.(idx, 'stageName', v)}
                        className="font-bold text-lg text-gray-900 w-full block"
                    />
                 )}
             </div>
          ))}

          {/* --- ROW 2: Goals --- */}
          <div className="p-4 bg-gray-50 font-bold text-gray-500 text-sm uppercase tracking-wide border-b border-r border-gray-200 sticky left-0 z-10 shadow-sm flex items-start">
             User Goal
          </div>
          {data.stages.map((stage, idx) => (
             <div key={`goal-${idx}`} className="p-4 border-b border-r border-gray-200">
                <div className="flex items-start gap-2 text-gray-700 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 h-full">
                    <Target className="w-4 h-4 mt-1 flex-shrink-0 text-indigo-500" />
                    {readOnly ? (
                        <span className="text-sm">{stage.userGoal}</span>
                    ) : (
                        <Editable 
                            multiline
                            value={stage.userGoal}
                            onChange={(v) => onUpdateStage?.(idx, 'userGoal', v)}
                            className="text-sm w-full bg-transparent"
                        />
                    )}
                </div>
             </div>
          ))}

          {/* --- ROW 3: Actions --- */}
          <div className="p-4 bg-gray-50 font-bold text-gray-500 text-sm uppercase tracking-wide border-b border-r border-gray-200 sticky left-0 z-10 shadow-sm">
             Actions
          </div>
          {data.stages.map((stage, idx) => (
             <div key={`actions-${idx}`} className="p-4 border-b border-r border-gray-200 group/card align-top">
                 <ul className="list-disc list-outside ml-4 space-y-2">
                    {stage.actions.map((action, i) => (
                        <li key={i} className="text-sm text-gray-700 group/item relative pl-1">
                            {readOnly ? action : (
                            <>
                            <Editable 
                                multiline
                                value={action} 
                                onChange={(v) => onUpdateArrayItem?.(idx, 'actions', i, v)}
                                className="w-full inline-block align-top"
                            />
                            <button 
                                onClick={() => onDeleteItem?.(idx, 'actions', i)}
                                className="absolute -right-6 top-0 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-1"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                            </>
                            )}
                        </li>
                    ))}
                 </ul>
                 {!readOnly && (
                    <button 
                        onClick={() => onAddItem?.(idx, 'actions')}
                        className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    >
                        <Plus className="w-3 h-3" /> Add Action
                    </button>
                 )}
             </div>
          ))}

          {/* --- ROW 4: Emotion --- */}
          <div className="p-4 bg-gray-50 font-bold text-gray-500 text-sm uppercase tracking-wide border-b border-r border-gray-200 sticky left-0 z-10 shadow-sm flex items-center">
             Emotion
          </div>
          {data.stages.map((stage, idx) => (
             <div key={`emotion-${idx}`} className="p-4 border-b border-r border-gray-200 flex items-center justify-center bg-gray-50/30">
                <div className="relative w-full flex justify-center py-2">
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gray-200 -z-10"></div>
                    <div className={`relative z-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm border-2 bg-white ${
                        stage.emotionScore >= 4 ? 'border-green-400' : 
                        stage.emotionScore >= 3 ? 'border-yellow-400' : 
                        'border-red-400'
                    }`}>
                        {stage.emotionScore >= 4 ? '😊' : stage.emotionScore >= 3 ? '😐' : '😫'}
                    </div>
                    {!readOnly && (
                        <div className="absolute -bottom-8 flex gap-1 bg-white shadow-sm rounded-full p-1 border border-gray-100 z-10">
                        {[1,3,5].map(score => (
                            <button 
                                key={score}
                                onClick={() => onUpdateStage?.(idx, 'emotionScore', score)}
                                className={`w-6 h-6 text-xs rounded-full flex items-center justify-center ${stage.emotionScore === score ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-gray-100'}`}
                            >
                                {score >= 4 ? '😊' : score === 3 ? '😐' : '😫'}
                            </button>
                        ))}
                        </div>
                    )}
                </div>
             </div>
          ))}

          {/* --- ROW 5: Pain Points --- */}
          <div className="p-4 bg-gray-50 font-bold text-gray-500 text-sm uppercase tracking-wide border-b border-r border-gray-200 sticky left-0 z-10 shadow-sm">
             Pain Points
          </div>
          {data.stages.map((stage, idx) => (
             <div key={`pain-${idx}`} className="p-4 border-b border-r border-gray-200 bg-red-50/30 group/card">
                 <ul className="space-y-3">
                    {stage.painPoints.map((point, i) => (
                        <li key={i} className="text-sm text-red-800 flex items-start gap-2 group/item relative">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {readOnly ? point : (
                            <>
                                <Editable 
                                multiline
                                value={point} 
                                onChange={(v) => onUpdateArrayItem?.(idx, 'painPoints', i, v)}
                                className="flex-1 bg-transparent"
                                />
                                <button 
                                onClick={() => onDeleteItem?.(idx, 'painPoints', i)}
                                className="absolute -right-2 top-0 text-red-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5"
                                >
                                <Trash2 className="w-3 h-3" />
                                </button>
                            </>
                            )}
                        </li>
                    ))}
                 </ul>
                 {!readOnly && (
                    <button 
                        onClick={() => onAddItem?.(idx, 'painPoints')}
                        className="mt-3 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    >
                        <Plus className="w-3 h-3" /> Add Pain Point
                    </button>
                 )}
             </div>
          ))}

          {/* --- ROW 6: Opportunities --- */}
          <div className="p-4 bg-gray-50 font-bold text-gray-500 text-sm uppercase tracking-wide border-b border-r border-gray-200 sticky left-0 z-10 shadow-sm">
             Opportunities
          </div>
          {data.stages.map((stage, idx) => (
             <div key={`opp-${idx}`} className="p-4 border-b border-r border-gray-200 bg-blue-50/30 group/card">
                  <ul className="space-y-3">
                    {stage.opportunities.map((opp, i) => (
                        <li key={i} className="text-sm text-blue-800 flex items-start gap-2 group/item relative">
                            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {readOnly ? opp : (
                            <>
                                <Editable 
                                multiline
                                value={opp} 
                                onChange={(v) => onUpdateArrayItem?.(idx, 'opportunities', i, v)}
                                className="flex-1 bg-transparent"
                                />
                                <button 
                                onClick={() => onDeleteItem?.(idx, 'opportunities', i)}
                                className="absolute -right-2 top-0 text-blue-300 hover:text-blue-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5"
                                >
                                <Trash2 className="w-3 h-3" />
                                </button>
                            </>
                            )}
                        </li>
                    ))}
                 </ul>
                 {!readOnly && (
                    <button 
                        onClick={() => onAddItem?.(idx, 'opportunities')}
                        className="mt-3 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    >
                        <Plus className="w-3 h-3" /> Add Opportunity
                    </button>
                 )}
             </div>
          ))}
      </div>
    </div>
  );
}
