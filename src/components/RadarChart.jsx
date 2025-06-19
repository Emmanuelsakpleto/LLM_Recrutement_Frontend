
import React, { useEffect, useRef } from 'react';

const RadarChart = ({ data, title = "Évaluation Candidat" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    const maxValue = 100;
    
    // Draw background circles
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    labels.forEach((_, index) => {
      const angle = (index * 2 * Math.PI) / labels.length - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });
    
    // Draw data polygon
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    values.forEach((value, index) => {
      const angle = (index * 2 * Math.PI) / labels.length - Math.PI / 2;
      const normalizedValue = (value / maxValue) * radius;
      const x = centerX + normalizedValue * Math.cos(angle);
      const y = centerY + normalizedValue * Math.sin(angle);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = '#3b82f6';
    values.forEach((value, index) => {
      const angle = (index * 2 * Math.PI) / labels.length - Math.PI / 2;
      const normalizedValue = (value / maxValue) * radius;
      const x = centerX + normalizedValue * Math.cos(angle);
      const y = centerY + normalizedValue * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
      const angle = (index * 2 * Math.PI) / labels.length - Math.PI / 2;
      const labelRadius = radius + 20;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      ctx.fillText(label, x, y + 4);
      
      // Draw value
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`${values[index].toFixed(1)}`, x, y + 18);
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, sans-serif';
    });
    
  }, [data]);

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
    </div>
  );
};

export default RadarChart;
