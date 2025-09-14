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

const RADIAN = Math.PI / 180;
function renderSliceLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) {
  // Place label at 50% of the slice radius
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  // Skip very small slices to reduce clutter
  if (percent < 0.06) return null;
  return (
    <text x={x} y={y} fill="#fff" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {value}
    </text>
  );
}

export function CategoryPie({ data }) {
  const normalized = (Array.isArray(data) ? data : []).map((d) => ({
    category: decodeHtml(d.category),
    total: d.total,
  }));
  return (
    <ResponsiveContainer width="100%" height={360}>
      <PieChart margin={{ top: 10, bottom: 80 }}>
        <Pie
          data={normalized}
          dataKey="total"
          nameKey="category"
          outerRadius={110}
          labelLine={false}
          label={renderSliceLabel}
        >
          {normalized.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, 'Amount']} />
        <Legend verticalAlign="bottom" align="center" layout="horizontal" height={50} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ComposedIncomeExpenseChart({ data }) {
  // Determine expense category keys dynamically (exclude 'date' and 'income')
  const keys = Array.from(
    data.reduce((set, item) => {
      Object.keys(item).forEach((k) => {
        if (k !== 'date' && k !== 'income') set.add(k);
      });
      return set;
    }, new Set())
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} stackId="expenses" fill={COLORS[i % COLORS.length]} name={decodeHtml(k)} />
        ))}
        <Line type="monotone" dataKey="income" stroke="#16a34a" name="Income" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default { CategoryPie, ComposedIncomeExpenseChart };
