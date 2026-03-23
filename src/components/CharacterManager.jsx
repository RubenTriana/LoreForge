import React, { useState, useRef } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Trash2, Edit2, X, Check, Image as ImageIcon, Heart, Zap, Ghost, Camera, MoreVertical } from 'lucide-react';

// Helper component for dropdown items
const DropdownItem = ({ icon, label, onClick, color = 'white' }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      width: '100%',
      padding: '10px 12px',
      borderRadius: '10px',
      background: 'none',
      border: 'none',
      color: color,
      fontSize: '0.9rem',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background 0.2s',
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default function CharacterManager({ universeId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null); // Menu Dropdown state
  const fileInputRefs = useRef({}); // Store refs for each character card

  const [formData, setFormData] = useState({
    name: '', role: '', description: '', imageUrl: '', physical: '', psychological: '', spiritual: ''
  });

  const characters = useLiveQuery(
    () => db.characters.where({ universeId }).toArray(),
    [universeId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await db.characters.update(editingId, formData);
      setEditingId(null);
    } else {
      await db.characters.add({ ...formData, universeId });
      setIsAdding(false);
    }
    setFormData({ name: '', role: '', description: '', imageUrl: '', physical: '', psychological: '', spiritual: '' });
  };

  const handleFileChange = (e, charId = null) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (charId) {
          // Direct update for existing character
          await db.characters.update(charId, { imageUrl: reader.result });
        } else {
          // Update form data for new character
          setFormData({ ...formData, imageUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (char) => {
    setFormData({
      name: char.name, role: char.role, description: char.description,
      imageUrl: char.imageUrl || '', physical: char.physical || '',
      psychological: char.psychological || '', spiritual: char.spiritual || ''
    });
    setEditingId(char.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar a este personaje?')) {
      await db.characters.delete(id);
    }
  };

  return (
    <div className="character-manager" style={{ paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Población del Universo</h2>
        {!isAdding && !editingId && (
          <button onClick={() => setIsAdding(true)} style={{ background: 'var(--accent)', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <UserPlus size={20} /> Crear Habitante
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="card glass" style={{ marginBottom: '3rem', padding: '2rem', borderRadius: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem' }}>{editingId ? 'Refinar Perfil' : 'Dar Vida a un Personaje'}</h3>
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><X size={24} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <input placeholder="Nombre Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white' }} />
              <input placeholder="Rol en la Historia (Protagonista, Villano...)" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: 'white' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div onClick={() => {
                  const el = document.getElementById('mainFileInput');
                  if (el) el.click();
                }} style={{
                  borderRadius: '16px', width: '100%', aspectRatio: '2/3', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                  border: '2px dashed var(--glass-border)', background: 'rgba(124,58,237,0.05)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s'
                }}>
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Vista previa"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    />
                  )}
                  {formData.imageUrl && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />}
                  <Camera size={32} style={{ position: 'relative', zIndex: 1, color: 'var(--accent)' }} />
                  <span style={{ fontSize: '0.9rem', position: 'relative', zIndex: 1, marginTop: '8px', fontWeight: '500' }}>{formData.imageUrl ? 'Cambiar Retrato' : 'Subir Retrato de Perfil'}</span>
                  <input id="mainFileInput" type="file" accept="image/*" onChange={(e) => handleFileChange(e)} style={{ display: 'none' }} />
                </div>
              </div>
              <textarea placeholder="Descripción y motivaciones..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 'bold' }}><Zap size={14} /> RASGOS FÍSICOS</label>
                <textarea placeholder="Ej: Cicatriz en el ojo derecho, alto y fuerte..." value={formData.physical} onChange={e => setFormData({...formData, physical: e.target.value})} rows={3} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}><Heart size={14} /> PSICOLOGÍA Y TEMORES</label>
                <textarea placeholder="Ej: Temor al fracaso, buscador de justicia..." value={formData.psychological} onChange={e => setFormData({...formData, psychological: e.target.value})} rows={3} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 'bold' }}><Ghost size={14} /> LINAJE / ESPÍRITU</label>
                <textarea placeholder="Ej: Heredero del reino caído, cree en el destino..." value={formData.spiritual} onChange={e => setFormData({...formData, spiritual: e.target.value})} rows={3} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px', color: 'white' }} />
              </div>
            </div>
          </div>
          <button type="submit" style={{ background: 'var(--accent)', color: 'white', padding: '18px', borderRadius: '16px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '1.5rem', width: '100%', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
            {editingId ? 'Sincronizar Cambios' : 'Confirmar Creación'}
          </button>
        </form>
      )}

      {/* Grid de Personajes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
        {characters?.map(char => (
          <motion.div
            key={char.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card glass"
            style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'visible', borderRadius: '24px', border: '1px solid var(--glass-border)', transition: 'all 0.3s', position: 'relative' }}
          >
            {/* Cabecera / Imagen con Aspect Ratio Fijo 2:3 */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: 'var(--bg-dark)', overflow: 'hidden', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
               {char.imageUrl && (
                 <img
                   src={char.imageUrl}
                   alt={char.name}
                   style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                 />
               )}
               <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)' }} />

               {!char.imageUrl && (
                 <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', opacity: 0.5 }}>
                   <ImageIcon size={64} />
                 </div>
               )}

               {/* Trigger para el Menú Dropdown (⋮) */}
               <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 100 }}>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     setActiveDropdownId(activeDropdownId === char.id ? null : char.id);
                   }}
                   style={{
                     background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                     border: '1px solid rgba(255,255,255,0.2)', color: 'white',
                     width: '40px', height: '40px', borderRadius: '12px',
                     cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                     transition: 'all 0.2s'
                   }}
                 >
                   <MoreVertical size={20} />
                 </button>

                 {/* Hidden File Input - Must be always present to avoid unmounting issues */}
                 <input 
                   type="file" accept="image/*" style={{ display: 'none' }} 
                   ref={el => { if (el) fileInputRefs.current[char.id] = el; }}
                   onChange={(e) => handleFileChange(e, char.id)}
                 />

                 <AnimatePresence>
                   {activeDropdownId === char.id && (
                     <>
                       {/* Transparent Backdrop to close on click outside */}
                       <div 
                         onClick={() => setActiveDropdownId(null)} 
                         style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                       />
                       
                       <motion.div
                         initial={{ opacity: 0, scale: 0.95, y: -10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95, y: -10 }}
                         style={{ 
                           position: 'absolute', top: '50px', right: '0', 
                           background: 'rgba(15, 15, 20, 0.95)', backdropFilter: 'blur(20px)',
                           border: '1px solid var(--glass-border)', borderRadius: '16px', 
                           padding: '8px', minWidth: '180px', zIndex: 110,
                           boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                         }}
                       >
                         <DropdownItem 
                           icon={<Camera size={16} />} 
                           label="Cambiar Retrato" 
                           onClick={() => { fileInputRefs.current[char.id]?.click(); setActiveDropdownId(null); }} 
                         />
                         <DropdownItem 
                           icon={<Edit2 size={16} />} 
                           label="Editar Detalles" 
                           onClick={() => { handleEdit(char); setActiveDropdownId(null); }} 
                         />
                         <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 8px' }} />
                         <DropdownItem 
                           icon={<Trash2 size={16} />} 
                           label="Eliminar" 
                           color="#ef4444"
                           onClick={() => { handleDelete(char.id); setActiveDropdownId(null); }} 
                         />
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
               </div>

               <div style={{ position: 'absolute', bottom: '20px', left: '25px', right: '25px' }}>
                 <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>{char.role || 'Habitante'}</span>
                 <h4 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{char.name}</h4>
               </div>
            </div>

            {/* Cuerpo de la Tarjeta */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                <div className="glass" style={{ padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <Zap size={16} color="var(--accent)" />
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.physical || 'Desconocido'}</div>
                </div>
                <div className="glass" style={{ padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <Heart size={16} color="#10b981" />
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.psychological || 'Misterioso'}</div>
                </div>
                <div className="glass" style={{ padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <Ghost size={16} color="#f59e0b" />
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.spiritual || 'Ancestral'}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {char.description || 'Este personaje aún no tiene una historia definida...'}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
