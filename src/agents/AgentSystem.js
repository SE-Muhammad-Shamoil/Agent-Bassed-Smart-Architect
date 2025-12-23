import { blackboard } from '../core/Blackboard';

/**
 * ==================================================================================
 * SHAM ARCHITECT SYS - PRO GEN 6.1 (BUG FIX PATCH)
 * ==================================================================================
 * Fix: Added missing config write to Blackboard prevents crash on Layout.
 */

const LOG = (msg) => console.log(`[Architect Core] ${msg}`);

// ==================================================================================
// 1. ARCHITECTURAL KNOWLEDGE BASE
// ==================================================================================

const ROOM_SPECS = {
  // Weights determine relative height/size of the room in the stack
  'living':     { weight: 2.2, minDim: 14, color: '#fff7ed', label: 'Living Room' },
  'dining':     { weight: 1.4, minDim: 11, color: '#fffbeb', label: 'Dining' },
  'garage':     { weight: 2.0, minDim: 12, color: '#f1f5f9', label: 'Garage' },
  'kitchen':    { weight: 1.5, minDim: 11, color: '#ecfeff', label: 'Kitchen' },
  'master-bed': { weight: 1.8, minDim: 13, color: '#f0f9ff', label: 'Master Suite' },
  'bedroom':    { weight: 1.3, minDim: 10, color: '#f0f9ff', label: 'Bedroom' },
  'study':      { weight: 1.0, minDim: 9,  color: '#fefce8', label: 'Study' },
  'library':    { weight: 1.2, minDim: 10, color: '#fefce8', label: 'Library' },
  'bathroom':   { weight: 0.8, minDim: 6,  color: '#f8fafc', label: 'Bath' }, 
  'utility':    { weight: 0.9, minDim: 7,  color: '#f3f4f6', label: 'Laundry' },
  'prayer':     { weight: 0.8, minDim: 7,  color: '#f0fdf4', label: 'Prayer' },
  'store':      { weight: 0.5, minDim: 5,  color: '#cbd5e1', label: 'Store' },
  'hallway':    { weight: 0,   minDim: 4,  color: '#ffffff', label: 'Hallway' },
  'stairs':     { weight: 0,   minDim: 8,  color: '#e2e8f0', label: 'Stairs' }
};

// ==================================================================================
// 2. GEOMETRY ENGINE
// ==================================================================================

class Rect {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
  }
  get right() { return this.x + this.w; }
  get bottom() { return this.y + this.h; }
}

// ==================================================================================
// 3. AGENT IMPLEMENTATIONS
// ==================================================================================

// --- AGENT 1: ZONING (Assigns Logic) ---
const ZoningAgent = async (config) => {
  LOG('Zoning rooms with direct-access priority...');
  
  // FIX: Write config to blackboard so other agents can read it
  blackboard.write('config', config);

  const pad = 4;
  const buildW = config.width - (pad*2);
  const buildD = config.depth - (pad*2);
  blackboard.write('siteBoundary', new Rect(pad, pad, buildW, buildD));
  
  const inventory = { ...config.rooms };
  const floorPlans = Array.from({ length: config.floors }, () => ({ clusters: [] }));

  const assign = (fIdx, cluster) => {
    const f = Math.min(fIdx, config.floors - 1);
    floorPlans[f].clusters.push(cluster);
  };

  // 1. Master Suite (Priority 1)
  if (inventory.bedroom > 0) {
    const cluster = { type: 'SUITE', main: 'master-bed', subs: [], id: 'master' };
    inventory.bedroom--;
    if (inventory.bathroom > 0) { cluster.subs.push('bathroom'); inventory.bathroom--; }
    assign(config.floors > 1 ? 1 : 0, cluster);
  }

  // 2. Standard Bedrooms
  let curF = config.floors > 1 ? 1 : 0;
  while (inventory.bedroom > 0) {
    const cluster = { type: 'ROOM', main: 'bedroom', subs: [], id: `bed-${inventory.bedroom}` };
    inventory.bedroom--;
    if (inventory.bathroom > 0 && Math.random() > 0.5) {
       cluster.type = 'SUITE';
       cluster.subs.push('bathroom');
       inventory.bathroom--;
    }
    assign(curF, cluster);
    
    if (config.floors > 2 && curF < config.floors - 1) curF++;
    else if (config.floors > 1) curF = 1;
  }

  // 3. Ground Floor Core
  assign(0, { type: 'ROOM', main: 'kitchen', subs: [], id: 'kitchen' });
  if (inventory.dining > 0) assign(0, { type: 'ROOM', main: 'dining', subs: [], id: 'dining' });
  assign(0, { type: 'ROOM', main: 'living', subs: [], id: 'living' });
  if (inventory.garage > 0) assign(0, { type: 'ROOM', main: 'garage', subs: [], id: 'garage' });

  // 4. Remaining Items
  const leftovers = ['bathroom', 'utility', 'prayer', 'library', 'study', 'store'];
  leftovers.forEach(type => {
    while (inventory[type] > 0) {
      assign(0, { type: 'ROOM', main: type, subs: [], id: `${type}-shared` });
      inventory[type]--;
    }
  });

  blackboard.write('floorPlans', floorPlans);
  return true;
};

