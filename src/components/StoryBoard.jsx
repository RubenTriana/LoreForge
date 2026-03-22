import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, Save, CheckCircle2, Target, MessageSquare, 
  Sparkles, Map, Info, Activity, AlertTriangle, ThermometerSun, Brain,
  Image as ImageIcon, Type, Zap, Scale, DoorOpen, Heart, Smile, ArrowUp, 
  ShieldAlert, Skull, Moon, Key, Swords, Camera, Eye
} from 'lucide-react';

const SNYDER_BEATS = [
  { title: "Imagen Inicial", objective: "Establecer el tono y el mundo antes del cambio.", icon: ImageIcon },
  { title: "Declaración del Tema", objective: "Indicar sutilmente de qué trata realmente la historia.", icon: Type },
  { title: "Planteamiento", objective: "Presentar a los personajes y sus carencias.", icon: Users },
  { title: "Catalizador", objective: "El evento que cambia la vida del protagonista.", icon: Zap },
  { title: "Debate", objective: "El protagonista duda o se resiste al cambio.", icon: Scale },
  { title: "Paso al Acto 2", objective: "El héroe toma la decisión consciente de actuar.", icon: DoorOpen },
  { title: "Trama B", objective: "Relación secundaria que refuerza el tema.", icon: Heart },
  { title: "Juegos y Risas", objective: "Cumplir la 'promesa de la premisa'.", icon: Smile },
  { title: "Punto Medio", objective: "Un pico de éxito falso o una derrota aparente.", icon: ArrowUp },
  { title: "Los Malos Cierran el Cerco", objective: "Los problemas internos y externos se complican.", icon: ShieldAlert },
  { title: "Todo Está Perdido", objective: "El protagonista toca fondo; alguien suele morir.", icon: Skull },
  { title: "La Noche Oscura del Alma", objective: "El héroe reflexiona sobre su fracaso.", icon: Moon },
  { title: "Paso al Acto 3", objective: "Se encuentra la solución combinando las lecciones.", icon: Key },
  { title: "Final", objective: "El protagonista derrota al antagonista y cambia el mundo.", icon: Swords },
  { title: "Imagen Final", objective: "El espejo de la imagen inicial, mostrando el cambio.", icon: Camera }
];

/**
 * EvolutionCanvas: Visualizes the 15 steps as glass buttons with icons and status colors
 */
