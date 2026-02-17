import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

interface ContestantData {
  id: number;
  name: string;
  imageUrl?: string;
  points: number;
  eliminated?: boolean;
}

interface Week {
  id: number;
  weekNumber: number;
}

interface ContestantPerformanceChartProps {
  data: ContestantData[];
  weeks: Week[];
  weeklyContestantScores: Record<number, { contestantId: number; points: number }[]>;
  contestants: { id: number; name: string; imageUrl?: string; eliminated?: boolean }[];
}

function ContestantAvatarTick({ x, y, payload, contestantMap }: any) {
  const contestant = contestantMap[payload.value];
  const imageUrl = contestant?.imageUrl;
  const contestantId = contestant?.id || 0;
  const name = payload.value;
  const radius = 10;
  const textX = x - radius * 2 - 6;

  return (
    <g>
      {imageUrl ? (
        <g>
          <defs>
            <clipPath id={`contestant-clip-${contestantId}`}>
              <circle cx={x - radius - 2} cy={y} r={radius} />
            </clipPath>
          </defs>
          <image
            href={imageUrl}
            x={x - radius * 2 - 2}
            y={y - radius}
            width={radius * 2}
            height={radius * 2}
            clipPath={`url(#contestant-clip-${contestantId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      ) : (
        <g>
          <circle cx={x - radius - 2} cy={y} r={radius} fill="hsl(var(--muted))" />
          <text
            x={x - radius - 2}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="hsl(var(--muted-foreground))"
            fontSize={8}
            fontWeight="bold"
          >
            {name.substring(0, 1).toUpperCase()}
          </text>
        </g>
      )}
      <text
        x={textX}
        y={y}
        textAnchor="end"
        dominantBaseline="central"
        fill="hsl(var(--muted-foreground))"
        fontSize={12}
      >
        {name.length > 18 ? name.substring(0, 16) + "..." : name}
      </text>
    </g>
  );
}

export default function ContestantPerformanceChart({ 
  data, 
  weeks, 
  weeklyContestantScores,
  contestants 
}: ContestantPerformanceChartProps) {
  const [viewMode, setViewMode] = useState<"cumulative" | "weekly">("cumulative");
  const sortedWeeks = useMemo(() => [...weeks].sort((a, b) => a.weekNumber - b.weekNumber), [weeks]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");

  const latestWeekId = sortedWeeks.length > 0 ? String(sortedWeeks[sortedWeeks.length - 1].id) : "";
  const activeWeekId = selectedWeekId || latestWeekId;

  const contestantMap = useMemo(() => {
    const map: Record<string, { id: number; imageUrl?: string }> = {};
    data.forEach(c => {
      map[c.name] = { id: c.id, imageUrl: c.imageUrl };
    });
    return map;
  }, [data]);

  const chartData = useMemo(() => {
    if (viewMode === "cumulative") {
      return [...data].sort((a, b) => b.points - a.points);
    }
    
    const weekScores = weeklyContestantScores[Number(activeWeekId)] || [];
    const scoreMap = new Map(weekScores.map(s => [s.contestantId, s.points]));
    
    return contestants
      .map(c => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl,
        points: scoreMap.get(c.id) || 0,
        eliminated: c.eliminated,
      }))
      .sort((a, b) => b.points - a.points);
  }, [viewMode, data, activeWeekId, weeklyContestantScores, contestants]);

  const barHeight = 32;
  const chartHeight = Math.max(300, chartData.length * barHeight + 60);

  const activeWeek = sortedWeeks.find(w => String(w.id) === activeWeekId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4 flex-wrap">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold font-['Slackey'] tracking-wide">
          <UserCircle className="h-6 w-6 text-primary" />
          Contestant Performance
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-md border border-border overflow-visible">
            <Button
              variant={viewMode === "cumulative" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cumulative")}
              className="rounded-none rounded-l-md no-default-hover-elevate no-default-active-elevate"
              data-testid="button-view-cumulative"
            >
              Cumulative
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
              className="rounded-none rounded-r-md no-default-hover-elevate no-default-active-elevate"
              data-testid="button-view-weekly"
            >
              Weekly
            </Button>
          </div>
          {viewMode === "weekly" && sortedWeeks.length > 0 && (
            <Select value={activeWeekId} onValueChange={setSelectedWeekId}>
              <SelectTrigger className="w-[140px]" data-testid="select-week">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {sortedWeeks.map(week => (
                  <SelectItem key={week.id} value={String(week.id)}>
                    Week {week.weekNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "weekly" && activeWeek && (
          <p className="text-sm text-muted-foreground mb-3" data-testid="text-week-label">
            Showing scores for Week {activeWeek.weekNumber}
          </p>
        )}
        <div style={{ height: chartHeight }} className="w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical" 
              margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={115}
                tick={(props: any) => (
                  <ContestantAvatarTick {...props} contestantMap={contestantMap} />
                )}
                interval={0}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
                formatter={(value: number) => [`${value} pts`, 'Points']}
              />
              <Bar dataKey="points" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.eliminated ? 'hsl(var(--muted))' : 'hsl(178, 65%, 32%)'}
                    opacity={entry.eliminated ? 0.5 : 1}
                  />
                ))}
                <LabelList 
                  dataKey="points" 
                  position="right" 
                  fill="hsl(var(--muted-foreground))"
                  fontSize={12}
                  fontWeight="bold"
                  formatter={(value: number) => value > 0 ? value : ""}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
