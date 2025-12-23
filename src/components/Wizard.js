import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Box, Layers, AlertCircle, Plus, Minus, Layout } from 'lucide-react';

const RoomCounter = ({ label, count, onChange, min = 0 }) => (
  <div className="room-row">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <div className="counter-controls">
      <button className="counter-btn" onClick={() => onChange(Math.max(min, count - 1))}>
        <Minus size={14}/>
      </button>
      <span className="counter-val">{count}</span>
      <button className="counter-btn" onClick={() => onChange(count + 1)}>
        <Plus size={14}/>
      </button>
    </div>
  </div>
);

export const Wizard = ({ onStart }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  
  // Config State
  const [config, setConfig] = useState({
    width: 50, depth: 60, floors: 1,
    rooms: {
      bedroom: 3, bathroom: 2, kitchen: 1, 
      living: 1, dining: 1, prayer: 0, library: 0, 
      garage: 1, utility: 0
    }
  });

  const update = (k, v) => setConfig(p => ({ ...p, [k]: v }));
  
  const updateRoom = (type, val) => {
    setConfig(prev => ({
      ...prev,
      rooms: { ...prev.rooms, [type]: val }
    }));
  };

  const validateAndGenerate = () => {
    if(config.rooms.bedroom < 1 || config.rooms.kitchen < 1 || config.rooms.bathroom < 1) {
      setError("Min Requirements: 1 Bedroom, 1 Kitchen, 1 Bathroom");
      return;
    }
    setError(null);
    onStart(config);
  };

  return (
    <div className="wizard-container">
      <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="wizard-card">
        
        {/* Header */}
        <div className="wizard-header">
          <div className="flex items-center gap-3">
             <center>
             <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
               <Box className="text-white" size={24} /> 
             </div>
             <div>
               <h1 className="text-xl font-bold text-slate-900 leading-none">Smart Architect</h1>
               <span className="text-xs text-indigo-600 font-bold tracking-widest uppercase">Intelligent Blueprint</span>
             </div>
             </center>

          </div>
        </div>

        {/* Content Area */}
        <div className="wizard-content">
          {step === 1 && (
            <div className="space-y-8">
              {/* Dimensions Section */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">1. Site Dimensions</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="input-group">
                    <label>Plot Width (ft)</label>
                    <input type="number" className="input-field" value={config.width} onChange={e => update('width', +e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Plot Depth (ft)</label>
                    <input type="number" className="input-field" value={config.depth} onChange={e => update('depth', +e.target.value)} />
                  </div>
                </div>
              </div>
              
              {/* Floor Selection Section */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">2. Structure Height</h2>
                <div className="floor-grid">
                   {[1, 2, 3].map(n => (
                     <div 
                       key={n} 
                       onClick={() => update('floors', n)}
                       // Logic for Active Class
                       className={`floor-btn ${config.floors === n ? 'active' : ''}`}
                     >
                       <Layers size={28} className="mb-2 opacity-80"/>
                       <span className="font-bold">{n} Floor{n > 1 ? 's' : ''}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">3. Interior Layout</h2>
                    <p className="text-sm text-slate-400">Distribute your room requirements.</p>
                </div>
              </div>
              
              {/* Two Column Layout Grid */}
              <div className="room-grid-layout">
                
                {/* Left Column: Essentials & Utility */}
                <div className="space-y-6">
                   <div>
                      <div className="room-section-title">Essentials</div>
                      <RoomCounter label="Bedrooms" count={config.rooms.bedroom} min={1} onChange={v => updateRoom('bedroom', v)} />
                      <RoomCounter label="Bathrooms" count={config.rooms.bathroom} min={1} onChange={v => updateRoom('bathroom', v)} />
                      <RoomCounter label="Kitchens" count={config.rooms.kitchen} min={1} onChange={v => updateRoom('kitchen', v)} />
                   </div>

                   <div>
                      <div className="room-section-title">Utility</div>
                      <RoomCounter label="Garage Slots" count={config.rooms.garage} onChange={v => updateRoom('garage', v)} />
                      <RoomCounter label="Laundry/Util" count={config.rooms.utility} onChange={v => updateRoom('utility', v)} />
                   </div>
                </div>

                {/* Right Column: Living & Social */}
                <div className="space-y-6">
                   <div>
                      <div className="room-section-title">Social Areas</div>
                      <RoomCounter label="Living Room" count={config.rooms.living} onChange={v => updateRoom('living', v)} />
                      <RoomCounter label="Dining Room" count={config.rooms.dining} onChange={v => updateRoom('dining', v)} />
                   </div>

                   <div>
                      <div className="room-section-title">Special Purpose</div>
                      <RoomCounter label="Prayer Room" count={config.rooms.prayer} onChange={v => updateRoom('prayer', v)} />
                      <RoomCounter label="Library/Office" count={config.rooms.library} onChange={v => updateRoom('library', v)} />
                   </div>
                </div>

              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 mt-2">
                  <AlertCircle size={16}/> {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="wizard-footer">
          {step === 1 ? (
            <>
              <div></div>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Next Step <ArrowRight size={18}/>
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={validateAndGenerate}>
                Generate Blueprint <Layout size={18}/>
              </button>
            </>
          )}
        </div>

      </motion.div>
    </div>
  );
};