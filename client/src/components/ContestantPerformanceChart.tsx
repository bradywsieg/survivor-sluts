import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";

interface ContestantData {
  id: number;
  name: string;
  imageUrl?: string;
  points: number;
  eliminated?: boolean;
  tribeColor?: string;
  isSoleSurvivor?: boolean;
}

interface Week {
  id: number;
  weekNumber: number;
}

interface ContestantPerformanceChartProps {
  data: ContestantData[];
  weeks: Week[];
  weeklyContestantScores: Record<number, { contestantId: number; points: number }[]>;
  contestants: { id: number; name: string; imageUrl?: string; eliminated?: boolean; isSoleSurvivor?: boolean }[];
}

const torchFilterStyle = "brightness(0) saturate(100%) invert(23%) sepia(95%) saturate(900%) hue-rotate(335deg)";

function ContestantAvatarTick({ x, y, payload, contestantMap }: any) {
  const contestant = contestantMap[payload.value];
  const imageUrl = contestant?.imageUrl;
  const contestantId = contestant?.id || 0;
  const tribeColor = contestant?.tribeColor;
  const isSoleSurvivor = contestant?.isSoleSurvivor;
  const name = payload.value;
  const radius = 10;
  const textX = x - radius * 2 - 6;
  const outlineWidth = tribeColor ? 2 : 0;

  return (
    <g>
      {tribeColor && (
        <circle cx={x - radius - 2} cy={y} r={radius + outlineWidth} fill={tribeColor} />
      )}
      {isSoleSurvivor && !tribeColor && (
        <circle cx={x - radius - 2} cy={y} r={radius + 2} fill="#f59e0b" />
      )}
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
        fill={isSoleSurvivor ? "#b45309" : "hsl(var(--muted-foreground))"}
        fontSize={12}
        fontWeight={isSoleSurvivor ? "bold" : "normal"}
      >
        {name}
      </text>
    </g>
  );
}

function TorchLabel(props: any) {
  const { x, y, width, height, value, chartData } = props;
  const entry = chartData?.find((d: ContestantData) => d.name === value);
  if (!entry?.isSoleSurvivor) return null;

  const pts = entry.points;
  const iconSize = 16;
  const labelX = (x ?? 0) + (width ?? 0) + (String(pts).length * 7) + 16;
  // center-align vertically within the bar
  const labelY = (y ?? 0) + ((height ?? 20) / 2) - iconSize / 2;

  return (
    <g>
      <title>Sole Survivor</title>
      <image
        href="/torch.png"
        x={labelX}
        y={labelY}
        width={iconSize}
        height={iconSize}
        style={{ filter: torchFilterStyle }}
      />
    </g>
  );
}

// Mobile list row
function MobileContestantRow({ entry, rank }: { entry: ContestantData; rank: number }) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 border-b last:border-0 ${
        entry.isSoleSurvivor ? "bg-amber-50/40" : ""
      }`}
    >
      <span className="w-5 text-right text-sm font-bold text-muted-foreground shrink-0">{rank}</span>
      <div className="relative shrink-0">
        <Avatar className={`h-9 w-9 ${entry.isSoleSurvivor ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}>
          <AvatarImage src={entry.imageUrl} alt={entry.name} />
          <AvatarFallback
            className="text-xs font-semibold"
            style={
              entry.tribeColor
                ? { backgroundColor: entry.tribeColor + "33", color: entry.tribeColor }
                : {}
            }
          >
            {entry.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {entry.tribeColor && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: entry.tribeColor }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-medium text-sm truncate ${
              entry.isSoleSurvivor ? "text-amber-800 font-semibold" : entry.eliminated ? "text-muted-foreground" : ""
            }`}
          >
            {entry.name}
          </span>
          {entry.isSoleSurvivor && (
            <img
              src="/torch.png"
              alt="Sole Survivor"
              title="Sole Survivor"
              className="h-4 w-4 shrink-0"
              style={{ filter: torchFilterStyle }}
            />
          )}
          {entry.eliminated && !entry.isSoleSurvivor && (
            <span className="text-xs text-muted-foreground">(out)</span>
          )}
        </div>
      </div>
      <span
        className={`font-semibold tabular-nums text-sm shrink-0 ${entry.isSoleSurvivor ? "text-amber-700" : ""}`}
      >
        {entry.points} pts
      </span>
    </div>
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
    const map: Record<string, { id: number; imageUrl?: string; tribeColor?: string; isSoleSurvivor?: boolean }> = {};
    data.forEach(c => {
      map[c.name] = { id: c.id, imageUrl: c.imageUrl, tribeColor: c.tribeColor, isSoleSurvivor: c.isSoleSurvivor };
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
      .map(c => {
        const d = data.find(d => d.id === c.id);
        return {
          id: c.id,
          name: c.name,
          imageUrl: c.imageUrl,
          points: scoreMap.get(c.id) || 0,
          eliminated: c.eliminated,
          tribeColor: d?.tribeColor,
          isSoleSurvivor: c.isSoleSurvivor,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [viewMode, data, activeWeekId, weeklyContestantScores, contestants]);

  const barHeight = 32;
  const chartHeight = Math.max(300, chartData.length * barHeight + 60);
  const activeWeek = sortedWeeks.find(w => String(w.id) === activeWeekId);

  const controls = (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex rounded-md border border-border overflow-visible">
        <Button
          variant={viewMode === "cumulative" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("cumulative")}
          className="rounded-none rounded-l-md"
          data-testid="button-view-cumulative"
        >
          Cumulative
        </Button>
        <Button
          variant={viewMode === "weekly" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("weekly")}
          className="rounded-none rounded-r-md"
          data-testid="button-view-weekly"
        >
          Weekly
        </Button>
      </div>
      {viewMode === "weekly" && sortedWeeks.length > 0 && (
        <Select value={activeWeekId} onValueChange={setSelectedWeekId}>
          <SelectTrigger className="w-[130px]" data-testid="select-week">
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
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4 flex-wrap">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold font-['Slackey'] tracking-wide">
          <UserCircle className="h-6 w-6 text-primary" />
          Contestant Performance
        </CardTitle>
        {controls}
      </CardHeader>

      <CardContent>
        {viewMode === "weekly" && activeWeek && (
          <p className="text-sm text-muted-foreground mb-3" data-testid="text-week-label">
            Showing scores for Week {activeWeek.weekNumber}
          </p>
        )}

        {/* Mobile list view */}
        <div className="md:hidden">
          {chartData.map((entry, i) => (
            <MobileContestantRow key={entry.id} entry={entry} rank={i + 1} />
          ))}
          {chartData.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No contestants to display.</p>
          )}
        </div>

        {/* Desktop bar chart */}
        <div className="hidden md:block" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 90, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={200}
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
                    fill={
                      entry.isSoleSurvivor
                        ? '#f59e0b'
                        : entry.eliminated
                        ? 'hsl(var(--muted))'
                        : 'hsl(178, 65%, 32%)'
                    }
                    opacity={entry.eliminated && !entry.isSoleSurvivor ? 0.5 : 1}
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
                <LabelList
                  dataKey="name"
                  content={(props: any) => (
                    <TorchLabel {...props} chartData={chartData} />
                  )}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
