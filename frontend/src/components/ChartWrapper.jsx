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

export function CategoryPie({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category" outerRadius={100} label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
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
          <Bar key={k} dataKey={k} stackId="expenses" fill={COLORS[i % COLORS.length]} name={k} />
        ))}
        <Line type="monotone" dataKey="income" stroke="#16a34a" name="Income" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default { CategoryPie, ComposedIncomeExpenseChart };