// --- AGENT 2: LAYOUT SOLVER (The Spine Stacker) ---
const LayoutAgent = async () => {
  LOG('Solving layout with Spine-Anchored Stacking...');
  
  const site = blackboard.read('siteBoundary');
  const floorPlans = blackboard.read('floorPlans');
  const config = blackboard.read('config'); // This should now work
  const allFloorsRegions = [];

  const SPINE_W = 6;
  const SPINE_X = site.x + (site.w - SPINE_W) / 2;

  floorPlans.forEach((plan, floorIdx) => {
    const regions = [];
    
    // 1. Establish Spine
    const hallRect = new Rect(SPINE_X, site.y + 6, SPINE_W, site.h - 10);
    regions.push({ ...hallRect, type: 'hallway' });
    
    if (config.floors > 1) {
       regions.push({ x: SPINE_X, y: hallRect.bottom - 10, w: SPINE_W, h: 10, type: 'stairs' });
       hallRect.h -= 10;
    }

    // 2. Define Wings
    const leftWing = { x: site.x, y: site.y, w: (site.w - SPINE_W)/2, h: site.h };
    const rightWing = { x: SPINE_X + SPINE_W, y: site.y, w: (site.w - SPINE_W)/2, h: site.h };

    // 3. Sort Clusters
    const getScore = (c) => {
       const name = c.main;
       if (name.includes('kitchen') || name.includes('master')) return 0; // Rear
       if (name.includes('dining') || name.includes('utility')) return 20;
       if (name.includes('bed')) return 30;
       if (name.includes('living')) return 80;
       if (name.includes('garage')) return 90; // Front
       return 50;
    };

    const leftClusters = [];
    const rightClusters = [];
    
    plan.clusters.sort((a,b) => getScore(a) - getScore(b));
    
    plan.clusters.forEach((c) => {
      if (c.main === 'garage') rightClusters.push(c);
      else if (c.main === 'kitchen') leftClusters.push(c); 
      else if (c.main === 'living') leftClusters.push(c); 
      else if (c.main === 'dining') leftClusters.push(c);
      else {
         if (leftClusters.length <= rightClusters.length) leftClusters.push(c);
         else rightClusters.push(c);
      }
    });

    // 4. Stack Algorithm
    const stackWing = (wingRect, clusters, side) => {
       if (clusters.length === 0) return;
       
       const totalW = clusters.reduce((sum, c) => sum + (ROOM_SPECS[c.main]?.weight || 1), 0);
       let currentY = wingRect.y;

       clusters.forEach(c => {
          const spec = ROOM_SPECS[c.main] || { weight: 1 };
          const rowH = (spec.weight / totalW) * wingRect.h;
          const rowRect = new Rect(wingRect.x, currentY, wingRect.w, rowH);
          
          if (c.type === 'SUITE' && c.subs.length > 0) {
             const bathW = rowRect.w * 0.35; 
             const bedW = rowRect.w - bathW;
             
             if (side === 'LEFT') {
                regions.push({ x: rowRect.x, y: currentY, w: bathW, h: rowH, type: c.subs[0] });
                regions.push({ x: rowRect.x + bathW, y: currentY, w: bedW, h: rowH, type: c.main });
             } else {
                regions.push({ x: rowRect.x, y: currentY, w: bedW, h: rowH, type: c.main });
                regions.push({ x: rowRect.x + bedW, y: currentY, w: bathW, h: rowH, type: c.subs[0] });
             }
          } else {
             regions.push({ ...rowRect, type: c.main });
          }
          currentY += rowH;
       });
    };

    stackWing(leftWing, leftClusters, 'LEFT');
    stackWing(rightWing, rightClusters, 'RIGHT');
    
    allFloorsRegions.push(regions);
  });

  blackboard.write('floorRegions', allFloorsRegions);
  return true;
};

