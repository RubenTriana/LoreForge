import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUiStore } from '../store/uiStore';
import { MapPin, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

export default function LocationManager() {
  const { activeUniverseId: universeId } = useUiStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const locations = useLiveQuery(
    () => db.locations.where({ universeId }).toArray(),
    [universeId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.locations.update(editingId, formData);
      setEditingId(null);
    } else {
      await db.locations.add({ ...formData, universeId });
      setIsAdding(false);
    }
    setFormData({ name: '', description: '' });
  };

  const handleEdit = (loc) => {
    setFormData({ name: loc.name, description: loc.description });
    setEditingId(loc.id);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta localización del mapa?')) {
      await db.locations.delete(id);
    }
  };

  return (
    <div className="location-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Geografía y Lugares</h2>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            style={{ background: 'var(--accent)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Añadir Lugar
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="card glass" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{editingId ? 'Editar Lugar' : 'Nuevo Lugar'}</h3>
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>
          <input 
            placeholder="Nombre del lugar (Ciudad, Planeta, Taberna...)" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <textarea 
            placeholder="Descripción detallada, clima, cultura..." 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={4}
          />
          <button type="submit" style={{ background: 'var(--text-primary)', color: 'black', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Check size={18} /> {editingId ? 'Guardar Cambios' : 'Registrar Lugar'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {locations?.map(loc => (
          <div key={loc.id} className="card glass" style={{ position: 'relative' }}>
             <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(loc)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(loc.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{ padding: '8px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '8px', color: 'var(--accent)' }}>
                <MapPin size={24} />
              </div>
              <h4 style={{ fontSize: '1.2rem' }}>{loc.name}</h4>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{loc.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
