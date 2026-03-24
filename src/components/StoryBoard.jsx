import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../store/uiStore';
import { analyzeWithScriptDoctor } from '../services/aiService';
import { logTokenUsage } from '../db/telemetry';
import { 
  TrendingUp, Users, Save, CheckCircle2, Target, MessageSquare, 
  Sparkles, Map, Info, Activity, AlertTriangle, ThermometerSun, Brain,
  Image as ImageIcon, Type, Zap, Scale, DoorOpen, Heart, Smile, ArrowUp, 
  ShieldAlert, Skull, Moon, Key, Swords, Camera, Eye, HelpCircle, Loader2
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

        {/* Dynamic Connections with Flow Animation */}
        {nodePositions.map((pos, i) => {
          if (i === nodePositions.length - 1) return null;
          const nextPos = nodePositions[i + 1];
          const isActive = auditData[i].status !== 'PENDIENTE' && auditData[i+1].status !== 'PENDIENTE';
          
          return (
            <g key={`conn-${i}`}>
              {/* Base Line */}
              <line 
                x1={pos.x} y1={pos.y} x2={nextPos.x} y2={nextPos.y} 
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" 
              />
              
              {/* Active Glow Line */}
              {isActive && (
                <motion.line
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  x1={pos.x} y1={pos.y} x2={nextPos.x} y2={nextPos.y}
                  stroke="var(--accent)"
                  strokeWidth="2"
                  filter="url(#glow)"
                  opacity="0.6"
                />
              )}

              {/* Flow Particles (Animated Dashing) */}
              {isActive && (
                <motion.line
                  x1={pos.x} y1={pos.y} x2={nextPos.x} y2={nextPos.y}
                  stroke="white"
                  strokeWidth="1.5"
                  strokeDasharray="4, 12"
                  animate={{ strokeDashoffset: [0, -16] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  opacity="0.8"
                />
              )}
            </g>
          );
        })}
        
        {nodePositions.map((pos, i) => {
          const audit = auditData && auditData[i] ? auditData[i] : { status: 'PENDIENTE', sentiment: {} };
          const isPending = audit.status === 'PENDIENTE';
          const isGlowing = !isPending;
          const statusColor = audit.status === 'EXITOSO' ? '#10b981' : (audit.status === 'DÉBIL' ? '#f59e0b' : (audit.status === 'MUERTE' ? '#ef4444' : '#666'));
          const sentimentColor = audit.sentiment?.color || 'transparent';
          
          let IconComp = HelpCircle;
          if (audit.status === 'MUERTE') IconComp = Skull;
          else if (SNYDER_BEATS[i]?.title.includes('Imagen')) IconComp = ImageIcon; 
          else if (SNYDER_BEATS[i]?.title.includes('Tema')) IconComp = Type;
          else if (SNYDER_BEATS[i]?.title.includes('Planteamiento')) IconComp = Users;
          else if (SNYDER_BEATS[i]?.title.includes('Catalizador')) IconComp = Zap;
          else if (SNYDER_BEATS[i]?.title.includes('Debate')) IconComp = Scale;
          else if (SNYDER_BEATS[i]?.title.includes('Acto 2')) IconComp = DoorOpen;
          else if (SNYDER_BEATS[i]?.title.includes('Trama B')) IconComp = Heart;
          else if (SNYDER_BEATS[i]?.title.includes('Risas')) IconComp = Smile;
          else if (SNYDER_BEATS[i]?.title.includes('Medio')) IconComp = ArrowUp;
          else if (SNYDER_BEATS[i]?.title.includes('Cerco')) IconComp = ShieldAlert;
          else if (SNYDER_BEATS[i]?.title.includes('Perdido')) IconComp = Skull;
          else if (SNYDER_BEATS[i]?.title.includes('Alma')) IconComp = Moon;
          else if (SNYDER_BEATS[i]?.title.includes('Acto 3')) IconComp = Key;
          else if (SNYDER_BEATS[i]?.title.includes('Final')) IconComp = Swords;

          return (
            <motion.g 
              key={`node-${i}`} 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: i * 0.05 }}
              style={{ cursor: isPending ? 'default' : 'pointer' }}
              onClick={() => onNodeClick(i)}
              className="evolution-node"
            >
              {/* Sentiment Halo (Dynamic Glow) */}
              {!isPending && (
                <motion.circle
                  cx={pos.x} cy={pos.y} r="35"
                  fill="none"
                  stroke={sentimentColor}
                  strokeWidth="2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  filter="blur(8px)"
                />
              )}

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

              {/* Objective Met Badge */}
              {!isPending && (
                <g transform={`translate(${pos.x + 18}, ${pos.y - 18})`}>
                  <circle 
                    r="6" 
                    fill={audit.objectiveMet ? "#10b981" : "#f59e0b"} 
                    stroke="white" 
                    strokeWidth="1.5" 
                  />
                  <foreignObject x="-3.5" y="-3.5" width="7" height="7">
                    <div style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {audit.objectiveMet ? <CheckCircle2 size={6} strokeWidth={4} /> : <AlertTriangle size={6} strokeWidth={4} />}
                    </div>
                  </foreignObject>
                </g>
              )}

              {/* Label below */}
              <g transform={`translate(${pos.x}, ${pos.y + 35})`}>
                <text textAnchor="middle" fontSize="9" fill="white" fontWeight="bold" opacity="0.8">{SNYDER_BEATS[i].title}</text>
                <text textAnchor="middle" y="12" fontSize="7" fill={statusColor} fontWeight="bold" opacity="0.9">{audit.status}</text>
              </g>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

const ScriptDoctorAudit = ({ auditData, onNavigateToStep }) => {
  if (!auditData || auditData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
        No hay datos de auditoría disponibles. Selecciona un personaje con contenido.
      </div>
    );
  }

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
            <tr 
              key={i} 
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
              onClick={() => onNavigateToStep(i)}
            >
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
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>{row.sentiment.label}</span>
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
              {/* New Cumplimiento column */}
              <td style={{ padding: '12px' }}>
                {row.status !== 'PENDIENTE' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 'bold' }}>
                    {row.objectiveMet ? (
                      <span style={{ color: '#10b981' }}><CheckCircle2 size={12} /> CUMPLIDO</span>
                    ) : (
                      <span style={{ color: '#f59e0b' }}><AlertTriangle size={12} /> DESVIADO</span>
                    )}
                  </div>
                )}
              </td>
              <td style={{ padding: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{row.promise}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function StoryBoard({ onNavigateToStep }) {
  const { activeUniverseId: universeId } = useUiStore();
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [localSummaries, setLocalSummaries] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'doctor'
  const [analyzingBeatIndex, setAnalyzingBeatIndex] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState({});

  const characters = useLiveQuery(() => db.characters.where({ universeId }).toArray()) || [];
  const staircaseSteps = useLiveQuery(
    () => universeId ? db.staircase.where({ universeId }).sortBy('stepNumber') : [],
    [universeId]
  ) || [];

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

  const auditData = useMemo(() => {
    if (!steps || !selectedCharId) return [];
    const char = characters.find(c => c.id === selectedCharId);
    if (!char) return [];

    const charName = char.name.toLowerCase();
    
    // Keyword map for structural relevance (Snyder Objectives)
    const objectiveKeywords = {
      "Imagen Inicial": ['tono', 'mundo', 'atmósfera', 'presenta', 'rutina', 'inicio'],
      "Tema": ['tema', 'trata', 'lección', 'mensaje', 'verdad', 'aprende'],
      "Planteamiento": ['protagonista', 'carencia', 'necesita', 'statu', 'vida'],
      "Catalizador": ['cambio', 'evento', 'sucede', 'inesperado', 'llamada', 'incidente'],
      "Debate": ['duda', 'miedo', 'resiste', 'niega', 'debate', 'incertidumbre', 'teme'],
      "Paso al Acto 2": ['decisión', 'decide', 'elige', 'cruza', 'actúa', 'compromiso', 'viaje'],
      "Trama B": ['amor', 'amistad', 'subtrama', 'relación', 'aliado', 'mentor', 'sentimiento'],
      "Juegos y Risas": ['diversión', 'promesa', 'premisa', 'acción', 'entretenimiento', 'aventura'],
      "Punto Medio": ['pico', 'derrota', 'giro', 'estacas', 'sube', 'falso', 'medio'],
      "Cerco": ['presión', 'cerco', 'enemigos', 'conflicto', 'interno', 'fuerzas'],
      "Perdido": ['muere', 'derrota', 'fondo', 'fracaso', 'pérdida', 'esperanza', 'triste'],
      "Alma": ['reflexiona', 'lamenta', 'duelo', 'epifanía', 'cambio', 'interior', 'oscuro'],
      "Acto 3": ['solución', 'plan', 'lección', 'une', 'integra', 'camino', 'final'],
      "Final": ['derrota', 'clímax', 'victoria', 'resolución', 'cambio', 'vence', 'acaba'],
      "Imagen Final": ['espejo', 'nuevo', 'resolución', 'transformado', 'final', 'eco']
    };

    return SNYDER_BEATS.map((beat, i) => {
      const summary = steps[i]?.charSummaries?.[selectedCharId] || '';
      const content = steps[i]?.content || '';
      
      const isMentionedInMaster = content.toLowerCase().includes(charName) || content.toLowerCase().includes(`@${charName}`);
      const hasSpecificSummary = summary.trim().length > 3;
      const combined = (summary + content).toLowerCase();
      
      const deathKeywords = ['muere', 'muerto', 'muerta', 'muerte', 'asesinado', 'asesinada', 'fallece', 'liquida', 'eliminado', 'ejecutado'];
      const isDeadState = deathKeywords.some(key => combined.includes(key)) && (hasSpecificSummary || isMentionedInMaster);

      const intensity = Math.min(Math.floor((combined.length / 50) * 20) + (combined.includes('!') ? 20 : 0), 100);
      
      let sentiment = { icon: "🕊️", label: "Vulnerabilidad", color: "#a78bfa" }; 
      
      if (isDeadState) {
        sentiment = { icon: "💀", label: "Final de Arco", color: "#ef4444" };
      } else if (combined.includes('victoria') || combined.includes('gana') || combined.includes('logra') || combined.includes('salva') || combined.includes('tesoro')) {
        sentiment = { icon: "👑", label: "Triunfo / Éxito", color: "#fbbf24" }; 
      } else if (combined.includes('paz') || combined.includes('hogar') || combined.includes('descansa') || combined.includes('tranquilo')) {
        sentiment = { icon: "🌿", label: "Paz / Equilibrio", color: "#2dd4bf" }; 
      } else if (intensity > 70 || combined.includes('guerra') || combined.includes('caos') || combined.includes('tensión')) {
        sentiment = { icon: "🌑", label: "Caos / Tensión", color: "#f87171" }; 
      } else if (combined.includes('decide') || combined.includes('elige') || combined.includes('promesa')) {
        sentiment = { icon: "⚖️", label: "Resolución", color: "#60a5fa" }; 
      }
      
      // Objective verification
      const beatKeywords = objectiveKeywords[beat.title] || [];
      const objectiveMet = beatKeywords.some(key => combined.includes(key));

      let promise = objectiveMet ? "Objetivo estructural cumplido." : "Objetivo estructural no detectado claramente.";
      let status = "PENDIENTE";

      if (isDeadState) {
        status = "MUERTE";
        promise = "El personaje ha fallecido en este hito.";
      } else if (hasSpecificSummary) {
        status = "EXITOSO";
      } else if (isMentionedInMaster) {
        status = "DÉBIL";
      }

      return { title: beat.title, intensity, sentiment, status, promise, objectiveMet };
    });
  }, [steps, selectedCharId, characters]);

  useEffect(() => {
    if (selectedCharId && steps.length > 0) {
      const summaries = {};
      steps.forEach((step, i) => { summaries[i] = step.charSummaries?.[selectedCharId] || ''; });
      setLocalSummaries(summaries);
    }
  }, [selectedCharId, steps]);

  const saveEvolution = async () => {
    if (!selectedCharId || !steps) return;
    setIsSaving(true);
    
    const promises = steps.map(step => {
      const record = {
        ...step,
        universeId,
        charSummaries: { ...(step.charSummaries || {}), [selectedCharId]: localSummaries[step.stepNumber] || '' }
      };
      if (record.id) {
        return db.staircase.update(record.id, record);
      } else {
        return db.staircase.add(record);
      }
    });
    
    await Promise.all(promises);
    setIsSaving(false);
  };

  const handleSmartSync = () => {
    if (!selectedCharId || !steps) return;
    const selectedChar = characters.find(c => c.id === selectedCharId);
    if (!selectedChar) return;
    
    const charName = selectedChar.name.toLowerCase();
    const newSummaries = { ...localSummaries };
    
    steps.forEach((step, i) => {
      const content = step.content || '';
      // Split into sentences 
      const sentences = content.split(/([.!?]\s+)/).filter(Boolean);
      
      const relevantSentences = [];
      for (let j = 0; j < sentences.length; j++) {
        const s = sentences[j];
        if (s.toLowerCase().includes(charName) || s.toLowerCase().includes(`@${charName}`)) {
          relevantSentences.push(s.trim());
        }
      }
      
      if (relevantSentences.length > 0) {
        const extracted = relevantSentences.join(' ');
        // If local summary is empty or doesn't include the extracted text, append or set
        if (!newSummaries[i] || !newSummaries[i].includes(extracted)) {
          newSummaries[i] = newSummaries[i] ? `${newSummaries[i]}\n${extracted}` : extracted;
        }
      }
    });
    
    setLocalSummaries(newSummaries);
  };

  const handleScriptDoctor = async (index) => {
    const beat = SNYDER_BEATS[index];
    const content = localSummaries[index] || '';
    if (!content.trim()) {
      alert("Por favor, escribe un resumen para este hito antes de analizarlo.");
      return;
    }
    const settings = await db.settings.toCollection().first();
    if (!settings || !settings.apiKey) {
      alert("⚠️ No conectado a la IA.\n\nPor favor, configura tu API Key en el Portal de IA (botón en la parte inferior izquierda).");
      return;
    }

    setAnalyzingBeatIndex(index);
    try {
      const result = await analyzeWithScriptDoctor(beat.title, content, universeId, beat.objective);
      setAiSuggestions(prev => ({ ...prev, [index]: result.analysis || result.text }));
      await logTokenUsage('Script Doctor', result.promptTokens, result.completionTokens, `Auditoría: ${beat.title}`);
    } catch (error) {
      setAiSuggestions(prev => ({ ...prev, [index]: { error: true, feedback: `Error: ${error.message}` } }));
      console.error(error);
    } finally {
      setAnalyzingBeatIndex(null);
    }
  };

  const selectedChar = characters.find(c => c.id === selectedCharId);

  return (
    <div className="story-board-evolution" style={{ height: '100%', display: 'flex', flexDirection: 'column', color: 'white' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity color="var(--accent)" /> Evolución: {selectedChar ? selectedChar.name : 'Tablero Maestro'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Mapa estratégico de arcos narrativos con Auditoría Script Doctor AI.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           {selectedCharId && (
             <>
               <button 
                 onClick={handleSmartSync}
                 className="glass" 
                 style={{ padding: '10px 15px', color: 'var(--accent)', borderColor: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                 title="Extraer historias de la Escritura Maestra"
               >
                  <Sparkles size={18} /> Sincronización Inteligente
               </button>
               <button 
                 onClick={() => setViewMode(viewMode === 'canvas' ? 'doctor' : 'canvas')} 
                 className="glass" 
                 style={{ 
                   padding: '10px 25px', 
                   minWidth: '200px',
                   color: 'white', 
                   borderColor: viewMode === 'doctor' ? 'var(--accent)' : 'var(--glass-border)',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '10px',
                   cursor: 'pointer'
                 }}
               >
                  {viewMode === 'canvas' ? <Brain size={18} /> : <Map size={18} />} 
                  {viewMode === 'canvas' ? 'Modo Script Doctor' : 'Ver Mapa Visual'}
               </button>
               <button onClick={saveEvolution} disabled={isSaving} className="glass" style={{ padding: '10px 25px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px', justifyContent: 'center', cursor: 'pointer' }}>
                  <Save size={18} /> Actualizar
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
                <button key={char.id} onClick={() => setSelectedCharId(char.id)} style={{ padding: '12px', borderRadius: '12px', background: selectedCharId === char.id ? 'var(--accent)' : 'rgba(255,255,255,0.03)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
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
                    <EvolutionCanvas auditData={auditData} onNodeClick={(idx) => onNavigateToStep(idx, selectedCharId)} />
                 ) : (
                    <ScriptDoctorAudit auditData={auditData} onNavigateToStep={(idx) => onNavigateToStep(idx, selectedCharId)} />
                 )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   {SNYDER_BEATS.map((beat, i) => (
                     <div key={i} id={`editor-${i}`} className="glass" style={{ padding: '1.2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', background: analyzingBeatIndex === i ? 'rgba(124, 58, 237, 0.05)' : 'rgba(0,0,0,0.1)' }}>
                         <div 
                           style={{ 
                             display: 'flex', 
                             justifyContent: 'space-between', 
                             marginBottom: '1rem', 
                             padding: '4px',
                             borderRadius: '8px'
                           }}
                         >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                               <beat.icon size={18} color="var(--accent)" />
                               <h4 style={{ fontSize: '1.1rem' }}>{i + 1}. {beat.title}</h4>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                               <span style={{ fontSize: '10px', opacity: 0.4 }}>{beat.objective}</span>
                               <button 
                                 onClick={() => handleScriptDoctor(i)}
                                 disabled={analyzingBeatIndex !== null}
                                 className="glass"
                                 style={{ 
                                   padding: '4px 10px', 
                                   fontSize: '10px', 
                                   background: 'rgba(124, 58, 237, 0.1)', 
                                   border: '1px solid var(--accent)', 
                                   borderRadius: '6px',
                                   color: 'white',
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '5px',
                                   cursor: analyzingBeatIndex !== null ? 'not-allowed' : 'pointer'
                                 }}
                               >
                                 {analyzingBeatIndex === i ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                 {analyzingBeatIndex === i ? 'Analizando...' : 'Script Doctor AI'}
                               </button>
                            </div>
                         </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <textarea 
                            value={localSummaries[i] || ''} onChange={(e) => setLocalSummaries({...localSummaries, [i]: e.target.value})}
                            placeholder="Resume la evolución en este hito..."
                            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '10px', color: 'white', padding: '12px', fontSize: '13px', minHeight: '140px', resize: 'none', border: '1px solid rgba(255,255,255,0.05)' }}
                          />
                          
                          {/* AI Recommendations Internal Canvas */}
                          <div 
                            className="ai-recommendation-canvas"
                            style={{ 
                              background: 'rgba(0,0,0,0.25)', 
                              borderRadius: '12px', 
                              border: '1px solid rgba(124, 58, 237, 0.2)',
                              padding: '12px',
                              minHeight: '140px',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <AnimatePresence mode="wait">
                              {aiSuggestions[i] ? (
                                <motion.div 
                                  key={`ai-content-${i}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>
                                      <Brain size={14} /> Dashboard de Auditoría
                                    </div>
                                    {aiSuggestions[i].score !== undefined && (
                                      <div style={{ padding: '2px 8px', background: 'var(--accent)', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>
                                        {aiSuggestions[i].score}% MATCH
                                      </div>
                                    )}
                                  </div>

                                  {aiSuggestions[i].score !== undefined && (
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${aiSuggestions[i].score}%` }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), #a78bfa)' }}
                                      />
                                    </div>
                                  )}

                                  <div style={{ marginBottom: '10px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                                    <p style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '10px', marginBottom: '4px' }}>ANÁLISIS:</p>
                                    <p style={{ lineHeight: '1.4', opacity: 0.9, fontSize: '11px' }}>{aiSuggestions[i].feedback || (typeof aiSuggestions[i] === 'string' ? aiSuggestions[i] : '')}</p>
                                    
                                    {aiSuggestions[i].suggestions && (
                                      <div style={{ marginTop: '10px' }}>
                                        <p style={{ fontWeight: 'bold', color: '#10b981', fontSize: '10px', marginBottom: '4px' }}>OPCIONES DE MEJORA:</p>
                                        <p style={{ lineHeight: '1.4', fontStyle: 'italic', opacity: 0.8, fontSize: '11px' }}>{aiSuggestions[i].suggestions}</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ) : (
                                <motion.div 
                                  key={`ai-empty-${i}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 0.3 }}
                                  style={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    fontSize: '11px'
                                  }}
                                >
                                  <Sparkles size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                  <p>Esperando auditoría del Script Doctor...</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            {/* Decorative background grid for the "Canvas" feel */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(rgba(124, 58, 237, 0.05) 1px, transparent 1px)', backgroundSize: '15px 15px', pointerEvents: 'none', zIndex: 0 }} />
                          </div>
                        </div>
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
