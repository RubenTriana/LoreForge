import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wifi, WifiOff, Activity } from 'lucide-react';

export default function AiStatusMonitor() {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const tokenLogs = useLiveQuery(() => db.token_logs.toArray()) || [];

  const isConnected = !!(settings?.apiKey);
  
  const totalTokens = useMemo(() => {
    return tokenLogs.reduce((acc, log) => acc + (log.promptTokens || 0) + (log.completionTokens || 0), 0);
  }, [tokenLogs]);

  // Max scale for the "Power Bar" - e.g., 50k tokens as a benchmark for the bar full
  const maxTokens = 50000;
  const progress = Math.min((totalTokens / maxTokens) * 100, 100);

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '1.5rem',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <div 
        className="glass" 
        style={{
          padding: '10px 16px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '180px',
          pointerEvents: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          border: '1px solid var(--glass-border)',
          background: 'rgba(15, 15, 20, 0.8)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              {isConnected ? (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      top: -4, left: -4, right: -4, bottom: -4,
                      borderRadius: '50%',
                      background: '#10b981',
                      filter: 'blur(4px)'
                    }}
                  />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', position: 'relative', boxShadow: '0 0 10px #10b981' }} />
                </>
              ) : (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#666', position: 'relative' }} />
              )}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', color: isConnected ? 'white' : '#666' }}>
              {isConnected ? 'IA ONLINE' : 'IA OFFLINE'}
            </span>
          </div>
          {isConnected ? <Wifi size={12} color="#10b981" /> : <WifiOff size={12} color="#666" />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
              <Zap size={10} fill="var(--accent)" />
              <span style={{ fontSize: '9px', fontWeight: 'bold' }}>COGNICIÓN</span>
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', opacity: 0.8 }}>{totalTokens.toLocaleString()} tkn</span>
          </div>
          
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent), #a78bfa)',
                boxShadow: '0 0 10px var(--accent)'
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
