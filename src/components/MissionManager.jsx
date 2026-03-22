import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Swords, Plus, Trash2, Edit2, X, Check, User } from 'lucide-react';

export default function MissionManager({ universeId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', characterId: '', status: 'pendiente' });

  const characters = useLiveQuery(() => db.characters.where({ universeId }).toArray()) || [];
  const missions = useLiveQuery(() => db.missions.where({ universeId }).toArray()) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.missions.update(editingId, formData);
      setEditingId(null);
    } else {
      await db.missions.add({ ...formData, universeId });
      setIsAdding(false);
    }
    setFormData({ title: '', description: '', characterId: '', status: 'pendiente' });
  };

  return (
    <div className="mission-manager">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Misiones y Viajes Redentores</h2>
        <button onClick={() => setIsAdding(true)} style={{ background: 'var(--accent)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Nueva Misión
        </button>
      </header>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="card glass" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input placeholder="Título de la misión" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          <select 
            value={formData.characterId} 
            onChange={e => setFormData({...formData, characterId: e.target.value})}
            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '6px' }}
          >
            <option value="">Seleccionar Personaje...</option>
            {characters.map(char => <option key={char.id} value={char.id}>{char.name}</option>)}
          </select>
          <textarea placeholder="Objetivos y descripción del viaje..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '6px' }}>
            <option value="pendiente">Pendiente</option>
            <option value="en-progreso">En Progreso</option>
            <option value="completada">Completada</option>
            <option value="fallida">Fallida</option>
          </select>
          <button type="submit" style={{ background: 'var(--text-primary)', color: 'black', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold' }}>Guardar Misión</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {missions.map(m => {
          const char = characters.find(c => c.id == m.characterId);
          return (
            <div key={m.id} className="card glass" style={{ borderLeft: `4px solid ${m.status === 'completada' ? '#10b981' : 'var(--accent)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '1.2rem' }}>{m.title}</h4>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => { setEditingId(m.id); setFormData(m); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><Edit2 size={14} /></button>
                  <button onClick={() => db.missions.delete(m.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--accent)', marginTop: '5px' }}>
                 <User size={12} /> {char?.name || 'Varios'} • <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{m.status}</span>
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
