import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Copy, Pencil, Trash2, CheckCircle, HelpCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { adminApiRequest } from "@/lib/adminApi";

interface WeekWithDeadline {
  id: number;
  weekNumber: number;
  bonusDeadline: string | null;
}

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
}

interface Contestant {
  id: number;
  name: string;
  eliminated: boolean;
}

interface BonusSubmission {
  id: number;
  seasonId: number;
  weekId: number;
  teamId: number;
  answersJson: string;
  submittedAt: string;
}

const QUESTION_TYPES = [
  { value: "yesno", label: "Yes / No" },
  { value: "multi", label: "Multiple Choice" },
  { value: "number", label: "Numerical" },
  { value: "wager", label: "Wager" },
  { value: "contestant", label: "Contestant" },
];

export default function AdminBonusTab({ selectedSeasonId, weeks }: { selectedSeasonId: string; weeks: Week[] }) {
  const { toast } = useToast();
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [bonusSubTab, setBonusSubTab] = useState<"setup" | "grade">("setup");
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BonusQuestion | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("yesno");
  const [questionPoints, setQuestionPoints] = useState("10");
  const [questionOptions, setQuestionOptions] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});
  const [correctWagers, setCorrectWagers] = useState<Record<number, string>>({});
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");

  useEffect(() => {
    if (weeks.length > 0 && !selectedWeekId) {
      setSelectedWeekId(weeks[weeks.length - 1].id.toString());
    }
  }, [weeks.length]);

  const { data: questions = [] } = useQuery<BonusQuestion[]>({
    queryKey: ["/api/admin/bonus/questions", { seasonId: selectedSeasonId, weekId: selectedWeekId }],
    queryFn: async () => {
      const res = await adminApiRequest("GET", `/api/admin/bonus/questions?seasonId=${selectedSeasonId}&weekId=${selectedWeekId}`);
      return res.json();
    },
    enabled: !!selectedSeasonId && !!selectedWeekId,
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

  const { data: submissions = [] } = useQuery<BonusSubmission[]>({
    queryKey: ["/api/admin/bonus/submissions", { seasonId: selectedSeasonId, weekId: selectedWeekId }],
    queryFn: async () => {
      const res = await adminApiRequest("GET", `/api/admin/bonus/submissions?seasonId=${selectedSeasonId}&weekId=${selectedWeekId}`);
      return res.json();
    },
    enabled: !!selectedSeasonId && !!selectedWeekId && bonusSubTab === "grade",
  });

  const { data: weekDetail } = useQuery<WeekWithDeadline>({
    queryKey: ["/api/weeks", selectedWeekId],
    queryFn: async () => {
      const res = await fetch(`/api/weeks/${selectedWeekId}`);
      if (!res.ok) throw new Error("Failed to fetch week");
      return res.json();
    },
    enabled: !!selectedWeekId,
  });

  useEffect(() => {
    if (weekDetail?.bonusDeadline) {
      const dt = new Date(weekDetail.bonusDeadline);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      const hours = String(dt.getHours()).padStart(2, "0");
      const mins = String(dt.getMinutes()).padStart(2, "0");
      setDeadlineDate(`${year}-${month}-${day}`);
      setDeadlineTime(`${hours}:${mins}`);
    } else {
      setDeadlineDate("");
      setDeadlineTime("");
    }
  }, [weekDetail, selectedWeekId]);

  const activeContestants = contestants.filter(c => !c.eliminated);

  useEffect(() => {
    if (questions.length > 0) {
      const answers: Record<number, string> = {};
      questions.forEach(q => {
        if (q.correctAnswer) answers[q.id] = q.correctAnswer;
      });
      setCorrectAnswers(answers);
    }
  }, [questions]);

  const createQuestionMutation = useMutation({
    mutationFn: (data: any) => adminApiRequest("POST", "/api/admin/bonus/questions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bonus/questions"] });
      toast({ title: "Question Created" });
      closeQuestionDialog();
    },
    onError: () => toast({ title: "Error", description: "Failed to create question.", variant: "destructive" }),
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => adminApiRequest("PATCH", `/api/admin/bonus/questions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bonus/questions"] });
      toast({ title: "Question Updated" });
      closeQuestionDialog();
    },
    onError: () => toast({ title: "Error", description: "Failed to update question.", variant: "destructive" }),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => adminApiRequest("DELETE", `/api/admin/bonus/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bonus/questions"] });
      toast({ title: "Question Deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete question.", variant: "destructive" }),
  });

  const copyLastWeekMutation = useMutation({
    mutationFn: () => adminApiRequest("POST", `/api/admin/bonus/${selectedSeasonId}/${selectedWeekId}/copy-last-week`, {}),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bonus/questions"] });
      toast({ title: "Copied!", description: `Copied ${data.count} questions from last week` });
    },
    onError: (error: any) => {
      const msg = error.message?.includes("already exist") ? "Questions already exist for this week" : "Failed to copy questions";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const saveCorrectAnswerMutation = useMutation({
    mutationFn: ({ id, correctAnswer }: { id: number; correctAnswer: string }) =>
      adminApiRequest("PATCH", `/api/admin/bonus/questions/${id}`, { correctAnswer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bonus/questions"] });
      toast({ title: "Answer Saved" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save answer.", variant: "destructive" }),
  });

  const gradeMutation = useMutation({
    mutationFn: () => adminApiRequest("POST", "/api/admin/bonus/grade", {
      seasonId: parseInt(selectedSeasonId),
      weekId: parseInt(selectedWeekId),
    }),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/bonuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Graded!", description: `Scored ${data.teamsScored} teams` });
    },
    onError: () => toast({ title: "Error", description: "Failed to grade.", variant: "destructive" }),
  });

  const saveDeadlineMutation = useMutation({
    mutationFn: (deadline: string | null) =>
      adminApiRequest("PATCH", "/api/admin/bonus/deadline", {
        weekId: parseInt(selectedWeekId),
        deadline,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weeks", selectedWeekId] });
      toast({ title: "Deadline Saved" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save deadline.", variant: "destructive" }),
  });

  const handleSaveDeadline = () => {
    if (deadlineDate && deadlineTime) {
      const deadline = new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString();
      saveDeadlineMutation.mutate(deadline);
    } else {
      saveDeadlineMutation.mutate(null);
    }
  };

  const handleClearDeadline = () => {
    setDeadlineDate("");
    setDeadlineTime("");
    saveDeadlineMutation.mutate(null);
  };

  const closeQuestionDialog = () => {
    setQuestionDialogOpen(false);
    setEditingQuestion(null);
    setQuestionText("");
    setQuestionType("yesno");
    setQuestionPoints("10");
    setQuestionOptions("");
  };

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionText("");
    setQuestionType("yesno");
    setQuestionPoints("10");
    setQuestionOptions("");
    setQuestionDialogOpen(true);
  };

  const openEditQuestion = (q: BonusQuestion) => {
    setEditingQuestion(q);
    setQuestionText(q.questionText);
    setQuestionType(q.questionType);
    setQuestionPoints(q.points.toString());
    setQuestionOptions(q.optionsJson || "");
    setQuestionDialogOpen(true);
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !selectedSeasonId || !selectedWeekId) return;
    const data = {
      seasonId: parseInt(selectedSeasonId),
      weekId: parseInt(selectedWeekId),
      questionText: questionText.trim(),
      questionType,
      points: parseInt(questionPoints) || 0,
      optionsJson: questionType === "multi" ? questionOptions : null,
    };
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "yesno": return "bg-blue-100 text-blue-800";
      case "multi": return "bg-purple-100 text-purple-800";
      case "number": return "bg-green-100 text-green-800";
      case "wager": return "bg-orange-100 text-orange-800";
      case "contestant": return "bg-teal-100 text-teal-800";
      default: return "";
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="text-xl font-['Slackey'] tracking-wide flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Bonus Questions
          </CardTitle>
          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            <Select value={selectedWeekId} onValueChange={setSelectedWeekId}>
              <SelectTrigger className="w-32" data-testid="select-bonus-week">
                <SelectValue placeholder="Week" />
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
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={bonusSubTab === "setup" ? "default" : "outline"}
              size="sm"
              onClick={() => setBonusSubTab("setup")}
              data-testid="button-bonus-subtab-setup"
            >
              Setup
            </Button>
            <Button
              variant={bonusSubTab === "grade" ? "default" : "outline"}
              size="sm"
              onClick={() => setBonusSubTab("grade")}
              data-testid="button-bonus-subtab-grade"
            >
              Grade
            </Button>
          </div>

          {bonusSubTab === "setup" && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={openCreateQuestion} className="gap-2" data-testid="button-add-bonus-question">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyLastWeekMutation.mutate()}
                  disabled={copyLastWeekMutation.isPending}
                  className="gap-2"
                  data-testid="button-copy-last-week"
                >
                  <Copy className="h-4 w-4" />
                  Copy Last Week Questions
                </Button>
              </div>

              <div className="flex items-end gap-3 p-4 rounded-lg border bg-muted/50 flex-wrap">
                <Clock className="h-5 w-5 text-muted-foreground mb-2" />
                <div className="space-y-1">
                  <Label htmlFor="deadline-date" className="text-sm font-medium">Submission Deadline</Label>
                  <Input
                    id="deadline-date"
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-40"
                    data-testid="input-deadline-date"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="deadline-time" className="text-sm font-medium">Time</Label>
                  <Input
                    id="deadline-time"
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="w-32"
                    data-testid="input-deadline-time"
                  />
                </div>
                <Button
                  onClick={handleSaveDeadline}
                  disabled={saveDeadlineMutation.isPending}
                  size="sm"
                  data-testid="button-save-deadline"
                >
                  Save Deadline
                </Button>
                {weekDetail?.bonusDeadline && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearDeadline}
                    disabled={saveDeadlineMutation.isPending}
                    data-testid="button-clear-deadline"
                  >
                    Clear
                  </Button>
                )}
                {weekDetail?.bonusDeadline && (
                  <Badge variant="secondary" className="ml-auto" data-testid="badge-current-deadline">
                    Current: {new Date(weekDetail.bonusDeadline).toLocaleString()}
                  </Badge>
                )}
              </div>

              {questions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No bonus questions for this week yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((q, idx) => (
                      <TableRow key={q.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="max-w-xs truncate">{q.questionText}</TableCell>
                        <TableCell>
                          <Badge className={getTypeBadgeColor(q.questionType)} variant="outline">
                            {QUESTION_TYPES.find(t => t.value === q.questionType)?.label || q.questionType}
                          </Badge>
                        </TableCell>
                        <TableCell>{q.questionType === "wager" ? "Wager" : q.points}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditQuestion(q)} data-testid={`button-edit-question-${q.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteQuestionMutation.mutate(q.id)} data-testid={`button-delete-question-${q.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {bonusSubTab === "grade" && (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No questions to grade for this week.
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Set Correct Answers</h3>
                    {questions.map((q, idx) => (
                      <div key={q.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium text-sm min-w-[24px]">{idx + 1}.</span>
                        <span className="flex-1 text-sm">{q.questionText}</span>
                        <div className="w-48">
                          {q.questionType === "yesno" || q.questionType === "wager" ? (
                            <Select
                              value={correctAnswers[q.id] || ""}
                              onValueChange={(val) => setCorrectAnswers(prev => ({ ...prev, [q.id]: val }))}
                            >
                              <SelectTrigger data-testid={`select-correct-${q.id}`}>
                                <SelectValue placeholder="Answer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : q.questionType === "contestant" ? (
                            <Select
                              value={correctAnswers[q.id] || ""}
                              onValueChange={(val) => setCorrectAnswers(prev => ({ ...prev, [q.id]: val }))}
                            >
                              <SelectTrigger data-testid={`select-correct-${q.id}`}>
                                <SelectValue placeholder="Contestant" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeContestants.map(c => (
                                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : q.questionType === "multi" ? (
                            <Select
                              value={correctAnswers[q.id] || ""}
                              onValueChange={(val) => setCorrectAnswers(prev => ({ ...prev, [q.id]: val }))}
                            >
                              <SelectTrigger data-testid={`select-correct-${q.id}`}>
                                <SelectValue placeholder="Option" />
                              </SelectTrigger>
                              <SelectContent>
                                {(q.optionsJson ? q.optionsJson.split(",").map(o => o.trim()) : []).map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={correctAnswers[q.id] || ""}
                              onChange={(e) => setCorrectAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Correct answer"
                              data-testid={`input-correct-${q.id}`}
                            />
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (correctAnswers[q.id]) {
                              saveCorrectAnswerMutation.mutate({ id: q.id, correctAnswer: correctAnswers[q.id] });
                            }
                          }}
                          disabled={!correctAnswers[q.id]}
                          data-testid={`button-save-correct-${q.id}`}
                        >
                          Save
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Submissions ({submissions.length} teams)</h3>
                      <Button
                        onClick={() => gradeMutation.mutate()}
                        disabled={gradeMutation.isPending}
                        className="gap-2"
                        data-testid="button-score-teams"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Score Teams
                      </Button>
                    </div>
                    {submissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No submissions yet for this week.</p>
                    ) : (
                      <div className="space-y-2">
                        {submissions.map(sub => {
                          const team = teams.find(t => t.id === sub.teamId);
                          return (
                            <div key={sub.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                              <Badge variant="outline">{team?.name || `Team ${sub.teamId}`}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Submitted {new Date(sub.submittedAt).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={questionDialogOpen} onOpenChange={(open) => { if (!open) closeQuestionDialog(); else setQuestionDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Slackey'] text-xl tracking-wide">
              {editingQuestion ? "Edit Question" : "New Bonus Question"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuestionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">Question</Label>
              <Input
                id="questionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your bonus question"
                data-testid="input-question-text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionType">Type</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger data-testid="select-question-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {questionType !== "wager" && (
              <div className="space-y-2">
                <Label htmlFor="questionPoints">Points</Label>
                <Input
                  id="questionPoints"
                  type="number"
                  value={questionPoints}
                  onChange={(e) => setQuestionPoints(e.target.value)}
                  data-testid="input-question-points"
                />
              </div>
            )}
            {questionType === "multi" && (
              <div className="space-y-2">
                <Label htmlFor="questionOptions">Options (comma separated)</Label>
                <Input
                  id="questionOptions"
                  value={questionOptions}
                  onChange={(e) => setQuestionOptions(e.target.value)}
                  placeholder="Option A, Option B, Option C"
                  data-testid="input-question-options"
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeQuestionDialog}>Cancel</Button>
              <Button
                type="submit"
                disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                data-testid="button-submit-question"
              >
                {editingQuestion ? "Save Changes" : "Create Question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
