import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import clsx from 'clsx';

const statusColors = {
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
};

/**
 * Organization overview chart showing status distribution
 */
export function StatusDistributionChart({ data, className }) {
  const chartData = [
    { name: 'Strong', value: data.green, color: statusColors.green },
    { name: 'Developing', value: data.amber, color: statusColors.amber },
    { name: 'Early Stage', value: data.red, color: statusColors.red },
  ].filter(d => d.value > 0);

  return (
    <motion.div
      className={clsx('w-full h-48', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value) => [`${value} squads`, 'Count']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/**
 * Radar chart for category breakdown
 */
export function CategoryRadarChart({ data, className }) {
  return (
    <motion.div
      className={clsx('w-full h-64', className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
    >
      <ResponsiveContainer>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid
            stroke="#334155"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#0EA5E9"
            fill="#0EA5E9"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value) => [`${value}%`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export { StatusDistributionChart as default };
