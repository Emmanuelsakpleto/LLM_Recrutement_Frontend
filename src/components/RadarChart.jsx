import React, { useEffect, useRef } from 'react';

// Nouvelle signature : data = [{ name, values: { label: value, ... }, color }]
const COLORS = [
  '#3b82f6', // bleu
  '#ef4444', // rouge
  '#10b981', // vert
  '#f59e42', // orange
  '#a855f7', // violet
  '#6366f1', // indigo
  '#f43f5e', // rose
];

const RadarChart = React.forwardRef(({ data = [], title = "Évaluation comparative" }, ref) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;

    // Récupérer tous les labels (axes) à partir du premier dataset
    const labels = data[0] ? Object.keys(data[0].values) : [];
    const maxValue = 100;

    // Cercles de fond
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = '#d1d5db';
    labels.forEach((_, index) => {
      const angle = (index * 2 * Math.PI) / labels.length - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });
    // Polygones pour chaque dataset
    data.forEach((dataset, i) => {
      const values = Object.values(dataset.values);
      const color = dataset.color || COLORS[i % COLORS.length];
      // Polygone
      ctx.strokeStyle = color;
      ctx.fillStyle = color + '33'; // Opacité faible
      ctx.lineWidth = 2;
      ctx.beginPath();
      values.forEach((value, index) => {
        const angle = (index * 2 * Math.PI) / labels.length - Math.PI / 2;
        const normalizedValue = (value / maxValue) * radius;
        const x = centerX + normalizedValue * Math.cos(angle);
        const y = centerY + normalizedValue * Math.sin(angle);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Points
      ctx.fillStyle = color;
      values.forEach((value, index) => {
        const angle = (index * 2 * Math.PI) / labels.length - Math.PI / 2;
        const normalizedValue = (value / maxValue) * radius;
        const x = centerX + normalizedValue * Math.cos(angle);
        const y = centerY + normalizedValue * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
    // Labels axes
    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, index) => {
      const angle = (index * 2 * Math.PI) / labels.length - Math.PI / 2;
      const labelRadius = radius + 20;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      ctx.fillText(label, x, y + 4);
    });
  }, [data]);

  // Ajout : méthode pour exporter le canvas en image base64
  const getImageBase64 = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      return canvas.toDataURL('image/png');
    }
    return null;
  };

  // Expose la méthode via ref si besoin
  React.useImperativeHandle(ref, () => ({ getImageBase64 }), [canvasRef]);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      <div className="flex justify-center">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={300}
          className="max-w-full h-auto"
        />
      </div>
      {/* Légende */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((d, i) => (
          <div key={d.name || i} className="flex items-center gap-2">
            <span style={{ background: d.color || COLORS[i % COLORS.length], width: 16, height: 8, display: 'inline-block', borderRadius: 2 }} />
            <span className="text-sm text-gray-700">{d.name || `Candidat ${i + 1}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RadarChart;
