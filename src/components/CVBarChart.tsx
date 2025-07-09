import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CVBarChartProps {
  scores: {
    skills: number;
    experience: number;
    education: number;
    global: number;
  };
}

// Correction : mapping des scores pour compatibilité avec le backend (skills_score, experience_score, education_score, final_score)
const mapScores = (raw: any) => {
  if (!raw) return { skills: 0, experience: 0, education: 0, global: 0 };
  return {
    skills: raw.skills_score ?? raw.skills ?? 0,
    experience: raw.experience_score ?? raw.experience ?? 0,
    education: raw.education_score ?? raw.education ?? 0,
    global: raw.final_score ?? raw.global ?? raw.score ?? 0,
  };
};

const CVBarChart: React.FC<CVBarChartProps> = ({ scores }) => {
  const mappedScores = mapScores(scores);
  const isValidNumber = (val: any) => typeof val === 'number' && !isNaN(val);
  const allValid =
    isValidNumber(mappedScores.skills) &&
    isValidNumber(mappedScores.experience) &&
    isValidNumber(mappedScores.education) &&
    isValidNumber(mappedScores.global);

  console.log('CVBarChart props.scores', scores);
  Object.entries(scores).forEach(([k, v]) => {
    console.log('CVBarChart field', k, 'type:', typeof v, v);
  });

  if (!allValid) {
    return (
      <div className="w-full max-w-xl mx-auto my-6 text-red-600 bg-red-100 p-4 rounded">
        Erreur : Les scores fournis au bar chart ne sont pas des nombres valides.
        <br />
        <pre>{JSON.stringify(scores, null, 2)}</pre>
      </div>
    );
  }

  const data = {
    labels: ['Compétences', 'Expérience', 'Formation', 'Score global'],
    datasets: [
      {
        label: 'Score (%)',
        data: [
          Math.round(mappedScores.skills),
          Math.round(mappedScores.experience),
          Math.round(mappedScores.education),
          Math.round(mappedScores.global),
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20 },
      },
    },
  };

  return (
    <div className="w-full max-w-xl mx-auto my-6">
      <Bar data={data} options={options} />
    </div>
  );
};

export default CVBarChart;
