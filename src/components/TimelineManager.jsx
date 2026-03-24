import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUiStore } from '../store/uiStore';
import { Calendar, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

export default function TimelineManager() {
  const { activeUniverseId: universeId } = useUiStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', date: '', description: '' });

  const events = useLiveQuery(
    () => db.events.where({ universeId }).sortBy('date'),
    [universeId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.events.update(editingId, formData);
      setEditingId(null);
    } else {
      await db.events.add({ ...formData, universeId });
      setIsAdding(false);
    }
    setFormData({ title: '', date: '', description: '' });
  };

  const handleEdit = (event) => {
    setFormData({ title: event.title, date: event.date, description: event.description });
    setEditingId(event.id);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este evento de la historia?')) {
      await db.events.delete(id);
    }
  };

  return (
    <div className="timeline-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Cronología de Eventos</h2>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            style={{ background: 'var(--accent)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Añadir Evento
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="card glass" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{editingId ? 'Editar Evento' : 'Nuevo Evento'}</h3>
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>
          <input 
            placeholder="Título del evento" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            required
          />
          <input 
            type="text"
            placeholder="Fecha o Era (ej. 1250 d.C., Época Dorada)" 
            value={formData.date} 
            onChange={e => setFormData({...formData, date: e.target.value})}
          />
          <textarea 
            placeholder="Descripción de lo sucedido" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={4}
          />
          <button type="submit" style={{ background: 'var(--text-primary)', color: 'black', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Check size={18} /> {editingId ? 'Guardar Cambios' : 'Registrar Evento'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {events?.map(event => (
          <div key={event.id} className="card glass" style={{ borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>{event.date}</span>
                <h4 style={{ fontSize: '1.2rem', margin: '0.25rem 0' }}>{event.title}</h4>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(event)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(event.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{event.description}</p>
          </div>
        ))}
        {events?.length === 0 && !isAdding && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            La historia aún no ha sido escrita. Comienza añadiendo eventos importantes.
          </p>
        )}
      </div>
    </div>
  );
}
