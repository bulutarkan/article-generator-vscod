import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
    }[];
  };
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#cbd5e1', // slate-300
        },
      },
      title: {
        display: false,
        text: 'Daily Article Creation',
        color: '#f8fafc', // slate-50
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dsLabel = context.dataset?.label || '';
            const y = context.parsed?.y;
            const value = (typeof y === 'number' && Number.isFinite(y)) ? y.toLocaleString() : y;
            return dsLabel ? `${dsLabel}: ${value}` : `${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8', // slate-400
        },
        grid: {
          color: '#334155', // slate-700
        },
      },
      y: {
        ticks: {
          color: '#94a3b8', // slate-400
          stepSize: 1,
        },
        grid: {
          color: '#334155', // slate-700
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};
