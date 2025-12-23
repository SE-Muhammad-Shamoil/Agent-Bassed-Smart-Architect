import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Blueprint = ({ data }) => {
  const [activeFloor, setActiveFloor] = useState(0);

  if (!data.floorRegions) return null;

  const { siteBoundary: b, floorRegions, floorWalls, floorDoors, floorFurniture } = data;

  const rooms = floorRegions[activeFloor] || [];
  const walls = floorWalls[activeFloor] || { inner: [], outer: [] };
  const doors = floorDoors[activeFloor] || [];
  const furniture = floorFurniture ? (floorFurniture[activeFloor] || []) : []; // Safe access

  const scale = 8;
  const p = 50;
  const w = b.w * scale + (p * 2);
  const h = b.h * scale + (p * 2);

  const getColor = (type) => {
    switch (type) {
      case 'garage': return '#f1f5f9';
      case 'living': return '#fff7ed';
      case 'kitchen': return '#ecfeff';
      case 'dining': return '#fffbeb';
      case 'master-bed': return '#f0f9ff';
      case 'bedroom': return '#f0f9ff';
      case 'bathroom': return '#f8fafc';
      case 'prayer': return '#f0fdf4';
      case 'library': return '#fefce8';
      case 'study': return '#fefce8';
      case 'utility': return '#f3f4f6';
      case 'hallway': return '#ffffff';
      case 'stairs': return '#f1f5f9';
      default: return '#ffffff';
    }
  };

  const getFurnStyle = (type) => {
    const base = { strokeWidth: 0.5, stroke: "#94a3b8" };
    switch (type) {
      case 'bed': return { ...base, fill: "#ffffff", rx: 2 };
      case 'pillow': return { ...base, fill: "#cbd5e1", stroke: "none", rx: 1 };
      case 'sofa': return { ...base, fill: "#ffffff", rx: 2 };
      case 'table': return { ...base, fill: "#ffffff", rx: 1 };
      case 'counter': return { ...base, fill: "#e2e8f0", rx: 0 };
      case 'storage': return { ...base, fill: "#f1f5f9", rx: 0 };
      case 'fixture': return { ...base, fill: "#ffffff", rx: 2 };
      case 'chair': return { ...base, fill: "#cbd5e1", rx: 2 };
      default: return base;
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center w-full">
      <div className="flex gap-2 mb-4 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
        {floorRegions.map((_, idx) => (
          <button key={idx} onClick={() => setActiveFloor(idx)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeFloor === idx ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            {idx === 0 ? 'Ground Floor' : `Level ${idx}`}
          </button>
        ))}
      </div>

      <div className="blueprint-wrapper rounded-lg p-4 overflow-auto max-h-[85vh] bg-white relative shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFloor}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
              </defs>
              <g transform={`translate(${p}, ${p})`}>
                {/* Site */}
                <rect x="-20" y="-20" width={b.w * scale + 40} height={b.h * scale + 40}
                  fill={activeFloor === 0 ? "#f0fdf4" : "#f8fafc"} rx="10"
                  stroke={activeFloor === 0 ? "#bbf7d0" : "#e2e8f0"} strokeWidth="1" strokeDasharray="5,5" />

                {/* Rooms Layer */}
                {rooms.map((r, i) => (
                  <g key={i}>
                    <rect x={r.x * scale} y={r.y * scale} width={r.w * scale} height={r.h * scale}
                      fill={getColor(r.type)} stroke="#cbd5e1" strokeWidth="1" />

                    {/* Stairs Pattern */}
                    {r.type === 'stairs' && (
                      [...Array(Math.floor(r.h / 1.5))].map((_, si) => (
                        <line key={si} x1={r.x * scale} y1={(r.y * scale) + (si * 12)} x2={(r.x + r.w) * scale} y2={(r.y * scale) + (si * 12)} stroke="#cbd5e1" strokeWidth="1" />
                      ))
                    )}
                  </g>
                ))}

                {/* Furniture Layer */}
                {furniture.map((item, i) => {
                  const style = getFurnStyle(item.type);
                  return (
                    <rect key={'furn' + i}
                      x={item.x * scale} y={item.y * scale}
                      width={item.w * scale} height={item.h * scale}
                      {...style}
                    />
                  )
                })}

                {/* Walls Layer */}
                {walls.inner.map((w, i) => <line key={'iw' + i} x1={w.x1 * scale} y1={w.y1 * scale} x2={w.x2 * scale} y2={w.y2 * scale} stroke="#64748b" strokeWidth="2" strokeLinecap="round" />)}
                {walls.outer.map((w, i) => <line key={'ow' + i} x1={w.x1 * scale} y1={w.y1 * scale} x2={w.x2 * scale} y2={w.y2 * scale} stroke="#334155" strokeWidth="3" strokeLinecap="round" />)}

                {/* Doors Layer */}
                {doors.map((d, i) => (
                  <g key={'d' + i}>
                    <rect x={d.vertical ? d.x * scale - 4 : d.x * scale} y={d.vertical ? d.y * scale : d.y * scale - 4}
                      width={d.vertical ? 8 : d.w * scale} height={d.vertical ? d.w * scale : 8} fill="white" />
                    <path d={d.vertical
                      ? `M ${d.x * scale} ${d.y * scale} v ${d.w * scale} a ${d.w * scale} ${d.w * scale} 0 0 1 -${d.w * scale} -${d.w * scale}`
                      : `M ${d.x * scale} ${d.y * scale} h ${d.w * scale} a ${d.w * scale} ${d.w * scale} 0 0 1 -${d.w * scale} -${d.w * scale}`
                    } fill="none" stroke="#64748b" strokeWidth="1" />
                  </g>
                ))}

                {/* Text Layer  */}
                {rooms.map((r, i) => (
                  <text
                    key={'txt' + i}
                    x={(r.x + r.w / 2) * scale}
                    y={(r.y + r.h / 2) * scale}
                    textAnchor="middle"
                    dominantBaseline="middle"

                
                    style={{ fontSize: '10px', fontWeight: 'bold' }}

                    className="fill-slate-400 uppercase tracking-widest pointer-events-none opacity-60"
                  >
                    {r.type.replace('-', ' ')}
                  </text>
                ))}

              </g>
              <text x={w / 2} y={h - 15} textAnchor="middle" fill="#94a3b8" className="text-[5px] font-mono tracking-widest">
              </text>
            </svg>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};