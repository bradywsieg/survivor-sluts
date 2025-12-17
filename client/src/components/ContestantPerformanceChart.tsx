import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { UserCircle } from "lucide-react";

interface ContestantData {
  name: string;
  points: number;
  eliminated?: boolean;
}

interface ContestantPerformanceChartProps {
  data: ContestantData[];
}

export default function ContestantPerformanceChart({ data }: ContestantPerformanceChartProps) {
  const sortedData = [...data].sort((a, b) => b.points - a.points);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold font-[Montserrat]">
          <UserCircle className="h-6 w-6 text-primary" />
          Contestant Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sortedData} 
              layout="vertical" 
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={75}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
                formatter={(value: number) => [`${value} pts`, 'Points']}
              />
              <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.eliminated ? 'hsl(var(--muted))' : 'hsl(178, 65%, 32%)'}
                    opacity={entry.eliminated ? 0.5 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
