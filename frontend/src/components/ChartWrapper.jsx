import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#7C3AED', '#EF4444'];

// Decode any HTML entities that may have been stored in DB
function decodeHtml(str) {
  if (typeof str !== 'string') return str;
  const el = document.createElement('textarea');
  el.innerHTML = str;
  return el.value;
}

// Hook to get responsive chart dimensions
function useChartDimensions() {
  const [dimensions, setDimensions] = useState({
    pieHeight: 280,
    composedHeight: 240,
    pieRadius: 80,
    labelFontSize: 10,
    legendHeight: 40,
    pieMarginBottom: 60,
    axisFontSize: 10,
    legendFontSize: 10,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      if (width < 475) {
        // xs screens - need more space for legend
        setDimensions({
          pieHeight: 320, // Increased to accommodate legend
          composedHeight: 220,
          pieRadius: 55, // Reduced to make room for legend
          labelFontSize: 8,
          legendHeight: 80, // Increased significantly for wrapping legend items
          pieMarginBottom: 90, // Increased to prevent legend cutoff
          axisFontSize: 8,
          legendFontSize: 8,
        });
      } else if (width < 640) {
        // sm screens
        setDimensions({
          pieHeight: 360,
          composedHeight: 260,
          pieRadius: 70,
          labelFontSize: 9,
          legendHeight: 70,
          pieMarginBottom: 80,
          axisFontSize: 9,
          legendFontSize: 9,
        });
      } else if (width < 768) {
        // md screens
        setDimensions({
          pieHeight: 380,
          composedHeight: 300,
          pieRadius: 90,
          labelFontSize: 10,
          legendHeight: 60,
          pieMarginBottom: 75,
          axisFontSize: 10,
          legendFontSize: 10,
        });
      } else {
        // lg+ screens
        setDimensions({
          pieHeight: 400,
          composedHeight: 320,
          pieRadius: 110,
          labelFontSize: 11,
          legendHeight: 55,
          pieMarginBottom: 70,
          axisFontSize: 11,
          legendFontSize: 11,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return dimensions;
}

const RADIAN = Math.PI / 180;
function renderSliceLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }, fontSize) {
  // Place label at 50% of the slice radius
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  // Skip very small slices to reduce clutter
  if (percent < 0.06) return null;
  return (
    <text x={x} y={y} fill="#fff" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={fontSize}>
      {value}
    </text>
  );
}

export function CategoryPie({ data }) {
  const dimensions = useChartDimensions();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 768);
  
  const normalized = (Array.isArray(data) ? data : []).map((d) => ({
    category: decodeHtml(d.category),
    total: d.total,
  }));

  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const labelRenderer = (props) => renderSliceLabel(props, dimensions.labelFontSize);
  const isSmallScreen = windowWidth < 640;
  const isExtraSmallScreen = windowWidth < 475;

  return (
    <ResponsiveContainer width="100%" height={dimensions.pieHeight}>
      <PieChart margin={{ top: 5, bottom: dimensions.pieMarginBottom, left: 5, right: 5 }}>
        <Pie
          data={normalized}
          dataKey="total"
          nameKey="category"
          outerRadius={dimensions.pieRadius}
          labelLine={false}
          label={labelRenderer}
        >
          {normalized.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Amount']} />
        <Legend 
          verticalAlign="bottom" 
          align="center" 
          layout="horizontal"
          height={dimensions.legendHeight}
          wrapperStyle={{ 
            fontSize: dimensions.legendFontSize,
            paddingTop: isExtraSmallScreen ? '10px' : '5px',
            lineHeight: isExtraSmallScreen ? '1.5' : '1.3',
            overflow: 'visible'
          }}
          iconSize={isSmallScreen ? 10 : 12}
          formatter={(value) => {
            // Truncate long category names on very small screens
            if (isExtraSmallScreen && value.length > 22) {
              return value.substring(0, 20) + '...';
            } else if (isSmallScreen && value.length > 25) {
              return value.substring(0, 23) + '...';
            }
            return value;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ComposedIncomeExpenseChart({ data }) {
  const dimensions = useChartDimensions();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 768);
  
  // Determine expense category keys dynamically (exclude 'date' and 'income')
  const keys = Array.from(
    data.reduce((set, item) => {
      Object.keys(item).forEach((k) => {
        if (k !== 'date' && k !== 'income') set.add(k);
      });
      return set;
    }, new Set())
  );

  // Adjust margins based on screen size
  const getMargins = (width) => {
    if (width < 475) {
      return { top: 5, right: 5, left: 0, bottom: 60 }; // Increased bottom for legend
    } else if (width < 640) {
      return { top: 5, right: 10, left: 0, bottom: 55 };
    } else if (width < 768) {
      return { top: 5, right: 15, left: 0, bottom: 50 };
    }
    return { top: 5, right: 20, left: 0, bottom: 5 };
  };

  const [margins, setMargins] = useState(() => getMargins(windowWidth));

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setMargins(getMargins(width));
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const isSmallScreen = windowWidth < 640;
  const isExtraSmallScreen = windowWidth < 475;

  return (
    <ResponsiveContainer width="100%" height={dimensions.composedHeight}>
      <ComposedChart data={data} margin={margins}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: dimensions.axisFontSize }}
          angle={isSmallScreen ? -45 : 0}
          textAnchor={isSmallScreen ? 'end' : 'middle'}
          height={isSmallScreen ? 60 : 30}
        />
        <YAxis 
          tick={{ fontSize: dimensions.axisFontSize }}
          width={isExtraSmallScreen ? 40 : isSmallScreen ? 50 : 60}
        />
        <Tooltip 
          contentStyle={{ fontSize: dimensions.axisFontSize }}
          formatter={(value, name) => [`₹${Number(value).toFixed(2)}`, name]}
        />
        <Legend 
          wrapperStyle={{ 
            fontSize: dimensions.legendFontSize,
            paddingTop: isSmallScreen ? '8px' : '5px',
            lineHeight: '1.3',
            overflow: 'visible'
          }}
          iconSize={isSmallScreen ? 10 : 14}
          layout="horizontal"
          verticalAlign="bottom"
          height={isSmallScreen ? 50 : 40}
          formatter={(value) => {
            // Truncate long category names on very small screens
            if (isExtraSmallScreen && value.length > 18) {
              return value.substring(0, 16) + '...';
            } else if (isSmallScreen && value.length > 20) {
              return value.substring(0, 18) + '...';
            }
            return value;
          }}
        />
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} stackId="expenses" fill={COLORS[i % COLORS.length]} name={decodeHtml(k)} />
        ))}
        <Line 
          type="monotone" 
          dataKey="income" 
          stroke="#16a34a" 
          name="Income" 
          strokeWidth={isSmallScreen ? 1.5 : 2} 
          dot={false} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default { CategoryPie, ComposedIncomeExpenseChart };

