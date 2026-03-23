import Dexie from 'dexie';

export const db = new Dexie('LoreForgeDB');

db.version(8).stores({
  universes: '++id, name, genre, description, lore',
  characters: '++id, name, role, description, imageUrl, physical, psychological, spiritual, universeId',
  events: '++id, title, date, description, universeId',
  locations: '++id, name, description, universeId',
  templates: '++id, title, type, content, universeId',
  objects: '++id, name, description, currentOwner, universeId',
  arcs: '++id, characterId, eventId, physicalChange, psychoChange, spiritualChange, universeId',
  missions: '++id, title, description, characterId, status, universeId',
  routes: '++id, name, points, mapImageUrl, lineStyle, lineColor, universeId',
  staircase: '++id, universeId, steps',
  token_logs: '++id, timestamp, module, promptTokens, completionTokens, cost, action'
});

export default db;
