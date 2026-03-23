import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ChevronRight, Save, User as UserIcon, Type, Target, Clock, 
  CheckCircle2, Info, Plus, X, Users, AtSign
} from 'lucide-react';
import { motion } from 'framer-motion';

const SNYDER_BEATS = [
  { title: "Imagen Inicial", objective: "Establecer el tono y el mundo antes del cambio." },
  { title: "Declaración del Tema", objective: "Indicar sutilmente de qué trata realmente la historia (lección moral)." },
  { title: "Planteamiento", objective: "Presentar a los personajes y sus carencias." },
  { title: "Catalizador", objective: "El evento que cambia la vida del protagonista." },
  { title: "Debate", objective: "El protagonista duda o se resiste al cambio." },
  { title: "Paso al Acto 2", objective: "El héroe toma la decisión consciente de actuar." },
  { title: "Trama B", objective: "Relación secundaria que refuerza el tema (romance o amistad)." },
  { title: "Juegos y Risas", objective: "Cumplir la 'promesa de la premisa' (lo divertido o emocionante)." },
  { title: "Punto Medio", objective: "Un pico de éxito falso o una derrota aparente." },
  { title: "Los Malos Cierran el Cerco", objective: "Los problemas internos y externos se complican." },
  { title: "Todo Está Perdido", objective: "El protagonista toca fondo; alguien suele morir." },
  { title: "La Noche Oscura del Alma", objective: "El héroe reflexiona sobre su fracaso." },
  { title: "Paso al Acto 3", objective: "Se encuentra la solución combinando las lecciones de A y B." },
  { title: "Final", objective: "El protagonista derrota al antagonista y cambia el mundo." },
  { title: "Imagen Final", objective: "El espejo de la imagen inicial, mostrando el cambio total." }
];

