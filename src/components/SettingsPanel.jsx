import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUiStore } from '../store/uiStore';
import { 
  X, Save, Zap, Key, Sliders, Shield, 
  Cpu, MessageSquare, Info, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { testAiConnection } from '../services/aiService';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SettingsPanel() {
  const { isSettingsModalOpen, setSettingsModalOpen } = useUiStore();
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const [localSettings, setLocalSettings] = useState({
    provider: 'openai',
    apiKey: '',
    temperature: 0.7,
    systemRole: ''
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  if (!isSettingsModalOpen) return null;

  const [testStatus, setTestStatus] = useState({ type: '', message: '' });
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async () => {
    const id = settings?.id;
    if (id) {
      await db.settings.update(id, localSettings);
    } else {
      await db.settings.add(localSettings);
    }
    setSettingsModalOpen(false);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus({ type: '', message: '' });
    try {
      await testAiConnection();
      setTestStatus({ type: 'success', message: '¡Conexión exitosa!' });
    } catch (error) {
      setTestStatus({ type: 'error', message: error.message || 'Error de conexión.' });
    } finally {
      setIsTesting(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setSettingsModalOpen(false)}
      >
        <motion.div 
          className="settings-modal glass"
          variants={modalVariants}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '600px',
            background: 'rgba(20, 20, 40, 0.95)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                <Zap size={24} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Portal de IA</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Configura el cerebro de tu universo.</p>
              </div>
            </div>
            <button 
              onClick={() => setSettingsModalOpen(false)}
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Provider Section */}
            <div className="settings-section">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                <Cpu size={16} color="var(--accent)" /> PROVEEDOR DE INTELIGENCIA
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {['openai', 'anthropic', 'gemini'].map(p => (
                  <button
                    key={p}
                    onClick={() => setLocalSettings({...localSettings, provider: p})}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: localSettings.provider === p ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid',
                      borderColor: localSettings.provider === p ? 'transparent' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      textTransform: 'capitalize',
                      fontWeight: localSettings.provider === p ? 'bold' : 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : 'Google Gemini'}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key Section */}
            <div className="settings-section">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                <Key size={16} color="var(--accent)" /> LLAVE DE API (SECRET KEY)
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                    type="password"
                    value={localSettings.apiKey || ''}
                    onChange={(e) => setLocalSettings({...localSettings, apiKey: e.target.value})}
                    placeholder="sk-..."
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                  <Shield size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !localSettings.apiKey}
                  style={{
                    padding: '0 20px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '0.85rem',
                    cursor: (isTesting || !localSettings.apiKey) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  Verificar
                </button>
              </div>
              
              {testStatus.message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ 
                    marginTop: '10px', 
                    fontSize: '0.8rem', 
                    color: testStatus.type === 'success' ? '#10b981' : '#f43f5e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {testStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  {testStatus.message}
                </motion.div>
              )}
            </div>

            {/* Temperature Slider */}
            <div className="settings-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <Sliders size={16} color="var(--accent)" /> TEMPERATURA (CREATIVIDAD)
                </label>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent)' }}>{localSettings.temperature}</span>
              </div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localSettings.temperature || 0.7}
                onChange={(e) => setLocalSettings({...localSettings, temperature: parseFloat(e.target.value)})}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent)',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem', opacity: 0.5 }}>
                <span>Preciso</span>
                <span>Creativo</span>
              </div>
            </div>

            {/* Narrative Style */}
            <div className="settings-section">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                <MessageSquare size={16} color="var(--accent)" /> ESTILO NARRATIVO GLOBAL
              </label>
              <textarea 
                value={localSettings.systemRole || ''}
                onChange={(e) => setLocalSettings({...localSettings, systemRole: e.target.value})}
                placeholder="Ej: 'Usa un tono épico y solemne. Evita clichés de fantasía moderna y enfócate en la intriga política...'"
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: '1.5'
                }}
              />
            </div>

          </div>

          {/* Footer Action */}
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
            <button 
              onClick={handleSave}
              className="glass"
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                background: 'var(--accent)',
                color: 'white',
                fontWeight: 'bold',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={18} /> Guardar Configuración
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
