class Blackboard {
  constructor() { this.reset(); }
  reset() {
    this.data = {
      config: null,
      siteBoundary: { x: 0, y: 0, w: 0, h: 0 },
      floorRegions: [],
      floorWalls: [],   
      floorDoors: [],
      floorFurniture: [], 
      floorPlans: []
    };
  }
  write(key, val) { this.data[key] = val; }
  read(key) { return this.data[key]; }
  get() { return this.data; }
}
export const blackboard = new Blackboard();