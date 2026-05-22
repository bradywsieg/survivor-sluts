import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface WeeklyData {
  week: string;
  [teamName: string]: number | string;
}

interface TeamPointsChartProps {
  data: WeeklyData[];
  teamNames: string[];
  teamImages: Record<string, string>;
}

const CHART_COLORS = [
  "hsl(178, 65%, 32%)",
  "hsl(25, 85%, 45%)",
  "hsl(195, 75%, 28%)",
  "hsl(45, 80%, 38%)",
  "hsl(160, 55%, 35%)",
];

function TeamAvatarDot({ cx, cy, index, teamName, teamImages, color, isLast }: any) {
  if (!isLast || cx == null || cy == null) {
    return (
      <circle cx={cx} cy={cy} r={4} fill={color} stroke="none" />
    );
  }
  const imageUrl = teamImages[teamName];
  const radius = 14;
  const initials = teamName.substring(0, 2).toUpperCase();

  if (imageUrl) {
    return (
      <g>
        <defs>
          <clipPath id={`avatar-clip-${index}`}>
            <circle cx={cx} cy={cy} r={radius} />
          </clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={radius + 1.5} fill={color} />
        <image
          href={imageUrl}
          x={cx - radius}
          y={cy - radius}
          width={radius * 2}
          height={radius * 2}
          clipPath={`url(#avatar-clip-${index})`}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
    );
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill={color} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={9}
        fontWeight="bold"
      >
        {initials}
      </text>
    </g>
  );
}

export default function TeamPointsChart({ data, teamNames, teamImages }: TeamPointsChartProps) {
  const lastIndex = data.length - 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold font-['Slackey'] tracking-wide">
          <TrendingUp className="h-6 w-6 text-primary" />
          Team Scoring by Week
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {/* Scrollable wrapper for mobile */}
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div style={{ minWidth: Math.max(320, teamNames.length * 80 + data.length * 60) }} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 36, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="week"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                {teamNames.map((name, index) => {
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  return (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={color}
                      strokeWidth={2}
                      dot={(props: any) => (
                        <TeamAvatarDot
                          key={props.key}
                          cx={props.cx}
                          cy={props.cy}
                          index={index}
                          teamName={name}
                          teamImages={teamImages}
                          color={color}
                          isLast={props.index === lastIndex}
                        />
                      )}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