// --- AGENT 3: STRUCTURAL ---
const StructuralAgent = async () => {
  LOG('Building Walls...');
  const floorRegions = blackboard.read('floorRegions');
  const allWalls = [];

  floorRegions.forEach((rooms) => {
    const walls = [];
    rooms.forEach(r => {
      walls.push({ x1: r.x, y1: r.y, x2: r.x+r.w, y2: r.y, type: 'inner' });
      walls.push({ x1: r.x, y1: r.y+r.h, x2: r.x+r.w, y2: r.y+r.h, type: 'inner' });
      walls.push({ x1: r.x, y1: r.y, x2: r.x, y2: r.y+r.h, type: 'inner' });
      walls.push({ x1: r.x+r.w, y1: r.y, x2: r.x+r.w, y2: r.y+r.h, type: 'inner' });
    });
    
    const b = blackboard.read('siteBoundary');
    const outer = [
      { x1: b.x, y1: b.y, x2: b.x+b.w, y2: b.y },
      { x1: b.x, y1: b.y+b.h, x2: b.x+b.w, y2: b.y+b.h },
      { x1: b.x, y1: b.y, x2: b.x, y2: b.y+b.h },
      { x1: b.x+b.w, y1: b.y, x2: b.x+b.w, y2: b.y+b.h },
    ];
    allWalls.push({ inner: walls, outer: outer });
  });
  blackboard.write('floorWalls', allWalls);
  return true;
};

// --- AGENT 4: DOORS ---
const ConnectivityAgent = async () => {
  LOG('Placing Doors...');
  const floorRegions = blackboard.read('floorRegions');
  const allDoors = [];

  floorRegions.forEach((rooms, floorIndex) => {
    const doors = [];
    const addDoor = (d) => { if(!doors.some(x=>Math.abs(x.x-d.x)<1 && Math.abs(x.y-d.y)<1)) doors.push(d); };

    rooms.forEach((r1, i) => {
      rooms.forEach((r2, j) => {
        if(i <= j) return;
        
        const overlapX = (Math.min(r1.x+r1.w, r2.x+r2.w) - Math.max(r1.x, r2.x));
        const overlapY = (Math.min(r1.y+r1.h, r2.y+r2.h) - Math.max(r1.y, r2.y));
        const touchX = Math.abs(r1.x+r1.w - r2.x) < 0.1 || Math.abs(r2.x+r2.w - r1.x) < 0.1;
        const touchY = Math.abs(r1.y+r1.h - r2.y) < 0.1 || Math.abs(r2.y+r2.h - r1.y) < 0.1;

        const r1Hall = r1.type === 'hallway';
        const r2Hall = r2.type === 'hallway';
        
        if (r1Hall || r2Hall) {
           if (touchX && overlapY > 3) addDoor({x: (r1.x<r2.x?r2.x:r1.x), y: Math.max(r1.y,r2.y)+overlapY/2-1.5, w:3, vertical:true});
           else if (touchY && overlapX > 3) addDoor({x: Math.max(r1.x,r2.x)+overlapX/2-1.5, y: (r1.y<r2.y?r2.y:r1.y), w:3, vertical:false});
        }
        
        const r1Bath = r1.type === 'bathroom';
        const r2Bath = r2.type === 'bathroom';
        const r1Bed = r1.type.includes('bed');
        const r2Bed = r2.type.includes('bed');
        
        if ((r1Bath && r2Bed) || (r2Bath && r1Bed)) {
           if (touchX && overlapY > 3) addDoor({x: (r1.x<r2.x?r2.x:r1.x), y: Math.max(r1.y,r2.y)+overlapY/2-1.5, w:3, vertical:true});
        }
      });
    });
    
    if(floorIndex === 0) {
       const hall = rooms.find(r=>r.type === 'hallway');
       if(hall) addDoor({x: hall.x+hall.w/2-2, y: hall.y+hall.h, w:4, vertical:false});
    }

    allDoors.push(doors);
  });
  blackboard.write('floorDoors', allDoors);
  return true;
};

