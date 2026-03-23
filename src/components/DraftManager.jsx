import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  FileText, Plus, Trash2, Edit2, X, Check, BookOpen, Film, Clapperboard, 
  Sparkles, CheckCircle, AlertCircle, Users, MapPin, Package, Save
} from 'lucide-react';

export default function DraftManager({ universeId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', type: 'novel', content: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null); // { characters: [], locations: [], objects: [] }

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

  const handleScanLore = async () => {
    if (!formData.content.trim()) return;
    setIsScanning(true);
    
    // Simulate AI thinking or do Regex scan
    const text = formData.content;
    
    // Simple Capitalized Word detection (excluding sentence starters if possible, but keeping it simple)
    // This is a placeholder for a more advanced NLP/AI scan
    const potentialEntities = Array.from(new Set(text.match(/[A-Z][a-z]{2,}/g) || []));
    
    // Common Spanish stop words that might be capitalized at start of sentence
    const stopWords = ['Para', 'Como', 'Pero', 'Este', 'Esta', 'Aquel', 'Ellos', 'Ellas', 'Donde', 'Cuando', 'Porque'];
    const filteredEntities = potentialEntities.filter(e => !stopWords.includes(e));

    const existingChars = await db.characters.where({ universeId }).toArray();
    const existingLocs = await db.locations.where({ universeId }).toArray();
    const existingObjs = await db.objects.where({ universeId }).toArray();

    const results = {
      characters: filteredEntities.filter(e => !existingChars.some(c => c.name.includes(e))),
      locations: [], // For now, we'll put all in candidates
      objects: []
    };

    // In a real scenario, we'd use AI to categorize. 
    // For this demo, we'll let the user categorize or we'll guess by context.
    
    setScanResults(results);
    setIsScanning(false);
  };

  const handleCreateEntities = async (selectedEntities) => {
    // selectedEntities: { characters: [], locations: [], objects: [] }
    for (const name of selectedEntities.characters) {
      await db.characters.add({ name, role: 'Secundario', description: 'Detectado en borrador', universeId });
    }
    for (const name of selectedEntities.locations) {
      await db.locations.add({ name, description: 'Lugar detectado en borrador', universeId });
    }
    for (const name of selectedEntities.objects) {
      await db.objects.add({ name, description: 'Objeto detectado en borrador', universeId });
    }
    setScanResults(null);
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
          
          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }} />
          
          <button 
            type="button"
            onClick={handleScanLore}
            disabled={isScanning || !formData.content}
            style={{ 
              background: 'transparent', 
              color: 'var(--accent)', 
              padding: '10px', 
              borderRadius: '6px', 
              border: '1px solid var(--accent)', 
              fontWeight: '600', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px',
              opacity: isScanning ? 0.5 : 1
            }}
          >
            {isScanning ? <Sparkles className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {isScanning ? 'Escaneando Lore...' : 'Escanear Lore Sugerido'}
          </button>
        </form>
      )}

      {/* Scan Results Modal Overlay */}
      {scanResults && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="card glass" 
            style={{ maxWidth: '600px', width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles color="var(--accent)" /> Entidades Detectadas
              </h3>
              <button onClick={() => setScanResults(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              He encontrado estas posibles entidades en tu texto que no están en tu base de datos. Selecciona cuáles quieres añadir:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
              {scanResults.characters.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> Posibles Personajes
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {scanResults.characters.map(name => (
                      <button 
                        key={name}
                        onClick={() => {
                          // Toggle logic or just direct add for now
                          handleCreateEntities({ characters: [name], locations: [], objects: [] });
                        }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={12} /> {name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>No se detectaron nuevas entidades claras.</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setScanResults(null)} className="glass" style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>Omitir</button>
            </div>
          </motion.div>
        </div>
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
