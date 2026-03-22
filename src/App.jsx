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
  Activity
} from 'lucide-react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [universes, setUniverses] = useState([]);

  const charCount = useLiveQuery(() => db.characters.count()) || 0;
  const eventCount = useLiveQuery(() => db.events.count()) || 0;
  const locationCount = useLiveQuery(() => db.locations.count()) || 0;

  useEffect(() => {
    const init = async () => {
      const all = await db.universes.toArray();
      if (all.length === 0) {
        await db.universes.add({ 
          name: 'Mi Primer Universo', 
          genre: 'Fantasía', 
          description: 'Un mundo por descubrir.' 
        });
        setUniverses(await db.universes.toArray());
      } else {
        setUniverses(all);
      }
    };
    init();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Nexus', icon: LayoutDashboard },
    { id: 'characters', label: 'Población', icon: Users },
    { id: 'world', label: 'Mundo (Lore)', icon: Globe },
    { id: 'staircase', label: 'Escalera (Salva al Gato)', icon: Activity },
    { id: 'objects', label: 'Inventario', icon: Package },
    { id: 'board', label: 'Evolución', icon: TrendingUp },
    { id: 'routes', label: 'Cartografía', icon: Map },
    { id: 'drafts', label: 'Escribanía', icon: FileText },
  ];

  return (
    <div className="app-container">
      <nav className="sidebar glass">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <Compass color="var(--accent)" size={32} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>LoreForge</h2>
        </div>
        
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: activeTab === item.id ? 'var(--accent)' : 'transparent',
              color: activeTab === item.id ? 'white' : 'var(--text-secondary)',
              border: 'none',
              textAlign: 'left',
              width: '100%',
              fontSize: '14px',
              fontWeight: activeTab === item.id ? '600' : '400'
            }}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--accent)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>
              {activeTab}
            </span>
            <h1 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
              {universes[0]?.name || 'Cargando...'}
            </h1>
          </div>
          <button className="glass" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
            <Plus size={18} /> Nuevo Proyecto
          </button>
        </header>

        <div className="view-container">
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div className="card glass">
                <h3 style={{ marginBottom: '1rem' }}>Resumen del Universo</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {universes[0]?.description}
                </p>
              </div>
              <div className="card glass">
                <h3 style={{ marginBottom: '1rem' }}>Estadísticas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Personajes</span>
                    <span style={{ color: 'var(--accent)' }}>{charCount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Eventos</span>
                    <span style={{ color: 'var(--accent)' }}>{eventCount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Localizaciones</span>
                    <span style={{ color: 'var(--accent)' }}>{locationCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'characters' && (
            <CharacterManager universeId={universes[0]?.id} />
          )}


          {activeTab === 'drafts' && (
            <DraftManager universeId={universes[0]?.id} />
          )}

          {activeTab === 'objects' && (
            <ObjectManager universeId={universes[0]?.id} />
          )}

          {activeTab === 'board' && (
            <StoryBoard universeId={universes[0]?.id} />
          )}
          
          {activeTab === 'world' && (
            <WorldManager universe={universes[0]} />
          )}

          {activeTab === 'staircase' && (
            <EventStaircase universeId={universes[0]?.id} />
          )}


          {activeTab === 'routes' && (
            <MapRoutes universeId={universes[0]?.id} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
