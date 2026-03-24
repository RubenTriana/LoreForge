import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useUiStore } from '../store/uiStore';
import { useLiveQuery } from 'dexie-react-hooks';

export default function WorldManager() {
  const { activeUniverseId } = useUiStore();
  const universe = useLiveQuery(() => db.universes.get(activeUniverseId), [activeUniverseId]);
  const [lore, setLore] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (universe?.lore) {
      setLore(universe.lore);
    }
  }, [universe]);

  const handleSave = async () => {
    if (activeUniverseId) {
      await db.universes.update(activeUniverseId, { lore });
      setIsEditing(false);
    }
  };

  return (
    <div className="world-manager">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Exploración del Mundo</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Configuración profunda del Lore y las leyes del universo.</p>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="glass" style={{ padding: '8px 16px', color: 'white' }}>Editar Lore</button>
        ) : (
          <button onClick={handleSave} style={{ padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px' }}>Guardar Cambios</button>
        )}
      </header>

      <div className="card glass" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        {isEditing ? (
          <textarea 
            value={lore}
            onChange={(e) => setLore(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6', resize: 'none' }}
            placeholder="Escribe la historia de origen, las leyes físicas, las culturas y los mitos de tu mundo..."
          />
        ) : (
          <div style={{ padding: '2rem', whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.1rem', opacity: lore ? 1 : 0.5 }}>
            {lore || "El lore de este mundo aún no ha sido escrito. Empieza a definir las bases de tu universo..."}
          </div>
        )}
      </div>
    </div>
  );
}
