import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUiStore } from '../store/uiStore';
import { Package, Plus, Trash2, Edit2, X, Check, MapPin, User } from 'lucide-react';

export default function ObjectManager() {
  const { activeUniverseId: universeId } = useUiStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', currentOwner: '' });

  const objects = useLiveQuery(
    () => db.objects.where({ universeId }).toArray(),
    [universeId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.objects.update(editingId, formData);
      setEditingId(null);
    } else {
      await db.objects.add({ ...formData, universeId });
      setIsAdding(false);
    }
    setFormData({ name: '', description: '', currentOwner: '' });
  };

  return (
    <div className="object-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Objetos Clave y MacGuffins</h2>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            style={{ background: 'var(--accent)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Añadir Objeto
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="card glass" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{editingId ? 'Editar Objeto' : 'Nuevo Objeto'}</h3>
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>
          <input 
            placeholder="Nombre del objeto (ej. Espada Sagrada, Carta Secreta)" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <input 
            placeholder="Portador actual" 
            value={formData.currentOwner} 
            onChange={e => setFormData({...formData, currentOwner: e.target.value})}
          />
          <textarea 
            placeholder="Descripción e importancia en la trama" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={4}
          />
          <button type="submit" style={{ background: 'var(--text-primary)', color: 'black', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold' }}>
            {editingId ? 'Guardar Cambios' : 'Crear Objeto'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {objects?.map(obj => (
          <div key={obj.id} className="card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={20} color="var(--accent)" />
                <h4 style={{ fontSize: '1.1rem' }}>{obj.name}</h4>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditingId(obj.id); setFormData(obj); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><Edit2 size={16} /></button>
                <button onClick={() => db.objects.delete(obj.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} /> {obj.currentOwner || 'Desconocido'}
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>{obj.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