const EvolutionCanvas = ({ steps, selectedCharId, onNodeClick, auditData }) => {
  const nodePositions = useMemo(() => {
    const pos = [];
    const width = 900;
    const height = 450;
    const padding = 60;
    for (let i = 0; i < 15; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const x = padding + (col * (width - padding * 2) / 4);
      const y = padding + (row * (height - padding * 2) / 2);
      const actualX = row % 2 === 0 ? x : (width - x);
      pos.push({ x: actualX, y });
    }
    return pos;
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '450px', background: 'rgba(0,0,0,0.1)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)', marginBottom: '2rem' }}>
      <svg width="100%" height="100%" viewBox="0 0 900 450" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Dynamic Connections */}
        <path
          d={nodePositions.reduce((acc, pos, i) => i === 0 ? `M ${pos.x} ${pos.y}` : `${acc} L ${pos.x} ${pos.y}`, "")}
          fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="8,6" opacity="0.15"
        />
        
        {nodePositions.map((pos, i) => {
          const audit = auditData[i];
          const IconComp = SNYDER_BEATS[i].icon;
          const statusColor = audit.status === 'EXITOSO' ? '#10b981' : (audit.status === 'DÉBIL' ? '#f59e0b' : '#444');
          const isGlowing = audit.status !== 'PENDIENTE';

          return (
            <g key={i} cursor="pointer" onClick={() => onNodeClick(i)} className="evolution-node">
              {/* Glass Button Base */}
              <rect 
                x={pos.x - 22} y={pos.y - 22} width="44" height="44" rx="12"
                fill="rgba(20,20,20,0.7)" 
                stroke={statusColor} 
                strokeWidth={isGlowing ? "2" : "1"}
                filter={isGlowing ? "url(#glow)" : ""}
                style={{ transition: 'all 0.3s ease' }}
              />
              
              {/* Icon Overlay (ForeignObject for React components in SVG) */}
              <foreignObject x={pos.x - 11} y={pos.y - 11} width="22" height="22">
                <IconComp size={22} color={isGlowing ? statusColor : "#666"} strokeWidth={2.5} />
              </foreignObject>

              {/* Label below */}
              <g transform={`translate(${pos.x}, ${pos.y + 35})`}>
                <text textAnchor="middle" fontSize="9" fill="white" fontWeight="bold" opacity="0.8">{SNYDER_BEATS[i].title}</text>
                <text textAnchor="middle" y="12" fontSize="7" fill={statusColor} fontWeight="bold" opacity="0.9">{audit.status}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const ScriptDoctorAudit = ({ auditData }) => {
  return (
    <div className="script-doctor-table" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--glass-border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '12px' }}>Etapa</th>
            <th style={{ padding: '12px' }}>Intensidad</th>
            <th style={{ padding: '12px' }}>Sentimiento</th>
            <th style={{ padding: '12px' }}>Hito</th>
            <th style={{ padding: '12px' }}>Estado 'Promesa'</th>
          </tr>
        </thead>
        <tbody>
          {auditData.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{i + 1}. {row.title}</td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${row.intensity}%`, height: '100%', background: row.intensity > 70 ? '#ef4444' : 'var(--accent)', transition: 'width 0.5s' }} />
                   </div>
                   <span style={{ fontSize: '10px', opacity: 0.7 }}>{row.intensity}%</span>
                </div>
              </td>
              <td style={{ padding: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{row.sentiment.icon}</span>
                    <span style={{ fontSize: '11px opacity: 0.8' }}>{row.sentiment.label}</span>
                 </div>
              </td>
              <td style={{ padding: '12px' }}>
                 <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '5px', 
                    color: row.status === 'EXITOSO' ? '#10b981' : (row.status === 'DÉBIL' ? '#f59e0b' : '#666'),
                    fontWeight: 'bold', fontSize: '11px'
                 }}>
                    {row.status === 'EXITOSO' ? <CheckCircle2 size={12} /> : (row.status === 'DÉBIL' ? <AlertTriangle size={12} /> : null)}
                    {row.status}
                 </div>
              </td>
              <td style={{ padding: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{row.promise}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function StoryBoard({ universeId }) {
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [localSummaries, setLocalSummaries] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'doctor'

  const characters = useLiveQuery(() => db.characters.where({ universeId }).toArray()) || [];
  const staircaseData = useLiveQuery(() => db.staircase.where({ universeId }).first(), [universeId]);

  const steps = useMemo(() => {
    return staircaseData ? JSON.parse(staircaseData.steps || '[]') : Array(15).fill({ content: '', characterIds: [], charSummaries: {} });
  }, [staircaseData]);

  const auditData = useMemo(() => {
    return SNYDER_BEATS.map((beat, i) => {
      const summary = steps[i]?.charSummaries?.[selectedCharId] || '';
      const content = steps[i]?.content || '';
      const combined = (summary + content).toLowerCase();
      const intensity = Math.min(Math.floor((combined.length / 50) * 20) + (combined.includes('!') ? 20 : 0), 100);
      const isFulfilled = summary.length > 5;
      let sentiment = { icon: "🕊️", label: "Vulnerabilidad" };
      if (intensity > 70) sentiment = { icon: "🌑", label: "Caos / Tensión" };
      else if (combined.includes('decide')) sentiment = { icon: "⚖️", label: "Resolución" };
      let promise = "Narrativa pendiente.";
      if (isFulfilled) promise = "Coherente con el arco.";
      return { title: beat.title, intensity, sentiment, status: isFulfilled ? "EXITOSO" : (content.length > 5 ? "DÉBIL" : "PENDIENTE"), promise };
    });
  }, [steps, selectedCharId]);

  useEffect(() => {
    if (selectedCharId && steps.length > 0) {
      const summaries = {};
      steps.forEach((step, i) => { summaries[i] = step.charSummaries?.[selectedCharId] || ''; });
      setLocalSummaries(summaries);
    }
  }, [selectedCharId, steps]);

  const saveEvolution = async () => {
    if (!selectedCharId || !staircaseData) return;
    setIsSaving(true);
    const updatedSteps = steps.map((step, i) => ({
      ...step,
      charSummaries: { ...(step.charSummaries || {}), [selectedCharId]: localSummaries[i] || '' }
    }));
    await db.staircase.update(staircaseData.id, { steps: JSON.stringify(updatedSteps) });
    setIsSaving(false);
  };

  const selectedChar = characters.find(c => c.id === selectedCharId);

  return (
    <div className="story-board-evolution" style={{ height: '100%', display: 'flex', flexDirection: 'column', color: 'white' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity color="var(--accent)" /> Evolución: {selectedChar ? selectedChar.name : 'Tablero Maestro'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Mapa estratégico de arcos narrativos con Auditoría Script Doctor.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           {selectedCharId && (
             <>
               <button onClick={() => setViewMode(viewMode === 'canvas' ? 'doctor' : 'canvas')} className="glass" style={{ padding: '10px 15px', color: 'white', borderColor: viewMode === 'doctor' ? 'var(--accent)' : 'var(--glass-border)' }}>
                  {viewMode === 'canvas' ? <Brain size={18} /> : <Map size={18} />} 
                  {viewMode === 'canvas' ? 'Modo Script Doctor' : 'Ver Mapa Visual'}
               </button>
               <button onClick={saveEvolution} disabled={isSaving} className="glass" style={{ padding: '10px 20px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px' }}>
                  <Save size={18} /> Sincronizar
               </button>
             </>
           )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
        <div className="card glass" style={{ padding: '1rem', overflowY: 'auto' }}>
           <h3 style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '1rem' }}>ELENCO</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {characters.map(char => (
                <button key={char.id} onClick={() => setSelectedCharId(char.id)} style={{ padding: '12px', borderRadius: '12px', background: selectedCharId === char.id ? 'var(--accent)' : 'rgba(255,255,255,0.03)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: `url(${char.imageUrl})`, backgroundSize: 'cover' }} />
                  <span style={{ fontSize: '13px' }}>{char.name}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="card glass" style={{ overflowY: 'auto', padding: '1.5rem' }}>
           {!selectedChar ? (
             <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <Activity size={64} />
                <p style={{ marginTop: '1rem' }}>Selecciona un personaje para visualizar su evolución.</p>
             </div>
           ) : (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {viewMode === 'canvas' ? (
                   <EvolutionCanvas steps={steps} selectedCharId={selectedCharId} auditData={auditData} onNodeClick={(idx) => document.getElementById(`editor-${idx}`).scrollIntoView({ behavior: 'smooth' })} />
                ) : (
                   <ScriptDoctorAudit auditData={auditData} />
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   {SNYDER_BEATS.map((beat, i) => (
                     <div key={i} id={`editor-${i}`} className="glass" style={{ padding: '1.2rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <beat.icon size={18} color="var(--accent)" />
                              <h4 style={{ fontSize: '1.1rem' }}>{i + 1}. {beat.title}</h4>
                           </div>
                           <span style={{ fontSize: '10px', opacity: 0.4 }}>{beat.objective}</span>
                        </div>
                        <textarea 
                          value={localSummaries[i] || ''} onChange={(e) => setLocalSummaries({...localSummaries, [i]: e.target.value})}
                          placeholder="Resume la evolución en este hito..."
                          style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '10px', color: 'white', padding: '12px', fontSize: '13px', minHeight: '80px', resize: 'none' }}
                        />
                     </div>
                   ))}
                </div>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}
