import React, { useState, useEffect } from 'react';
import { db } from './db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import CharacterManager from './components/CharacterManager';
import TimelineManager from './components/TimelineManager';
import LocationManager from './components/LocationManager';
import DraftManager from './components/DraftManager';
import StoryBoard from './components/StoryBoard';
import ObjectManager from './components/ObjectManager';
import WorldManager from './components/WorldManager';
import MapRoutes from './components/MapRoutes';
import EventStaircase from './components/EventStaircase';
import NexusDashboard from './components/NexusDashboard';
import SettingsPanel from './components/SettingsPanel';
import AiStatusMonitor from './components/AiStatusMonitor';
import { useUiStore } from './store/uiStore';
import { 
  Users, 
  Globe, 
  Calendar, 
  MapPin, 
  FileText, 
  Plus,
  Compass,
  LayoutDashboard,
  TrendingUp,
  Package,
  Swords,
  Navigation,
  Map,
  Activity,
  Settings
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import './index.css';

const DEFAULT_NAV_ITEMS = [
  { id: 'dashboard', label: 'Nexus', icon: LayoutDashboard },
  { id: 'characters', label: 'Población', icon: Users },
  { id: 'world', label: 'Lore', icon: Globe },
  { id: 'staircase', label: 'Escaleta', icon: Activity },
  { id: 'objects', label: 'Inventario', icon: Package },
  { id: 'board', label: 'Evolución', icon: TrendingUp },
  { id: 'routes', label: 'Cartografía', icon: Map },
  { id: 'drafts', label: 'Escribanía', icon: FileText },
];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card glass" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>ALGO SALIÓ MAL</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Hubo un error al cargar este módulo.</p>
          <button 
            className="glass" 
            style={{ marginTop: '1rem', padding: '8px 16px', color: 'white' }}
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { currentView, setView, activeUniverseId, setActiveUniverseId, toggleSettingsModal } = useUiStore();
  const [staircaseJumpStep, setStaircaseJumpStep] = useState(0);
  const [staircaseHighlightCharId, setStaircaseHighlightCharId] = useState(null);
  const [universes, setUniverses] = useState([]);
  
  const handleJumpToStep = (stepIndex, charId = null) => {
    setStaircaseJumpStep(stepIndex);
    setStaircaseHighlightCharId(charId);
    setView('staircase');
  };

  // Dynamic Nav Items with persistence
  const [navItems, setNavItems] = useState(() => {
    const saved = localStorage.getItem('loreforge-nav-order');
    if (saved) {
      const savedIds = JSON.parse(saved);
      return savedIds.map(id => DEFAULT_NAV_ITEMS.find(item => item.id === id)).filter(Boolean);
    }
    return DEFAULT_NAV_ITEMS;
  });

  const charCount = useLiveQuery(() => db.characters.count()) || 0;
  const eventCount = useLiveQuery(() => db.events.count()) || 0;
  const locationCount = useLiveQuery(() => db.locations.count()) || 0;

  useEffect(() => {
    localStorage.setItem('loreforge-nav-order', JSON.stringify(navItems.map(i => i.id)));
  }, [navItems]);

  useEffect(() => {
    const init = async () => {
      const all = await db.universes.toArray();
      let activeId = null;
      if (all.length === 0) {
        activeId = await db.universes.add({ 
          name: 'Mi Primer Universo', 
          genre: 'Fantasía', 
          description: 'Un mundo por descubrir.' 
        });
        const updatedAll = await db.universes.toArray();
        setUniverses(updatedAll);
      } else {
        setUniverses(all);
        activeId = all[0].id;
      }
      setActiveUniverseId(activeId);

      // Seed Dummy Token Logs if empty
      const logCount = await db.token_logs.count();
      if (logCount === 0) {
        const modules = ['Personajes', 'Lore', 'Escribanía', 'Análisis'];
        const actions = ['Generación de Retrato', 'Extracción de Lore', 'Escritura de Capítulo', 'Análisis de Sentimiento'];
        const dummyLogs = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const callsToday = Math.floor(Math.random() * 5) + 2;
          for (let j = 0; j < callsToday; j++) {
            const mod = modules[Math.floor(Math.random() * modules.length)];
            const act = actions[Math.floor(Math.random() * actions.length)];
            const pTokens = Math.floor(Math.random() * 2000) + 500;
            const cTokens = Math.floor(Math.random() * 1000) + 200;
            dummyLogs.push({
              timestamp: date.toISOString(),
              module: mod,
              action: act,
              promptTokens: pTokens,
              completionTokens: cTokens,
              cost: (pTokens / 1_000_000) * 0.5 + (cTokens / 1_000_000) * 1.5
            });
          }
        }
        await db.token_logs.bulkAdd(dummyLogs);
      }
    };
    init();
  }, [setActiveUniverseId]);

  const activeUniverse = universes.find(u => u.id === activeUniverseId) || universes[0];

  return (
    <div className="app-container">
      <AiStatusMonitor />
      <nav className="sidebar glass" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <Compass color="var(--accent)" size={32} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>LoreForge</h2>
        </div>
        
        <Reorder.Group axis="y" values={navItems} onReorder={setNavItems} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, listStyle: 'none', flex: 1 }}>
          {navItems.map(item => (
            <Reorder.Item 
              key={item.id} 
              value={item}
              whileDrag={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.4)", zIndex: 10 }}
              style={{ listStyle: 'none' }}
            >
              <button
                onClick={() => setView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: currentView === item.id ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                  color: currentView === item.id ? 'white' : 'var(--text-secondary)',
                  border: '1px solid transparent',
                  borderColor: currentView === item.id ? 'transparent' : 'rgba(255,255,255,0.05)',
                  textAlign: 'left',
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: currentView === item.id ? '600' : '400',
                  cursor: 'grab',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
          <button
            onClick={() => toggleSettingsModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-secondary)',
              border: '1px solid transparent',
              borderColor: 'rgba(255,255,255,0.05)',
              textAlign: 'left',
              width: '100%',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Settings size={18} />
            Configuración de IA
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--accent)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>
              {currentView}
            </span>
            <h1 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
              {activeUniverse?.name || 'Cargando...'}
            </h1>
          </div>
          <button className="glass" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
            <Plus size={18} /> Nuevo Proyecto
          </button>
        </header>

        <div className="view-container">
          {currentView === 'dashboard' && (
            <NexusDashboard />
          )}
          
          {currentView === 'characters' && (
            <CharacterManager />
          )}

          {currentView === 'drafts' && (
            <DraftManager />
          )}

          {currentView === 'objects' && (
            <ObjectManager />
          )}

          {currentView === 'board' && (
            <StoryBoard 
              onNavigateToStep={handleJumpToStep}
            />
          )}
          
          {currentView === 'world' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <WorldManager />
              <LocationManager />
            </div>
          )}

          {currentView === 'staircase' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <EventStaircase 
                initialStep={staircaseJumpStep}
                highlightCharId={staircaseHighlightCharId}
              />
              <TimelineManager />
            </div>
          )}

          {currentView === 'routes' && (
            <ErrorBoundary>
              <MapRoutes />
            </ErrorBoundary>
          )}
        </div>
      </main>
      
      <SettingsPanel />
    </div>
  );
}

export default App;
