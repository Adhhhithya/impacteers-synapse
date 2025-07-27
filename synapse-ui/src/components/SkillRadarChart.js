// src/components/SkillRadarChart.js

import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

// Chart.js requires us to register the components we're going to use
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function SkillRadarChart({ skillsData, maxScore }) {
  // The data structure required by Chart.js
  const data = {
    labels: skillsData.map(s => s.skill), // e.g., ['Python', 'SQL', 'Tableau']
    datasets: [
      {
        label: 'Candidate Skill Score',
        data: skillsData.map(s => s.score), // e.g., [2, 1, 1]
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        borderColor: 'rgba(0, 123, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(0, 123, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(0, 123, 255, 1)',
      },
    ],
  };

  // Configuration options for the chart's appearance
  const options = {
    scales: {
      r: {
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        suggestedMin: 0,
        suggestedMax: maxScore, // e.g., 2 (for direct skill)
        ticks: {
          stepSize: 1,
          backdropColor: 'rgba(255, 255, 255, 0.75)',
        },
      },
    },
    plugins: {
      legend: {
        display: false, // We can hide the legend for a cleaner look
      },
    },
    maintainAspectRatio: false, // Important for fitting in our container
  };

  return <Radar data={data} options={options} />;
}

export default SkillRadarChart;