// ... existing agents ...

// --- AGENT 5: INTERIOR DESIGNER ---
const InteriorAgent = async () => {
  LOG('Arranging Interior Furniture...');
  const floorRegions = blackboard.read('floorRegions');
  const allFurniture = [];

  floorRegions.forEach(rooms => {
    const floorItems = [];
    
    rooms.forEach(r => {
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;

      // Helper to ensure furniture stays inside bounds
      const safeW = (val) => Math.min(val, r.w - 2);
      const safeH = (val) => Math.min(val, r.h - 2);

      switch (true) {
        case r.type.includes('bed'):
          const isMaster = r.type === 'master-bed';
          const bedW = isMaster ? 6 : 4;
          const bedH = 6;
          // Place bed against the "top" wall of the room
          floorItems.push({ 
             type: 'bed', x: cx - bedW/2, y: r.y + 1.5, w: bedW, h: bedH 
          });
          // Pillows
          floorItems.push({ type: 'pillow', x: cx - bedW/2 + 0.5, y: r.y + 2, w: 1.5, h: 1 });
          if(isMaster) floorItems.push({ type: 'pillow', x: cx + bedW/2 - 2, y: r.y + 2, w: 1.5, h: 1 });
          
          // Wardrobe (side wall)
          floorItems.push({ type: 'storage', x: r.x + 0.5, y: r.y + 1, w: 2, h: r.h/2 });
          break;

        case r.type === 'living':
          // L-Shaped Sofa approximation (Main piece + side piece)
          floorItems.push({ type: 'sofa', x: r.x + 2, y: r.y + 2, w: 2.5, h: 8 }); // Vertical back
          floorItems.push({ type: 'sofa', x: r.x + 2, y: r.y + 2, w: 8, h: 2.5 }); // Horizontal back
          // Coffee Table
          floorItems.push({ type: 'table', x: r.x + 5.5, y: r.y + 5.5, w: 4, h: 3 });
          // TV Stand (Opposite wall)
          floorItems.push({ type: 'storage', x: r.x + r.w - 2, y: cy - 4, w: 1.5, h: 8 });
          break;

        case r.type === 'dining':
          // Large Table
          floorItems.push({ type: 'table', x: cx - 3, y: cy - 4, w: 6, h: 8 });
          // Chairs (visual dots)
          floorItems.push({ type: 'chair', x: cx - 4, y: cy - 2, w: 1, h: 1 });
          floorItems.push({ type: 'chair', x: cx + 3, y: cy - 2, w: 1, h: 1 });
          floorItems.push({ type: 'chair', x: cx - 4, y: cy + 1, w: 1, h: 1 });
          floorItems.push({ type: 'chair', x: cx + 3, y: cy + 1, w: 1, h: 1 });
          break;

        case r.type === 'kitchen':
          // Countertops along the edges
          floorItems.push({ type: 'counter', x: r.x, y: r.y, w: r.w, h: 2 }); // Top
          floorItems.push({ type: 'counter', x: r.x, y: r.y, w: 2, h: r.h }); // Left
          // Island
          if(r.w > 10 && r.h > 10) {
             floorItems.push({ type: 'counter', x: cx - 2, y: cy - 2, w: 4, h: 4 });
          }
          break;

        case r.type === 'bathroom':
          // Corner Shower
          floorItems.push({ type: 'counter', x: r.x, y: r.y, w: 3, h: 3 });
          // Sink
          floorItems.push({ type: 'fixture', x: r.x, y: r.y + 4, w: 2, h: 2 });
          break;
          
        case r.type === 'study' || r.type === 'library':
          // Desk
          floorItems.push({ type: 'table', x: r.x + 1, y: r.y + 1, w: 2.5, h: 6 });
          break;
      }
    });
    allFurniture.push(floorItems);
  });

  blackboard.write('floorFurniture', allFurniture);
  return true;
};

export const agents = [
  { name: 'Designing Logic', fn: ZoningAgent },
  { name: 'Making Layout', fn: LayoutAgent },
  { name: 'Structural Skeleton', fn: StructuralAgent },
  { name: 'Designing Interior', fn: InteriorAgent }, 
  { name: 'Graphing to Screen', fn: ConnectivityAgent },
];
