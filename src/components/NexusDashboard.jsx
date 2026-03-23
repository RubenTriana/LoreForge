import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, DollarSign, Activity, Filter, Calendar, History, ArrowUpRight, Search } from 'lucide-react';

export default function NexusDashboard({ universeId }) {
  const [filterModule, setFilterModule] = useState('All');
  const [selectedLogDate, setSelectedLogDate] = useState(null);
  const [hoveredData, setHoveredData] = useState(null);

  const logs = useLiveQuery(() => db.token_logs.toArray()) || [];

  // Filter and aggregation logic
  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (filterModule !== 'All') {
      result = result.filter(log => log.module === filterModule);
    }
    return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs, filterModule]);

  const chartData = useMemo(() => {
    const groups = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = { date, tokens: 0, cost: 0, items: [] };
      groups[date].tokens += (log.promptTokens + log.completionTokens);
      groups[date].cost += log.cost;
      groups[date].items.push(log);
    });
    return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [logs]);

  const stats = useMemo(() => {
    const totalTokens = logs.reduce((sum, log) => sum + (log.promptTokens + log.completionTokens), 0);
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const avgCostPerCall = logs.length > 0 ? totalCost / logs.length : 0;
    return { totalTokens, totalCost, avgCostPerCall };
  }, [logs]);

  // Handle Chart Click for drill-down
  const handleChartClick = (data) => {
    if (data && data.activePayload) {
      setSelectedLogDate(data.activeLabel);
    }
  };

  const drillDownLogs = useMemo(() => {
    if (!selectedLogDate) return filteredLogs.slice(0, 10);
    return logs.filter(log => new Date(log.timestamp).toLocaleDateString() === selectedLogDate);
  }, [logs, selectedLogDate, filteredLogs]);

  return (
    <div className="nexus-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          icon={<Cpu color="var(--accent)" />} 
          label="Tokens Consumidos" 
          value={stats.totalTokens.toLocaleString()} 
          subValue="Total histórico"
        />
        <StatCard 
          icon={<DollarSign color="#10b981" />} 
          label="Costo Estimado" 
          value={`$${stats.totalCost.toFixed(4)}`} 
          subValue="USD (Precios API)"
        />
        <StatCard 
          icon={<Activity color="#f59e0b" />} 
          label="Llamadas IA" 
          value={logs.length} 
          subValue="Interacciones totales"
        />
        <StatCard 
          icon={<ArrowUpRight color="#3b82f6" />} 
          label="Promedio / Llamada" 
          value={`$${stats.avgCostPerCall.toFixed(5)}`} 
          subValue="Eficiencia de tokens"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Main Chart Area */}
        <motion.div 
          className="card glass" 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '2rem', borderRadius: '24px', minHeight: '450px', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>Flujo de Telemetría</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitoreo de picos de consumo por día</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                value={filterModule} 
                onChange={e => setFilterModule(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem' }}
              >
                <option value="All">Todos los Módulos</option>
                <option value="Personajes">Población</option>
                <option value="Lore">Lore</option>
                <option value="Escribanía">Escribanía</option>
                <option value="Análisis">Análisis</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="var(--accent)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTokens)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Activity size={14} /> Haz clic en un pico para ver el desglose detallado.
          </div>
        </motion.div>

        {/* Side Log / Breakdown */}
        <motion.div 
          className="card glass"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ padding: '1.5rem', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="var(--accent)" /> 
              {selectedLogDate ? `Logs: ${selectedLogDate}` : 'Actividad Reciente'}
            </h3>
            {selectedLogDate && (
              <button 
                onClick={() => setSelectedLogDate(null)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Limpiar
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '450px', paddingRight: '5px' }}>
            {drillDownLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No hay registros de telemetría aún.
              </div>
            ) : (
              drillDownLogs.map((log, idx) => (
                <LogItem key={log.id || idx} log={log} />
              ))
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}

// Sub-components for cleaner code
function StatCard({ icon, label, value, subValue }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="card glass" 
      style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--glass-border)', display: 'flex', gap: '1.2rem', alignItems: 'center' }}
    >
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
        <h4 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{value}</h4>
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{subValue}</p>
      </div>
    </motion.div>
  );
}

function LogItem({ log }) {
  const getModuleColor = (mod) => {
    switch (mod) {
      case 'Personajes': return '#7c3aed';
      case 'Lore': return '#3b82f6';
      case 'Escribanía': return '#10b981';
      default: return '#f59e0b';
    }
  };

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      padding: '12px', 
      borderRadius: '12px', 
      borderLeft: `3px solid ${getModuleColor(log.module)}`,
      fontSize: '0.85rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontWeight: 'bold' }}>{log.action}</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
        <span>{log.module}</span>
        <span style={{ color: '#10b981', fontWeight: '600' }}>${log.cost.toFixed(4)}</span>
      </div>
      <div style={{ marginTop: '5px', fontSize: '0.75rem', opacity: 0.6 }}>
        {log.promptTokens + log.completionTokens} tokens (P:{log.promptTokens} / C:{log.completionTokens})
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass" style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>{label}</p>
        <p style={{ color: 'var(--accent)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Cpu size={14} /> Tokens: {payload[0].value.toLocaleString()}
        </p>
        <p style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
          <DollarSign size={14} /> Costo: ${payload[0].payload.cost.toFixed(4)}
        </p>
      </div>
    );
  }
  return null;
};
