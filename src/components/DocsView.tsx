import React from 'react';
import { Bot, Terminal, Code, Cpu, ShieldCheck, Compass, GitBranch, Award } from 'lucide-react';

export const DocsView: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto p-8 select-text">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Title Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase mb-2">
            <span>Architecture & Developer Manual</span>
            <span>·</span>
            <span>OpenHands Runtime</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            OpenHands: The Open Platform for AI Software Developers
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            OpenHands (formerly OpenDevin) is an open-source autonomous software engineering platform capable of executing arbitrary bash commands, editing codebases, browsing web interfaces, resolving GitHub issues, and evaluating benchmarks like SWE-Bench.
          </p>
        </div>

        {/* 01. The CodeAct Architecture */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>01. The CodeAct Paradigm</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Unlike traditional LLM agents that rely strictly on fragmented JSON tool calls, OpenHands pioneered <strong>CodeAct</strong>. Under CodeAct, actions are synthesized as executable code snippets (Bash shell commands, Python scripts, file diff patches) directly executed in an isolated sandbox environment.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <h3 className="text-xs font-semibold text-white mb-1">Observation Feedback Loop</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Standard output, standard error, exit codes, and test assertions are fed back into context so the agent dynamically self-corrects logic.
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <h3 className="text-xs font-semibold text-white mb-1">Stateful Workspace</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Changes persist on the file tree and git working tree across turns, allowing complex multi-step refactoring workflows.
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
              <h3 className="text-xs font-semibold text-white mb-1">Human-in-the-Loop</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Engineers can pause execution at any step, steer the agent with targeted feedback, or manually edit code in the synchronized editor.
              </p>
            </div>
          </div>
        </section>

        {/* 02. Specialized Agent Personas */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>02. Agent Personas and Modes</span>
          </h2>
          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg bg-slate-900/50">
            <div className="p-4 flex items-start gap-3">
              <Terminal className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xs font-semibold text-white">CodeAct Agent (Default)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  General-purpose software engineer. Interactively runs tests, explores project structure with <code className="font-mono text-slate-300">ls</code> and <code className="font-mono text-slate-300">cat</code>, and applies patches.
                </p>
              </div>
            </div>
            <div className="p-4 flex items-start gap-3">
              <Compass className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xs font-semibold text-white">Planner Agent</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Decomposes high-level requirements into phased implementation tasks, maintaining a structured dependency graph before coding.
                </p>
              </div>
            </div>
            <div className="p-4 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xs font-semibold text-white">Security Auditor</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Focuses on vulnerability scanning, hardcoded secrets, injection attack surfaces, and secure dependency upgrades.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 03. SWE-Bench Evaluation */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>03. SWE-Bench Evaluation Protocol</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            SWE-Bench is a dataset of genuine GitHub issues and pull requests from major open source repositories. For each benchmark task:
          </p>
          <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 pl-2 font-mono">
            <li>Repository is checked out at the commit preceding the bug fix.</li>
            <li>Agent is provided with the raw issue title and user report.</li>
            <li>Agent reproduces the error by running the test suite (<code className="text-slate-300">npm test</code>).</li>
            <li>Agent modifies files to repair faulty calculations or logic.</li>
            <li>Agent reruns tests to verify all test suites pass without regression.</li>
          </ol>
        </section>
      </div>
    </div>
  );
};
