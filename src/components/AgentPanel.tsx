import React, { useState, useRef, useEffect } from 'react';
import { AgentMode, AgentStatus, AgentStep, ChatMessage } from '../types';
import { 
  Send, 
  Terminal, 
  FileCode2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  RotateCcw,
  Bot,
  User,
  Compass,
  Globe,
  ShieldCheck,
  Play
} from 'lucide-react';

interface AgentPanelProps {
  messages: ChatMessage[];
  steps: AgentStep[];
  agentMode: AgentMode;
  agentStatus: AgentStatus;
  onSetAgentMode: (mode: AgentMode) => void;
  onSendMessage: (text: string) => void;
  onSelectStepFile?: (filepath: string) => void;
  isAgentRunning: boolean;
  activeIssueTitle?: string;
  onResetWorkspace: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  messages,
  steps,
  agentMode,
  agentStatus,
  onSetAgentMode,
  onSendMessage,
  onSelectStepFile,
  isAgentRunning,
  activeIssueTitle,
  onResetWorkspace,
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, steps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() || isAgentRunning) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const agentModeIcons = {
    CodeAct: Terminal,
    Planner: Compass,
    Browsing: Globe,
    Security: ShieldCheck,
  };

  return (
    <aside className="w-96 flex flex-col h-full bg-slate-950 border-r border-slate-800 shrink-0">
      {/* Top Header: Mode Switcher & Workspace Reset */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Bot className="w-4 h-4 text-blue-400" />
            <span>Agent Controller</span>
          </div>

          <button
            onClick={onResetWorkspace}
            title="Reset workspace to initial git state"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Repo</span>
          </button>
        </div>

        {/* Clean Segmented Controls (Buttons per design constitution) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 border border-slate-800/80 rounded-md">
          {(['CodeAct', 'Planner', 'Browsing', 'Security'] as AgentMode[]).map((mode) => {
            const Icon = agentModeIcons[mode];
            const isActive = agentMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onSetAgentMode(mode)}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-medium rounded transition-colors cursor-pointer truncate ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="truncate">{mode}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active task prompt bar */}
      {activeIssueTitle && (
        <div className="px-3.5 py-2 bg-slate-900/60 border-b border-slate-800/80 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-0.5">
            <span>Target Issue</span>
            <span className="font-mono text-slate-500">Autonomous Task</span>
          </div>
          <p className="font-medium text-slate-200 truncate">{activeIssueTitle}</p>
        </div>
      )}

      {/* Stream / Chat History */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {messages.length === 0 && steps.length === 0 && (
          <div className="text-center py-10 px-4 text-slate-400 text-xs">
            <Bot className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="font-medium text-slate-300 mb-1">OpenHands is ready</p>
            <p className="text-slate-500 text-[11px]">
              Provide an engineering prompt or run SWE-Bench to watch the CodeAct agent inspect the codebase, run bash commands, and fix tests.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 px-1">
              {msg.sender === 'user' ? (
                <>
                  <span>You</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <span className="text-blue-400 font-medium">OpenHands</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{msg.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`p-3 rounded-lg text-xs leading-relaxed max-w-[92%] ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Steps Stream */}
        {steps.map((step, index) => {
          const isExpanded = expandedSteps[step.id] ?? true;
          return (
            <div
              key={step.id}
              className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden text-xs"
            >
              {/* Step Header */}
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-850 flex items-center justify-between text-left transition-colors border-b border-slate-800/80 cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="font-mono text-[10px] text-slate-500">#{index + 1}</span>
                  <span className="font-medium text-slate-200 truncate">
                    {step.action.summary}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {step.status === 'running' && (
                    <span className="text-[10px] text-blue-400 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                      Running
                    </span>
                  )}
                  {step.status === 'success' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {step.status === 'failed' && (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 space-y-2.5">
                  {/* Thought block */}
                  {step.thought && (
                    <div className="text-[11px] text-slate-300 bg-slate-950/70 p-2.5 rounded border border-slate-800/70 font-sans leading-relaxed">
                      <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">
                        Reasoning
                      </div>
                      <p className="whitespace-pre-wrap">{step.thought}</p>
                    </div>
                  )}

                  {/* Action block */}
                  <div className="space-y-1.5">
                    {step.action.type === 'execute_bash' && (
                      <div className="bg-black/60 rounded border border-slate-800 overflow-hidden font-mono text-[11px]">
                        <div className="px-2.5 py-1 bg-slate-950 text-slate-400 border-b border-slate-800/60 flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-blue-400" />
                          <span>bash</span>
                        </div>
                        <div className="p-2 text-emerald-400 overflow-x-auto">
                          $ {step.action.command}
                        </div>
                      </div>
                    )}

                    {step.action.type === 'file_write' && (
                      <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-300 truncate">
                          <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                          <span className="truncate">{step.action.filepath}</span>
                        </div>
                        {onSelectStepFile && step.action.filepath && (
                          <button
                            onClick={() => onSelectStepFile(step.action.filepath!)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer shrink-0 ml-2"
                          >
                            View
                          </button>
                        )}
                      </div>
                    )}

                    {step.action.type === 'file_read' && (
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] flex items-center gap-1.5 text-slate-300">
                        <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>read {step.action.filepath}</span>
                      </div>
                    )}
                  </div>

                  {/* Observation block */}
                  {step.observation && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Observation</span>
                        <span>
                          exit code: {step.observation.exitCode ?? 0}
                        </span>
                      </div>
                      <pre className="p-2 bg-black/70 border border-slate-800/80 rounded font-mono text-[10.5px] leading-tight text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                        {step.observation.stdout || step.observation.stderr || 'No stdout/stderr returned'}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Live typing / thinking banner */}
        {isAgentRunning && (
          <div className="flex items-center gap-2 p-2.5 bg-blue-950/30 border border-blue-900/50 rounded-lg text-xs text-blue-300 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>OpenHands is reasoning and analyzing workspace...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-1.5 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => onSendMessage('Run tests, identify failing logic, and fix cartCalculator.ts')}
          disabled={isAgentRunning}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded cursor-pointer disabled:opacity-50"
        >
          Fix failing tests
        </button>
        <button
          onClick={() => onSendMessage('Run git status and git diff')}
          disabled={isAgentRunning}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded cursor-pointer disabled:opacity-50"
        >
          Inspect git status
        </button>
        <button
          onClick={() => onSendMessage('Explain the bug in cartCalculator.ts')}
          disabled={isAgentRunning}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded cursor-pointer disabled:opacity-50"
        >
          Explain bug
        </button>
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAgentRunning ? "Agent is busy running task..." : "Ask OpenHands to fix a bug, run tests, or write a feature... (Enter to submit)"}
            disabled={isAgentRunning}
            rows={3}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-md text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none transition-colors disabled:opacity-60"
          />
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isAgentRunning}
            className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
