import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, Wand2, Download, Trash2, AlertCircle, AlignLeft, AlignRight, ArrowUp, ArrowDown } from 'lucide-react';
import { SubtitleItem } from './types';
import { parseSRT, processSubtitles } from './utils/srtUtils';
import Button from './components/Button';

const App: React.FC = () => {
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [originalTextAlign, setOriginalTextAlign] = useState<'left' | 'right'>('left');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 监听滚动以显示/隐藏回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 滚动到顶部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 滚动到底部
  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseSRT(content);
        setSubtitles(parsed);
        setIsProcessed(false);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // 触发格式化
  const handleFormat = useCallback(() => {
    if (subtitles.length === 0) return;
    const processed = processSubtitles(subtitles);
    setSubtitles(processed);
    setIsProcessed(true);
  }, [subtitles]);

  // 清除数据
  const handleClear = () => {
    setSubtitles([]);
    setFileName('');
    setIsProcessed(false);
  };

  // 导出处理后的 SRT
  const handleExport = () => {
    if (!isProcessed || subtitles.length === 0) return;

    let content = '';
    subtitles.forEach(sub => {
      content += `${sub.id}\n`;
      content += `${sub.startTime} --> ${sub.endTime}\n`;
      content += `${sub.formattedText}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted_${fileName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleAlign = () => {
    setOriginalTextAlign(prev => prev === 'left' ? 'right' : 'left');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-300 bg-slate-950">
      {/* 顶部导航栏 - 更紧凑的高度 */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold text-slate-100">
              SRT 字幕工具
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".srt"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              {fileName ? '重新导入' : '导入'}
            </Button>

            {subtitles.length > 0 && (
              <>
                <Button 
                  variant="primary" 
                  onClick={handleFormat}
                  disabled={isProcessed}
                  icon={<Wand2 className="w-3.5 h-3.5" />}
                >
                  {isProcessed ? '已格式化' : '格式化'}
                </Button>
                
                {isProcessed && (
                   <Button 
                   variant="secondary" 
                   onClick={handleExport}
                   icon={<Download className="w-3.5 h-3.5" />}
                 >
                   导出
                 </Button>
                )}

                <button 
                  onClick={handleClear}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-md hover:bg-slate-800"
                  title="清空"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 p-2 sm:p-4">
        <div className="max-w-[1600px] mx-auto">
          
          {subtitles.length === 0 ? (
            // 空状态
            <div className="flex flex-col items-center justify-center h-[70vh] border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-1">导入字幕文件</h3>
              <p className="text-slate-500 mb-6 text-sm">
                支持 .srt 格式，自动优化格式、合并断句
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                选择文件
              </Button>
            </div>
          ) : (
            // 字幕列表
            <div className="space-y-2">
              {fileName && (
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>文件: <span className="font-medium text-slate-300">{fileName}</span></span>
                    <span>• {subtitles.length} 行</span>
                  </div>
                </div>
              )}

              <div className="bg-slate-900 rounded-lg shadow-sm border border-slate-800 overflow-hidden">
                {/* 表头 - 紧凑设计 */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 font-semibold text-slate-400 text-xs uppercase tracking-wider items-center sticky top-0">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-2 text-center">时间轴</div>
                  <div className={`col-span-${isProcessed ? '4' : '9'} flex items-center justify-between group`}>
                    <span>原始内容</span>
                    <button 
                      onClick={toggleAlign}
                      className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
                      title={originalTextAlign === 'left' ? "切换到右对齐" : "切换到左对齐"}
                    >
                      {originalTextAlign === 'left' ? <AlignLeft className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {isProcessed && (
                    <div className="col-span-5 text-blue-400 pl-2 border-l border-slate-800">格式化后</div>
                  )}
                </div>

                {/* 列表内容 - 极度紧凑 */}
                <div className="divide-y divide-slate-800/50">
                  {subtitles.map((sub) => (
                    <div key={`${sub.id}-${sub.startTime}`} className="grid grid-cols-12 gap-2 px-3 py-1.5 hover:bg-slate-800/50 transition-colors text-sm group items-start">
                      
                      {/* 序号 */}
                      <div className="col-span-1 text-center font-mono text-slate-600 select-none text-xs pt-0.5">
                        {sub.id}
                      </div>

                      {/* 时间轴 */}
                      <div className="col-span-2 font-mono text-[10px] text-slate-500 flex flex-col items-center justify-center leading-tight pt-0.5">
                        <span>{sub.startTime}</span>
                        <span>{sub.endTime}</span>
                      </div>

                      {/* 原始内容 */}
                      <div className={`col-span-${isProcessed ? '4' : '9'} whitespace-pre-wrap text-slate-400 leading-snug break-words ${originalTextAlign === 'right' ? 'text-right' : 'text-left'}`}>
                         {sub.originalText}
                      </div>

                      {/* 格式化后内容 */}
                      {isProcessed && (
                        <div className="col-span-5 whitespace-pre-wrap text-slate-200 font-medium leading-snug break-words pl-2 border-l border-slate-800/50">
                          {sub.formattedText}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 悬浮滚动按钮组 */}
      {subtitles.length > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">
          <button
            onClick={scrollToTop}
            className={`p-2.5 rounded-full shadow-lg bg-slate-800 border border-slate-700 text-blue-500 hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 transform ${
              showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
            title="回到顶部"
            aria-label="回到顶部"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          
          <button
            onClick={scrollToBottom}
            className="p-2.5 rounded-full shadow-lg bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors duration-300"
            title="跳转到底部"
            aria-label="跳转到底部"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 页脚说明 */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 text-center text-slate-600 text-xs">
          <p className="flex items-center justify-center gap-2">
            <AlertCircle className="w-3 h-3" />
            处理逻辑：去括号 • 合并断句 • 智能大小写
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;