export default function EventStaircase({ universeId, initialStep = 0, highlightCharId = null }) {
  const [selectedStep, setSelectedStep] = useState(initialStep);
  const [editingContent, setEditingContent] = useState("");
  const [involvedIds, setInvolvedIds] = useState([]);
  const [showCastPanel, setShowCastPanel] = useState(false);
  const [newCharName, setNewCharName] = useState("");

  const characters = useLiveQuery(() => db.characters.where({ universeId }).toArray()) || [];
  const staircaseData = useLiveQuery(() => db.staircase.where({ universeId }).first(), [universeId]);

  useEffect(() => {
    setSelectedStep(initialStep);
    if (highlightCharId) {
      setShowCastPanel(true);
    }
  }, [initialStep, highlightCharId]);

  useEffect(() => {
    if (staircaseData) {
      const steps = JSON.parse(staircaseData.steps || '[]');
      if (steps[selectedStep]) {
        setEditingContent(steps[selectedStep].content || '');
        setInvolvedIds(steps[selectedStep].characterIds || []);
      } else {
        setEditingContent('');
        setInvolvedIds([]);
      }
    }
  }, [staircaseData, selectedStep]);

  const processMentions = (text, currentIds) => {
    if (!text || !text.includes('@')) return currentIds;
    const mentions = text.match(/@([\w.-]+)/g);
    if (!mentions) return currentIds;
    const foundNames = mentions.map(m => m.substring(1).toLowerCase());
    const newlyInvolved = characters
      .filter(c => {
        const fullName = c.name.toLowerCase();
        const firstName = c.name.split(' ')[0].toLowerCase();
        return foundNames.some(mention => mention === fullName || mention === firstName);
      })
      .map(c => c.id);
    return Array.from(new Set([...currentIds, ...newlyInvolved]));
  };

  const saveCurrentStep = async () => {
    const finalIds = processMentions(editingContent, involvedIds);
    const existing = await db.staircase.where({ universeId }).first();
    let steps = existing ? JSON.parse(existing.steps) : Array(15).fill({ content: '', characterIds: [], charSummaries: {} });
    
    if (steps.length < 15) {
       steps = [...steps, ...Array(15 - steps.length).fill({ content: '', characterIds: [], charSummaries: {} })];
    }

    // Preserve summaries when saving narrative
    const currentSummaries = steps[selectedStep]?.charSummaries || {};
    steps[selectedStep] = { 
      content: editingContent, 
      characterIds: finalIds,
      charSummaries: currentSummaries 
    };

    if (existing) {
      await db.staircase.update(existing.id, { steps: JSON.stringify(steps) });
    } else {
      await db.staircase.add({ universeId, steps: JSON.stringify(steps) });
    }
  };

  const toggleCharacterInvolvement = (charId) => {
    const newIds = involvedIds.includes(charId) 
      ? involvedIds.filter(id => id !== charId)
      : [...involvedIds, charId];
    setInvolvedIds(newIds);
  };

  return (
    <div className="event-staircase" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock color="var(--accent)" /> Escritura Maestra: 15 Pasos de Snyder
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Define la narrativa general. La evolución de cada personaje se gestiona en 'Evolución'.</p>
        </div>
        <button onClick={() => setShowCastPanel(!showCastPanel)} className="glass" style={{ padding: '10px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={18} /> Elenco
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: showCastPanel ? '280px 1fr 300px' : '320px 1fr', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
        
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SNYDER_BEATS.map((beat, i) => {
            const stepData = staircaseData ? JSON.parse(staircaseData.steps || '[]')[i] : null;
            const isCompleted = stepData && stepData.content && stepData.content.length > 5;
            return (
              <button key={i} onClick={() => setSelectedStep(i)}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', textAlign: 'left',
                  background: selectedStep === i ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                  border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '12px'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isCompleted ? '#10b981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: '12px', fontWeight: selectedStep === i ? '600' : '400' }}>{beat.title}</span>
              </button>
            );
          })}
        </div>

        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', overflowY: 'auto' }}>
           <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.4rem' }}>{SNYDER_BEATS[selectedStep].title}</h3>
              <p style={{ color: 'var(--accent)', fontSize: '0.85rem' }}><Target size={14} /> Objetivo: {SNYDER_BEATS[selectedStep].objective}</p>
           </div>
           
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea 
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '12px', padding: '1rem', color: 'white', resize: 'none', fontSize: '1.1rem', lineHeight: '1.6' }}
                placeholder="Escribe el guion o narrativa general de esta etapa..."
              />
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <AtSign size={12} /> Personajes presentes: 
                 <div style={{ display: 'flex', gap: '5px' }}>
                    {involvedIds.map(id => {
                      const c = characters.find(char => char.id === id);
                      return c && <span key={id} style={{ color: 'var(--accent)' }}>@{c.name.split(' ')[0]}</span>;
                    })}
                 </div>
              </div>
           </div>

           <button onClick={saveCurrentStep} className="glass" style={{ padding: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)' }}>
              <Save size={18} /> Guardar Guion General
           </button>
        </div>

        {showCastPanel && (
          <div className="card glass" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} color="var(--accent)" /> Integrantes del Elenco</h4>
             <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {characters.map(char => (
                   <div 
                     key={char.id} 
                     className="glass" 
                     style={{ 
                       padding: '10px', 
                       borderRadius: '8px', 
                       display: 'flex', 
                       justifyContent: 'space-between', 
                       alignItems: 'center',
                       border: char.id === highlightCharId ? '1px solid var(--accent)' : '1px solid transparent',
                       background: char.id === highlightCharId ? 'rgba(var(--accent-rgb), 0.1)' : 'rgba(255,255,255,0.03)'
                     }}
                   >
                      <span style={{ fontSize: '12px', color: char.id === highlightCharId ? 'var(--accent)' : 'white', fontWeight: char.id === highlightCharId ? 'bold' : 'normal' }}>
                        {char.name}
                      </span>
                      <button onClick={() => toggleCharacterInvolvement(char.id)} style={{ background: 'transparent', border: 'none', color: involvedIds.includes(char.id) ? 'var(--accent)' : 'rgba(255,255,255,0.3)' }}>
                         <CheckCircle2 size={16} />
                      </button>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
