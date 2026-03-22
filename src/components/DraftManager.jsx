import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileText, Plus, Trash2, Edit2, X, Check, BookOpen, Film, Clapperboard } from 'lucide-react';

export default function DraftManager({ universeId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', type: 'novel', content: '' });

  const drafts = useLiveQuery(
    () => db.templates.where({ universeId }).toArray(),
    [universeId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.templates.update(editingId, formData);
      setEditingId(null);
    } else {
      await db.templates.add({ ...formData, universeId });
      setIsAdding(false);
    }
    setFormData({ title: '', type: 'novel', content: '' });
  };

  const handleEdit = (draft) => {
    setFormData({ title: draft.title, type: draft.type, content: draft.content });
    setEditingId(draft.id);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este borrador?')) {
      await db.templates.delete(id);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'screen': return <Film size={20} />;
      case 'comic': return <Clapperboard size={20} />;
      default: return <BookOpen size={20} />;
    }
  };

  return (
    <div className="draft-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Borradores y Proyectos</h2>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            style={{ background: 'var(--accent)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Nuevo Borrador
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="card glass" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{editingId ? 'Editar Borrador' : 'Nuevo Borrador'}</h3>
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>
          <input 
            placeholder="Título del borrador" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            required
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
             <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value})}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '6px', flex: 1 }}
            >
              <option value="novel">Novela / Relato</option>
              <option value="screen">Guion (Cine/TV)</option>
              <option value="comic">Guion de Cómic</option>
            </select>
          </div>
          <textarea 
            placeholder="Escribe aquí tu historia o estructura..." 
            value={formData.content} 
            onChange={e => setFormData({...formData, content: e.target.value})}
            rows={12}
            style={{ fontFamily: formData.type === 'screen' ? 'Courier, monospace' : 'inherit' }}
          />
          <button type="submit" style={{ background: 'var(--text-primary)', color: 'black', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Check size={18} /> {editingId ? 'Guardar Cambios' : 'Crear Borrador'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {drafts?.map(draft => (
          <div key={draft.id} className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: 'var(--accent)' }}>{getIcon(draft.type)}</div>
                <h4 style={{ fontSize: '1.1rem' }}>{draft.title}</h4>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(draft)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(draft.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {draft.type === 'novel' ? 'Novela' : draft.type === 'screen' ? 'Guion' : 'Cómic'}
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {draft.content || 'Sin contenido aún...'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
