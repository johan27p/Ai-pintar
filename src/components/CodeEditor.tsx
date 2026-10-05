import React, { useState, useEffect } from 'react';
import { WorkspaceFile } from '../types';
import { 
  X, 
  Save, 
  RotateCcw, 
  Search, 
  Copy, 
  Check, 
  FileCode2, 
  FileText,
  Code
} from 'lucide-react';

interface CodeEditorProps {
  files: WorkspaceFile[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onUpdateFileContent: (path: string, newContent: string) => void;
  onSaveFile: (path: string) => void;
  onRevertFile: (path: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onCloseFile,
  onUpdateFileContent,
  onSaveFile,
  onRevertFile,
}) => {
  const activeFile = files.find((f) => f.path === activeFilePath) || files[0];
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-500 text-xs">
        <Code className="w-8 h-8 mb-2 text-slate-700" />
        <p>No file selected</p>
      </div>
    );
  }

  const lines = activeFile.content.split('\n');

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* File Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 overflow-x-auto">
        <div className="flex items-center overflow-x-auto">
          {files.map((file) => {
            const isActive = file.path === activeFilePath;
            return (
              <div
                key={file.path}
                onClick={() => onSelectFile(file.path)}
                className={`group flex items-center gap-2 px-3 py-2 text-xs border-r border-slate-800 cursor-pointer transition-colors max-w-[200px] truncate ${
                  isActive
                    ? 'bg-slate-950 text-white font-medium border-t-2 border-t-blue-500'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="truncate">{file.name}</span>
                {file.isModified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Modified" />
                )}
                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile(file.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 rounded transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 px-3 py-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            title="Search file"
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
              showSearch ? 'bg-blue-600/30 text-blue-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Copy file contents"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {activeFile.isModified && (
            <>
              <button
                onClick={() => onRevertFile(activeFile.path)}
                title="Discard edits and revert to git original"
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert</span>
              </button>

              <button
                onClick={() => onSaveFile(activeFile.path)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition-colors cursor-pointer"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Breadcrumb Path & Search Bar */}
      <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-1">
          <span className="text-slate-400">{activeFile.path}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">{lines.length} lines</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">{activeFile.content.length} chars</span>
        </div>

        {showSearch && (
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <Search className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in file..."
              className="bg-transparent text-xs text-white focus:outline-none w-36"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Line numbered Editable Code Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <textarea
          value={activeFile.content}
          onChange={(e) => onUpdateFileContent(activeFile.path, e.target.value)}
          spellCheck={false}
          className="w-full h-full p-4 pl-14 font-mono text-xs text-slate-200 bg-slate-950 focus:outline-none resize-none leading-relaxed select-text"
          style={{ tabSize: 2 }}
        />

        {/* Line numbers overlay */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-10 bg-slate-950/90 border-r border-slate-900 pt-4 text-right pr-2 font-mono text-xs text-slate-600 pointer-events-none select-none leading-relaxed overflow-hidden"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
