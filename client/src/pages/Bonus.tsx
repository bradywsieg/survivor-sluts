import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SeasonSelector from "@/components/SeasonSelector";
import { useSeason } from "@/hooks/use-season";
import { HelpCircle, Lock, Send, History, ChevronDown, ChevronUp } from "lucide-react";
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
  }[];
}

export default function Bonus() {
  const { toast } = useToast();
  const { seasons, selectedSeasonId, setSelectedSeasonId } = useSeason();
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [passcode, setPasscode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showSetPasscode, setShowSetPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState("");
  const [oldPasscode, setOldPasscode] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});

  const { data: weeks = [] } = useQuery<Week[]>({
    queryKey: ["/api/weeks", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const res = await fetch(`/api/weeks?seasonId=${selectedSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const res = await fetch(`/api/teams?seasonId=${selectedSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId,
  });

  const { data: contestants = [] } = useQuery<Contestant[]>({
    queryKey: ["/api/contestants", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const res = await fetch(`/api/contestants?seasonId=${selectedSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId,
  });

  const { data: questions = [] } = useQuery<BonusQuestion[]>({
    queryKey: ["/api/bonus/questions", { seasonId: selectedSeasonId, weekId: selectedWeekId }],
    queryFn: async () => {
      const res = await fetch(`/api/bonus/questions?seasonId=${selectedSeasonId}&weekId=${selectedWeekId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId && !!selectedWeekId,
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
    queryKey: ["/api/bonus/history", selectedTeamId, { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const res = await fetch(`/api/bonus/history/${selectedTeamId}?seasonId=${selectedSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedTeamId && !!selectedSeasonId && isVerified,
  });

  useEffect(() => {
    if (weeks.length > 0 && !selectedWeekId) {
      setSelectedWeekId(weeks[weeks.length - 1].id.toString());
    }
  }, [weeks]);

  useEffect(() => {
    setIsVerified(false);
    setPasscode("");
    setAnswers({});
    setShowSetPasscode(false);
  }, [selectedTeamId]);

  const isOpen = deadlineStatus?.open ?? true;
  const activeContestants = contestants.filter(c => !c.eliminated);

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
          seasonId: parseInt(selectedSeasonId),
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
    if (q.questionType === "wager") {
      const wagerAmt = Math.min(Math.max(parseInt(answer.wager) || 0, 0), 50);
      const correct = (answer.answer || "").toString().toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
      return { points: correct ? wagerAmt : -wagerAmt, label: correct ? `+${wagerAmt}` : `-${wagerAmt}` };
    }
    const userAnswer = (answer.answer || "").toString().toLowerCase().trim();
    const correct = userAnswer === q.correctAnswer.toLowerCase().trim();
    return { points: correct ? q.points : 0, label: correct ? `+${q.points}` : "0" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Slackey'] tracking-wide" data-testid="text-page-title">
              Bonus Questions
            </h1>
          </div>
          <SeasonSelector
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            onSeasonChange={(id) => { setSelectedSeasonId(id); setSelectedWeekId(""); }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
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
          <div>
            <Label className="text-sm mb-1 block">Team</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger data-testid="select-bonus-team">
                <SelectValue placeholder="Select team" />
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
        </div>

        {selectedTeamId && (
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
              ) : !isVerified ? (
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
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Lock className="h-4 w-4" />
                  Verified
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isVerified && selectedWeekId && (
          <>
            {!isOpen && (
              <Card className="mb-6 border-destructive">
                <CardContent className="py-4">
                  <p className="text-destructive font-medium text-center" data-testid="text-deadline-closed">
                    Sorry, bonus questions can no longer be submitted for this week's episode. Do better.
                  </p>
                </CardContent>
              </Card>
            )}

            {isOpen && deadlineStatus?.deadline && (
              <Card className="mb-6 border-amber-400">
                <CardContent className="py-3 flex items-center justify-center gap-2 text-amber-700">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium" data-testid="text-deadline-info">
                    Deadline: {new Date(deadlineStatus.deadline).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            )}

            {questions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No bonus questions available for this week yet.
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg font-['Slackey'] tracking-wide">
                    Week {weeks.find(w => w.id === parseInt(selectedWeekId))?.weekNumber} Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="space-y-2 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-primary min-w-[24px]">{idx + 1}.</span>
                        <span className="font-medium">{q.questionText}</span>
                        {q.questionType !== "wager" && (
                          <Badge variant="outline" className="ml-auto shrink-0">{q.points} pts</Badge>
                        )}
                        {q.questionType === "wager" && (
                          <Badge variant="outline" className="ml-auto shrink-0">Wager</Badge>
                        )}
                      </div>

                      {q.questionType === "yesno" && (
                        <RadioGroup
                          value={answers[q.id]?.answer || ""}
                          onValueChange={(val) => updateAnswer(q.id, { answer: val })}
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
                      )}

                      {q.questionType === "multi" && (
                        <RadioGroup
                          value={answers[q.id]?.answer || ""}
                          onValueChange={(val) => updateAnswer(q.id, { answer: val })}
                          className="space-y-2 ml-8"
                        >
                          {(q.optionsJson ? q.optionsJson.split(",").map(o => o.trim()) : []).map(opt => (
                            <div key={opt} className="flex items-center space-x-2">
                              <RadioGroupItem value={opt} id={`q${q.id}-${opt}`} data-testid={`radio-${q.id}-${opt}`} />
                              <Label htmlFor={`q${q.id}-${opt}`}>{opt}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {q.questionType === "number" && (
                        <div className="ml-8">
                          <Input
                            type="number"
                            value={answers[q.id]?.answer || ""}
                            onChange={(e) => updateAnswer(q.id, { answer: e.target.value })}
                            placeholder="Enter a number"
                            className="w-40"
                            data-testid={`input-number-${q.id}`}
                          />
                        </div>
                      )}

                      {q.questionType === "wager" && (
                        <div className="ml-8 space-y-2">
                          <RadioGroup
                            value={answers[q.id]?.answer || ""}
                            onValueChange={(val) => updateAnswer(q.id, { ...answers[q.id], answer: val })}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`q${q.id}-wager-yes`} data-testid={`radio-${q.id}-wager-yes`} />
                              <Label htmlFor={`q${q.id}-wager-yes`}>Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`q${q.id}-wager-no`} data-testid={`radio-${q.id}-wager-no`} />
                              <Label htmlFor={`q${q.id}-wager-no`}>No</Label>
                            </div>
                          </RadioGroup>
                          <div className="flex items-center gap-2">
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
                        </div>
                      )}

                      {q.questionType === "contestant" && (
                        <div className="ml-8">
                          <Select
                            value={answers[q.id]?.answer || ""}
                            onValueChange={(val) => updateAnswer(q.id, { answer: val })}
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
                      )}
                    </div>
                  ))}

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
                </CardContent>
              </Card>
            )}

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
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-1 pr-2">Question</th>
                                  <th className="text-left py-1 pr-2">Your Answer</th>
                                  <th className="text-left py-1 pr-2">Correct Answer</th>
                                  <th className="text-right py-1">Points</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.questions.map((q) => {
                                  const answer = entry.answers[q.id.toString()];
                                  const displayAnswer = answer
                                    ? q.questionType === "contestant"
                                      ? getContestantName(answer.answer)
                                      : q.questionType === "wager"
                                      ? `${answer.answer} (wager: ${answer.wager})`
                                      : answer.answer
                                    : "-";
                                  const displayCorrect = q.correctAnswer
                                    ? q.questionType === "contestant"
                                      ? getContestantName(q.correctAnswer)
                                      : q.correctAnswer
                                    : "Pending";
                                  const result = computeHistoryPoints(q, answer);
                                  return (
                                    <tr key={q.id} className="border-b last:border-0">
                                      <td className="py-2 pr-2">{q.questionText}</td>
                                      <td className="py-2 pr-2">{displayAnswer}</td>
                                      <td className="py-2 pr-2">{displayCorrect}</td>
                                      <td className="py-2 text-right">
                                        <Badge variant={result.points > 0 ? "default" : result.points < 0 ? "destructive" : "outline"}>
                                          {result.label}
                                        </Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
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
