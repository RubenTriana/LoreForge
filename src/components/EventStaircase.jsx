import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUiStore } from '../store/uiStore';
import { 
  ChevronRight, Save, User as UserIcon, Type, Target, Clock, 
  CheckCircle2, Info, Plus, X, Users, AtSign, MapPin, Swords
} from 'lucide-react';
import { motion } from 'framer-motion';

const SNYDER_BEATS = [
  { title: "Imagen Inicial", objective: "Establecer el tono y el mundo antes del cambio.", pages: "1–2" },
  { title: "Declaración del Tema", objective: "Indicar sutilmente de qué trata realmente la historia (lección moral).", pages: "5–6" },
  { title: "Planteamiento", objective: "Presentar a los personajes y sus carencias.", pages: "1–20" },
  { title: "Catalizador", objective: "El evento que cambia la vida del protagonista.", pages: "12–14" },
  { title: "Debate", objective: "El protagonista duda o se resiste al cambio.", pages: "12–50" },
  { title: "Paso al Acto 2", objective: "El héroe toma la decisión consciente de actuar.", pages: "25–26" },
  { title: "Trama B", objective: "Relación secundaria que refuerza el tema (romance o amistad).", pages: "30–32" },
  { title: "Juegos y Risas", objective: "Cumplir la 'promesa de la premisa' (lo divertido o emocionante).", pages: "30–110" },
  { title: "Punto Medio", objective: "Un pico de éxito falso o una derrota aparente.", pages: "55–60" },
  { title: "Los Malos Cierran el Cerco", objective: "Los problemas internos y externos se complican.", pages: "55–150" },
  { title: "Todo Está Perdido", objective: "El protagonista toca fondo; alguien suele morir.", pages: "75–76" },
  { title: "La Noche Oscura del Alma", objective: "El héroe reflexiona sobre su fracaso.", pages: "75–170" },
  { title: "Paso al Acto 3", objective: "Se encuentra la solución combinando las lecciones de A y B.", pages: "85–86" },
  { title: "Final", objective: "El protagonista derrota al antagonista y cambia el mundo.", pages: "85–220" },
  { title: "Imagen Final", objective: "El espejo de la imagen inicial, mostrando el cambio total.", pages: "220" }
];

export default function EventStaircase({ initialStep = 0, highlightCharId = null }) {
  const { activeUniverseId: universeId } = useUiStore();
  const [selectedStep, setSelectedStep] = useState(initialStep);
  const [editingContent, setEditingContent] = useState("");
  const [involvedIds, setInvolvedIds] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [showCastPanel, setShowCastPanel] = useState(false);
  const [newCharName, setNewCharName] = useState("");

  const characters = useLiveQuery(
    () => universeId ? db.characters.where('universeId').equals(Number(universeId)).toArray() : [], 
    [universeId]
  ) || [];
  const locations = useLiveQuery(
    () => universeId ? db.locations.where('universeId').equals(Number(universeId)).toArray() : [], 
    [universeId]
  ) || [];
  
  const staircaseSteps = useLiveQuery(
    () => universeId ? db.staircase.where({ universeId }).sortBy('stepNumber') : [],
    [universeId]
  ) || [];

  // Map database records to a stable 15-step local array
  const steps = useMemo(() => {
    const arr = Array(15).fill(null).map((_, i) => ({
      stepNumber: i,
      title: SNYDER_BEATS[i].title,
      content: '',
      characterIds: [],
      locationId: null,
      charSummaries: {}
    }));
    
    staircaseSteps.forEach(s => {
      if (s.stepNumber >= 0 && s.stepNumber < 15) {
        arr[s.stepNumber] = { ...arr[s.stepNumber], ...s };
      }
    });
    return arr;
  }, [staircaseSteps]);

  useEffect(() => {
    setSelectedStep(initialStep);
    if (highlightCharId) {
      setShowCastPanel(true);
    }
  }, [initialStep, highlightCharId]);

  useEffect(() => {
    const currentStepData = steps[selectedStep];
    if (currentStepData) {
      setEditingContent(currentStepData.content || '');
      setInvolvedIds(currentStepData.characterIds || []);
      setSelectedLocationId(currentStepData.locationId || null);
    }
  }, [steps, selectedStep]);

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
    const currentStepData = steps[selectedStep];
    
    const record = {
      ...currentStepData,
      universeId,
      stepNumber: selectedStep,
      title: SNYDER_BEATS[selectedStep].title,
      content: editingContent,
      characterIds: finalIds,
      locationId: selectedLocationId
    };

    if (currentStepData.id) {
      await db.staircase.update(currentStepData.id, record);
    } else {
      await db.staircase.add(record);
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
            const stepData = steps[i];
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
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: selectedStep === i ? '600' : '400' }}>{beat.title}</span>
                  <span style={{ fontSize: '10px', opacity: 0.5, fontStyle: 'italic' }}>p. {beat.pages}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', overflowY: 'auto' }}>
           <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.4rem' }}>{SNYDER_BEATS[selectedStep].title}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <p style={{ color: 'var(--accent)', fontSize: '0.85rem' }}><Target size={14} /> Objetivo: {SNYDER_BEATS[selectedStep].objective}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', opacity: 0.8 }}><Clock size={14} /> Páginas Sugeridas: {SNYDER_BEATS[selectedStep].pages}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <MapPin size={14} color="var(--accent)" />
                  <select 
                    value={selectedLocationId || ''} 
                    onChange={(e) => setSelectedLocationId(Number(e.target.value) || null)}
                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="" style={{ background: '#1a1a2e', color: 'white' }}>Sin localización</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id} style={{ background: '#1a1a2e', color: 'white' }}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
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
              <Swords size={18} /> Guardar Guion General
           </button>
        </div>

        {showCastPanel && (
          <div className="card glass" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} color="var(--accent)" /> Integrantes del Elenco</h4>
             <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {characters.map(char => (
                   <div 
                     key={char.id} 
                     className="glass"                      style={{ 
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
