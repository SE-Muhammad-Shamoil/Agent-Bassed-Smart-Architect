import React, { useState } from 'react';
import { Wizard } from './components/Wizard';
import { Blueprint } from './components/Blueprint';
import { agents } from './agents/AgentSystem';
import { blackboard } from './core/Blackboard';
import { Cpu, CheckCircle, Loader2, RotateCcw, User } from 'lucide-react';
import './styles/main.css';

function App() {
  const [view, setView] = useState('wizard');
  const [agentStatus, setAgentStatus] = useState(agents.map(a => ({ ...a, status: 'waiting' })));
  const [finalData, setFinalData] = useState(null);

  const runSimulation = async (config) => {
    setView('processing');
    blackboard.reset();
    setFinalData(null);
    setAgentStatus(agents.map(a => ({ ...a, status: 'waiting' })));

    for (let i = 0; i < agents.length; i++) {
      setAgentStatus(prev => { const n = [...prev]; n[i].status = 'active'; return n; });
      await new Promise(r => setTimeout(r, 600)); 
      await agents[i].fn(config);
      setAgentStatus(prev => { const n = [...prev]; n[i].status = 'done'; return n; });
    }
    setFinalData(blackboard.get());
  };

  return (
    <div className="app relative min-h-screen">
      {/* 1. Main Content Area */}
      {view === 'wizard' && <Wizard onStart={runSimulation} />}
      
      {view === 'processing' && (
        <div className="dashboard">
          <div className="sidebar">
            <div className="mb-8">
               <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <Cpu className="text-indigo-600"/> Agent System
               </h2>
               <p className="text-xs text-slate-500 mt-1">Multi-Agent Processing Unit</p>
            </div>
            
            <div className="space-y-3 flex-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Protocols</h3>
              {agentStatus.map((agent, i) => (
                <div key={i} className={`agent-row ${agent.status}`}>
                  {agent.status === 'active' ? <Loader2 className="animate-spin text-indigo-600" size={18}/> : 
                   agent.status === 'done' ? <CheckCircle size={18} className="text-emerald-500"/> : 
                   <div className="w-4 h-4 rounded-full border border-slate-300"/>}
                  <span>{agent.name}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-200">
               {finalData && (
                 <button className="btn btn-primary w-full justify-center" onClick={() => setView('wizard')}>
                    <RotateCcw size={18}/> New Design
                 </button>
               )}
            </div>
          </div>
          
          <div className="canvas-area">
            {finalData ? <Blueprint data={finalData} /> : (
              <div className="text-center text-slate-400"><center>
                <Loader2 size={48} className="animate-spin mx-auto mb-4 text-indigo-500"/>
                <p className="font-medium">Architectural AI is thinking...</p>
                <p className="text-xs mt-2 opacity-70">Calculating binary space partitions</p></center>
              </div>
            )}
          </div>
        </div>
      )}

      <div 
        style={{
            position: 'fixed',
            bottom: '20px',    // Distance from bottom
            right: '20px',     // Distance from right
            zIndex: 99999,     // Ensures it stays on top
            backgroundColor: 'white',
            border: '1px solid green', // Light grey border
            borderRadius: '12px',
            padding: '20px',
            width: '260px',
            boxShadow: '10px 30px 30px 5px rgba(15, 211, 120, 0.1)'
        }}
      >
         <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider border-b border-slate-100 pb-1">
            Development Team
         </div>
         
         <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800"> 
               <User size={14} className="text-indigo-500"/> Muhammad Shamoil
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
               <User size={14} className="text-slate-400"/> ARSLAN JAFFER
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
               <User size={14} className="text-slate-400"/> ALI RAZA
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
               <User size={14} className="text-slate-400"/> MUHAMMAD ABDULLAH
            </div>
         </div>
      </div>

    </div>
  );
}

export default App;