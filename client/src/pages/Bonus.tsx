import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SeasonSelector from "@/components/SeasonSelector";
import { useSeason } from "@/hooks/use-season";
import { HelpCircle, Lock, Send, History, ChevronDown, ChevronUp, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface BonusQuestion {
  id: number;
  seasonId: number;
  weekId: number;
  questionText: string;
  questionType: string;
  points: number;
  optionsJson: string | null;
  correctAnswer: string | null;
  isWager: boolean;
}

interface Week {
  id: number;
  weekNumber: number;
}

interface Team {
  id: number;
  name: string;
  seasonId: number | null;
}

interface Contestant {
  id: number;
  name: string;
  eliminated: boolean;
  seasonId: number | null;
}

interface HistoryEntry {
  weekId: number;
  weekNumber: number;
  submittedAt: string;
  answers: Record<string, any>;
  questions: {
    id: number;
    questionText: string;
    questionType: string;
    points: number;
    optionsJson: string | null;
    correctAnswer: string | null;
    isWager: boolean;
  }[];
}

function formatDeadlineDisplay(iso: string): string {
  const dt = new Date(iso);
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const year = dt.getFullYear();
  let hours = dt.getHours();
  const mins = String(dt.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${month}/${day}/${year} at ${hours}:${mins} ${ampm} PST`;
}

export default function Bonus() {
  const { toast } = useToast();
  const { seasons, selectedSeasonId, setSelectedSeasonId } = useSeason();
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [passcode, setPasscode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [lockedSeasonId, setLockedSeasonId] = useState<string>("");
  const [showSetPasscode, setShowSetPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState("");
  const [oldPasscode, setOldPasscode] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});

  const activeSeasonId = isVerified ? lockedSeasonId : selectedSeasonId;

  const { data: weeks = [] } = useQuery<Week[]>({
    queryKey: ["/api/weeks", { seasonId: activeSeasonId }],
    queryFn: async () => {
      const res = await fetch(`/api/weeks?seasonId=${activeSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!activeSeasonId,
  });

  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await fetch(`/api/teams`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const teams = activeSeasonId
    ? allTeams.filter(t => t.seasonId === parseInt(activeSeasonId))
    : [];

  const { data: contestants = [] } = useQuery<Contestant[]>({
    queryKey: ["/api/contestants", { seasonId: activeSeasonId }],
    queryFn: async () => {
      const res = await fetch(`/api/contestants?seasonId=${activeSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!activeSeasonId,
  });

  const { data: questions = [] } = useQuery<BonusQuestion[]>({
    queryKey: ["/api/bonus/questions", { seasonId: activeSeasonId, weekId: selectedWeekId }],
    queryFn: async () => {
      const res = await fetch(`/api/bonus/questions?seasonId=${activeSeasonId}&weekId=${selectedWeekId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!activeSeasonId && !!selectedWeekId,
  });

  const { data: deadlineStatus } = useQuery<{ open: boolean; deadline: string | null }>({
    queryKey: ["/api/bonus/deadline-status", selectedWeekId],
    queryFn: async () => {
      const res = await fetch(`/api/bonus/deadline-status?weekId=${selectedWeekId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedWeekId,
    refetchInterval: 60000,
  });

  const { data: hasSecretData } = useQuery<{ hasSecret: boolean }>({
    queryKey: ["/api/teams", selectedTeamId, "has-secret"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${selectedTeamId}/has-secret`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedTeamId,
  });

  const { data: history = [] } = useQuery<HistoryEntry[]>({
    queryKey: ["/api/bonus/history", selectedTeamId, { seasonId: activeSeasonId }],
    queryFn: async () => {
      const res = await fetch(`/api/bonus/history/${selectedTeamId}?seasonId=${activeSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedTeamId && !!activeSeasonId && isVerified,
  });

  useEffect(() => {
    if (weeks.length > 0 && !selectedWeekId) {
      setSelectedWeekId(weeks[weeks.length - 1].id.toString());
    }
  }, [weeks]);

  useEffect(() => {
    setSelectedTeamId("");
    setIsVerified(false);
    setPasscode("");
    setAnswers({});
    setShowSetPasscode(false);
    setSelectedWeekId("");
  }, [selectedSeasonId]);

  useEffect(() => {
    setIsVerified(false);
    setPasscode("");
    setAnswers({});
    setShowSetPasscode(false);
  }, [selectedTeamId]);

  const isOpen = deadlineStatus?.open ?? true;
  const activeContestants = contestants.filter(c => !c.eliminated);
  const activeSeason = seasons.find(s => s.id.toString() === activeSeasonId);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/teams/${selectedTeamId}/verify-secret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.verified) {
        setLockedSeasonId(selectedSeasonId);
        setIsVerified(true);
        toast({ title: "Verified!" });
      } else {
        toast({ title: "Error", description: "Incorrect passcode.", variant: "destructive" });
      }
    },
  });

  const setSecretMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/teams/${selectedTeamId}/set-secret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: newPasscode,
          ...(hasSecretData?.hasSecret ? { oldPasscode } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set passcode");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeamId, "has-secret"] });
      setShowSetPasscode(false);
      setNewPasscode("");
      setOldPasscode("");
      toast({ title: "Passcode Set!", description: "You can now use your passcode to submit answers." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bonus/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId: parseInt(activeSeasonId),
          weekId: parseInt(selectedWeekId),
          teamId: parseInt(selectedTeamId),
          passcode,
          answers,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bonus/history"] });
      toast({ title: "Submitted!", description: "Your bonus answers have been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateAnswer = (questionId: number, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId.toString()]: value }));
  };

  const getContestantName = (id: string | number) => {
    const c = contestants.find(c => c.id === parseInt(id.toString()));
    return c?.name || `Unknown (#${id})`;
  };

  const computeHistoryPoints = (q: HistoryEntry["questions"][0], answer: any) => {
    if (!q.correctAnswer || !answer) return { points: 0, label: "Pending" };
    if (q.isWager) {
      const wagerAmt = Math.min(Math.max(parseInt(answer.wager) || 0, 0), 50);
      const userAnswer = q.questionType === "contestant"
        ? (answer.answer || "").toString()
        : (answer.answer || "").toString().toLowerCase().trim();
      const correct = q.questionType === "contestant"
        ? q.correctAnswer
        : q.correctAnswer.toLowerCase().trim();
      const isCorrect = userAnswer === correct;
      return { points: isCorrect ? wagerAmt : -wagerAmt, label: isCorrect ? `+${wagerAmt}` : `-${wagerAmt}` };
    }
    if (q.questionType === "contestant") {
      const correct = (answer.answer || "").toString() === q.correctAnswer;
      return { points: correct ? q.points : 0, label: correct ? `+${q.points}` : "0" };
    }
    const userAnswer = (answer.answer || "").toString().toLowerCase().trim();
    const correct = userAnswer === q.correctAnswer.toLowerCase().trim();
    return { points: correct ? q.points : 0, label: correct ? `+${q.points}` : "0" };
  };

  const renderQuestionInput = (q: BonusQuestion) => {
    const baseInput = (() => {
      switch (q.questionType) {
        case "yesno":
          return (
            <RadioGroup
              value={answers[q.id]?.answer || ""}
              onValueChange={(val) => updateAnswer(q.id, { ...answers[q.id], answer: val })}
              className="flex gap-4 ml-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`q${q.id}-yes`} data-testid={`radio-${q.id}-yes`} />
                <Label htmlFor={`q${q.id}-yes`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`q${q.id}-no`} data-testid={`radio-${q.id}-no`} />
                <Label htmlFor={`q${q.id}-no`}>No</Label>
              </div>
            </RadioGroup>
          );
        case "multi":
          return (
            <RadioGroup
              value={answers[q.id]?.answer || ""}
              onValueChange={(val) => updateAnswer(q.id, { ...answers[q.id], answer: val })}
              className="space-y-2 ml-8"
            >
              {(q.optionsJson ? q.optionsJson.split(",").map(o => o.trim()) : []).map(opt => (
                <div key={opt} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt} id={`q${q.id}-${opt}`} data-testid={`radio-${q.id}-${opt}`} />
                  <Label htmlFor={`q${q.id}-${opt}`}>{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          );
        case "number":
          return (
            <div className="ml-8">
              <Input
                type="number"
                value={answers[q.id]?.answer || ""}
                onChange={(e) => updateAnswer(q.id, { ...answers[q.id], answer: e.target.value })}
                placeholder="Enter a number"
                className="w-40"
                data-testid={`input-number-${q.id}`}
              />
            </div>
          );
        case "contestant":
          return (
            <div className="ml-8">
              <Select
                value={answers[q.id]?.answer || ""}
                onValueChange={(val) => updateAnswer(q.id, { ...answers[q.id], answer: val })}
              >
                <SelectTrigger className="w-64" data-testid={`select-contestant-${q.id}`}>
                  <SelectValue placeholder="Select contestant" />
                </SelectTrigger>
                <SelectContent>
                  {activeContestants.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        default:
          return null;
      }
    })();

    return (
      <>
        {baseInput}
        {q.isWager && (
          <div className="flex items-center gap-2 ml-8 mt-2">
            <Label className="text-sm">Wager (0-50):</Label>
            <Input
              type="number"
              min="0"
              max="50"
              value={answers[q.id]?.wager || ""}
              onChange={(e) => updateAnswer(q.id, { ...answers[q.id], wager: e.target.value })}
              className="w-24"
              data-testid={`input-wager-${q.id}`}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold font-['Slackey'] tracking-wide" data-testid="text-page-title">
            Bonus Questions
          </h1>
        </div>

        {!isVerified && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Season &amp; Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm mb-1 block">Season</Label>
                <SeasonSelector
                  seasons={seasons}
                  selectedSeasonId={selectedSeasonId}
                  onSeasonChange={(id) => { setSelectedSeasonId(id); }}
                />
              </div>
              <div>
                <Label className="text-sm mb-1 block">Team</Label>
                <Select
                  value={selectedTeamId}
                  onValueChange={setSelectedTeamId}
                  disabled={!selectedSeasonId}
                >
                  <SelectTrigger data-testid="select-bonus-team">
                    <SelectValue placeholder={!selectedSeasonId ? "Select a season first" : "Select your team"} />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {!isVerified && selectedTeamId && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Team Passcode
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasSecretData?.hasSecret ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Set a passcode for your team to submit answers.</p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      placeholder="Choose a passcode (min 3 chars)"
                      data-testid="input-new-passcode"
                    />
                    <Button
                      onClick={() => setSecretMutation.mutate()}
                      disabled={newPasscode.length < 3 || setSecretMutation.isPending}
                      data-testid="button-set-passcode"
                    >
                      Set
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter team passcode"
                      onKeyDown={(e) => e.key === "Enter" && verifyMutation.mutate()}
                      data-testid="input-verify-passcode"
                    />
                    <Button
                      onClick={() => verifyMutation.mutate()}
                      disabled={!passcode || verifyMutation.isPending}
                      data-testid="button-verify-passcode"
                    >
                      Verify
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto text-xs underline"
                    onClick={() => setShowSetPasscode(!showSetPasscode)}
                    data-testid="button-toggle-reset-passcode"
                  >
                    Reset passcode
                  </Button>
                  {showSetPasscode && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <Input
                        type="password"
                        value={oldPasscode}
                        onChange={(e) => setOldPasscode(e.target.value)}
                        placeholder="Current passcode"
                        data-testid="input-old-passcode"
                      />
                      <Input
                        type="password"
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        placeholder="New passcode (min 3 chars)"
                        data-testid="input-reset-new-passcode"
                      />
                      <Button
                        size="sm"
                        onClick={() => setSecretMutation.mutate()}
                        disabled={newPasscode.length < 3 || !oldPasscode || setSecretMutation.isPending}
                        data-testid="button-reset-passcode"
                      >
                        Update Passcode
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isVerified && (
          <>
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Verified</span>
              <span className="text-sm text-muted-foreground mx-2">|</span>
              <span className="text-sm font-medium" data-testid="text-locked-season">{activeSeason?.name}</span>
              <span className="text-sm text-muted-foreground mx-2">|</span>
              <span className="text-sm font-medium" data-testid="text-locked-team">{allTeams.find(t => t.id === parseInt(selectedTeamId))?.name}</span>
            </div>

            <div className="mb-6">
              <Label className="text-sm mb-1 block">Week</Label>
              <Select value={selectedWeekId} onValueChange={setSelectedWeekId}>
                <SelectTrigger data-testid="select-bonus-week">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((week) => (
                    <SelectItem key={week.id} value={week.id.toString()}>
                      Week {week.weekNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {isVerified && selectedWeekId && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-['Slackey'] tracking-wide">
                  Week {weeks.find(w => w.id === parseInt(selectedWeekId))?.weekNumber} Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isOpen ? (
                  <div className="py-6 text-center">
                    <Clock className="h-8 w-8 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-medium" data-testid="text-deadline-closed">
                      Bonus questions can no longer be submitted for this week's episode.
                    </p>
                  </div>
                ) : (
                  <>
                    {deadlineStatus?.deadline && (
                      <Card className="border-amber-400 bg-amber-50/50">
                        <CardContent className="py-3 flex items-center justify-center gap-2 text-amber-700">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium" data-testid="text-deadline-info">
                            Deadline: {formatDeadlineDisplay(deadlineStatus.deadline)}
                          </span>
                        </CardContent>
                      </Card>
                    )}

                    {questions.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No bonus questions available for this week yet.
                      </div>
                    ) : (
                      <>
                        {questions.map((q, idx) => (
                          <div key={q.id} className="space-y-2 p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-primary min-w-[24px]">{idx + 1}.</span>
                              <span className="font-medium">{q.questionText}</span>
                              <div className="ml-auto flex gap-1 shrink-0">
                                {q.isWager ? (
                                  <Badge variant="outline" className="bg-orange-100 text-orange-800">Wager</Badge>
                                ) : (
                                  <Badge variant="outline">{q.points} pts</Badge>
                                )}
                              </div>
                            </div>
                            {renderQuestionInput(q)}
                          </div>
                        ))}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="w-full inline-block">
                                <Button
                                  onClick={() => submitMutation.mutate()}
                                  disabled={!isOpen || submitMutation.isPending}
                                  className="w-full gap-2"
                                  size="lg"
                                  data-testid="button-submit-bonus"
                                >
                                  <Send className="h-4 w-4" />
                                  {submitMutation.isPending ? "Submitting..." : "Submit Answers"}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {!isOpen && (
                              <TooltipContent>
                                <p>Too slow! The submission deadline has passed for this episode.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-['Slackey'] tracking-wide flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Submission History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {history.map((entry) => {
                    const isExpanded = expandedHistory[entry.weekId] ?? false;
                    return (
                      <div key={entry.weekId} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedHistory(prev => ({ ...prev, [entry.weekId]: !isExpanded }))}
                          data-testid={`button-history-week-${entry.weekNumber}`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Week {entry.weekNumber}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.submittedAt).toLocaleString()}
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {isExpanded && (
                          <div className="border-t p-3">
                            <div className="overflow-x-auto -mx-3 px-3">
                              <table className="w-full text-sm min-w-[550px]">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2 pr-4 whitespace-nowrap">Question</th>
                                    <th className="text-left py-2 pr-4 whitespace-nowrap">Your Answer</th>
                                    <th className="text-left py-2 pr-4 whitespace-nowrap">Wager</th>
                                    <th className="text-left py-2 pr-4 whitespace-nowrap">Correct Answer</th>
                                    <th className="text-right py-2 whitespace-nowrap">Points</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entry.questions.map((q) => {
                                    const answer = entry.answers[q.id.toString()];
                                    let displayAnswer = "-";
                                    if (answer) {
                                      if (q.questionType === "contestant") {
                                        displayAnswer = getContestantName(answer.answer);
                                      } else {
                                        displayAnswer = answer.answer || "-";
                                      }
                                    }
                                    const displayCorrect = q.correctAnswer
                                      ? q.questionType === "contestant"
                                        ? getContestantName(q.correctAnswer)
                                        : q.correctAnswer
                                      : "Pending";
                                    const result = computeHistoryPoints(q, answer);
                                    return (
                                      <tr key={q.id} className="border-b last:border-0">
                                        <td className="py-2 pr-4 whitespace-nowrap">{q.questionText}</td>
                                        <td className="py-2 pr-4 whitespace-nowrap">{displayAnswer}</td>
                                        <td className="py-2 pr-4 whitespace-nowrap">{q.isWager && answer?.wager ? answer.wager : "n/a"}</td>
                                        <td className="py-2 pr-4 whitespace-nowrap">{displayCorrect}</td>
                                        <td className="py-2 text-right whitespace-nowrap">
                                          <Badge variant={result.points > 0 ? "default" : result.points < 0 ? "destructive" : "outline"}>
                                            {result.label}
                                          </Badge>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  <tr className="font-semibold border-t-2">
                                    <td className="py-2 pr-4 whitespace-nowrap" colSpan={4}>Total Bonus Points</td>
                                    <td className="py-2 text-right whitespace-nowrap">
                                      {(() => {
                                        const total = entry.questions.reduce((sum, q) => {
                                          const answer = entry.answers[q.id.toString()];
                                          const result = computeHistoryPoints(q, answer);
                                          return sum + result.points;
                                        }, 0);
                                        return (
                                          <Badge variant={total > 0 ? "default" : total < 0 ? "destructive" : "outline"}>
                                            {total > 0 ? "+" : ""}{total}
                                          </Badge>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
