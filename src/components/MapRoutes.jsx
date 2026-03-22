import React, { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Map as MapIcon, Navigation, Trash2, Plus, Info, 
  Image as ImageIcon, Upload, MousePointer2, Settings2,
  Circle, Square, Diamond, Star, Triangle, Move
} from 'lucide-react';

const NODE_TYPES = {
  city: { icon: Square, label: 'Ciudad/Asentamiento' },
  ruin: { icon: Diamond, label: 'Ruina/Misterio' },
  camp: { icon: Triangle, label: 'Campamento/Peligro' },
  epic: { icon: Star, label: 'Hito Épico' },
  generic: { icon: Circle, label: 'Punto de Interés' }
};

const LINE_STYLES = {
  solid: { label: 'Camino Principal', dash: [] },
  dashed: { label: 'Ruta Planificada', dash: [10, 5] },
  dotted: { label: 'Ruta Histórica', dash: [2, 4] }
};

export default function MapRoutes({ universeId }) {
  const [points, setPoints] = useState([]);
  const [mapImageUrl, setMapImageUrl] = useState(null);
  const [lineStyle, setLineStyle] = useState('solid');
  const [lineColor, setLineColor] = useState('#7c3aed');
  const [selectedPointId, setSelectedPointId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointId, setDraggedPointId] = useState(null);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const savedRoute = useLiveQuery(() => db.routes.where({ universeId }).first(), [universeId]);

  useEffect(() => {
    if (savedRoute) {
      setPoints(JSON.parse(savedRoute.points || '[]'));
      setMapImageUrl(savedRoute.mapImageUrl);
      if (savedRoute.lineStyle) setLineStyle(savedRoute.lineStyle);
      if (savedRoute.lineColor) setLineColor(savedRoute.lineColor);
    }
  }, [savedRoute]);

  const saveRoute = async (newPoints, newMapUrl, newLineStyle, newLineColor) => {
    const existing = await db.routes.where({ universeId }).first();
    const data = {
      universeId,
      name: 'Ruta Principal',
      points: JSON.stringify(newPoints),
      mapImageUrl: newMapUrl || mapImageUrl,
      lineStyle: newLineStyle || lineStyle,
      lineColor: newLineColor || lineColor
    };
    if (existing) {
      await db.routes.update(existing.id, data);
    } else {
      await db.routes.add(data);
    }
  };

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e);
    // Hit detection for points (within 15 pixels)
    const hit = points.find(p => Math.hypot(p.x - x, p.y - y) < 15);
    
    if (hit) {
      setDraggedPointId(hit.id);
      setIsDragging(true);
      setSelectedPointId(hit.id);
    } else {
      setSelectedPointId(null);
      const newPoint = { x, y, id: Date.now(), type: 'generic' };
      const newPoints = [...points, newPoint];
      setPoints(newPoints);
      saveRoute(newPoints);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging && draggedPointId) {
      const { x, y } = getCanvasCoords(e);
      const newPoints = points.map(p => p.id === draggedPointId ? { ...p, x, y } : p);
      setPoints(newPoints);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      saveRoute(points);
      setIsDragging(false);
      setDraggedPointId(null);
    }
  };

  const updatePointType = (id, type) => {
    const newPoints = points.map(p => p.id === id ? { ...p, type } : p);
    setPoints(newPoints);
    saveRoute(newPoints);
  };

  const deletePoint = (id) => {
    const newPoints = points.filter(p => p.id !== id);
    setPoints(newPoints);
    setSelectedPointId(null);
    saveRoute(newPoints);
  };

  const drawShape = (ctx, type, x, y, size) => {
    ctx.beginPath();
    switch(type) {
      case 'square':
        ctx.rect(x - size, y - size, size * 2, size * 2);
        break;
      case 'diamond':
        ctx.moveTo(x, y - size * 1.5);
        ctx.lineTo(x + size * 1.5, y);
        ctx.lineTo(x, y + size * 1.5);
        ctx.lineTo(x - size * 1.5, y);
        ctx.closePath();
        break;
      case 'star':
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * size * 1.5 + x,
                   -Math.sin((18 + i * 72) / 180 * Math.PI) * size * 1.5 + y);
          ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * size * 0.7 + x,
                   -Math.sin((54 + i * 72) / 180 * Math.PI) * size * 0.7 + y);
        }
        ctx.closePath();
        break;
      case 'triangle':
        ctx.moveTo(x, y - size * 1.5);
        ctx.lineTo(x + size * 1.5, y + size);
        ctx.lineTo(x - size * 1.5, y + size);
        ctx.closePath();
        break;
      default: // generic / circle
        ctx.arc(x, y, size, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
  };

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    
    const draw = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      if (imageRef.current && imageRef.current.complete) {
        ctx.drawImage(imageRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      } else {
        ctx.fillStyle = 'rgba(124, 58, 237, 0.05)';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      // Draw connections
      if (points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 4;
        ctx.setLineDash(LINE_STYLES[lineStyle].dash);
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw nodes
      points.forEach((p, index) => {
        const isSelected = p.id === selectedPointId;
        ctx.fillStyle = isSelected ? '#fff' : (index === points.length - 1 ? '#ef4444' : lineColor);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = isSelected ? 3 : 2;
        
        drawShape(ctx, p.type, p.x, p.y, 8);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Inter';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'black';
        ctx.fillText(isSelected ? 'Seleccionado' : `Hito ${index + 1}`, p.x + 15, p.y + 5);
        ctx.shadowBlur = 0;
      });
    };

    if (mapImageUrl) {
      const img = new Image();
      img.src = mapImageUrl;
      img.onload = () => { imageRef.current = img; draw(); };
    } else {
      imageRef.current = null;
      draw();
    }
  }, [points, mapImageUrl, lineStyle, lineColor, selectedPointId]);

  return (
    <div className="map-routes">
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Cartografía Narrativa 2.0</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Arrastra los nodos para moverlos, haz clic para crear y personaliza cada punto.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label className="glass" style={{ padding: '8px 16px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} /> Cargar Mapa
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const r = new FileReader();
                r.onloadend = () => { setMapImageUrl(r.result); saveRoute(points, r.result); };
                r.readAsDataURL(file);
              }
            }} style={{ display: 'none' }} />
          </label>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        <div style={{ position: 'relative', height: 'fit-content' }}>
          <canvas 
            ref={canvasRef}
            width={1200}
            height={800}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className="card glass"
            style={{ 
               cursor: isDragging ? 'grabbing' : 'crosshair', 
               width: '100%', height: 'auto', aspectRatio: '12/8', padding: '0', overflow: 'hidden'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Global Style Panel */}
          <div className="card glass" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings2 size={16} /> Estilo de Línea
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {Object.keys(LINE_STYLES).map(style => (
                  <button 
                    key={style}
                    onClick={() => { setLineStyle(style); saveRoute(points, mapImageUrl, style); }}
                    style={{ 
                      flex: 1, padding: '8px', fontSize: '10px', 
                      background: lineStyle === style ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      border: 'none', color: 'white', borderRadius: '4px'
                    }}
                  >{LINE_STYLES[style].label}</button>
                ))}
              </div>
              <input 
                type="color" 
                value={lineColor} 
                onChange={(e) => { setLineColor(e.target.value); saveRoute(points, mapImageUrl, lineStyle, e.target.value); }}
                style={{ width: '100%', height: '30px', border: 'none', background: 'transparent' }}
              />
            </div>
          </div>

          {/* Point Specific Panel */}
          {selectedPointId ? (
            <div className="card glass" style={{ padding: '1rem', border: '1px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                 <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>Editar Punto</h4>
                 <button onClick={() => deletePoint(selectedPointId)} style={{ background: 'transparent', border: 'none', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {Object.entries(NODE_TYPES).map(([type, meta]) => (
                  <button 
                    key={type}
                    onClick={() => updatePointType(selectedPointId, type)}
                    style={{ 
                      padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      background: points.find(p => p.id === selectedPointId)?.type === type ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      border: 'none', color: 'white', borderRadius: '8px'
                    }}
                  >
                    <meta.icon size={16} />
                    <span style={{ fontSize: '9px' }}>{type.toUpperCase()}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '11px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Move size={12} /> Arrastra en el mapa para mover
              </div>
            </div>
          ) : (
            <div className="card glass" style={{ padding: '1.5rem', textAlign: 'center', opacity: 0.5 }}>
               <MousePointer2 size={32} style={{ margin: '0 auto 10px' }} />
               <p style={{ fontSize: '12px' }}>Haz clic en un hito o crea uno nuevo para personalizarlo.</p>
            </div>
          )}

          <div className="card glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '0.9rem' }}>Itinerario</h4>
            {points.map((p, i) => (
              <div key={p.id} className="glass" style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span>{i+1}. {NODE_TYPES[p.type || 'generic'].label}</span>
                <button onClick={() => setSelectedPointId(p.id)} style={{ color: 'var(--accent)', background: 'transparent', border: 'none' }}><Settings2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
