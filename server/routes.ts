import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeamSchema, insertContestantSchema, insertWeekSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Teams API
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const parsed = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(parsed);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.patch("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertTeamSchema.partial().parse(req.body);
      const team = await storage.updateTeam(id, parsed);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTeam(id);
      if (!deleted) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team" });
    }
  });

  // Contestants API
  app.get("/api/contestants", async (req, res) => {
    try {
      const contestants = await storage.getContestants();
      res.json(contestants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contestants" });
    }
  });

  app.get("/api/contestants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contestant = await storage.getContestant(id);
      if (!contestant) {
        return res.status(404).json({ error: "Contestant not found" });
      }
      res.json(contestant);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contestant" });
    }
  });

  app.get("/api/teams/:teamId/contestants", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const contestants = await storage.getContestantsByTeam(teamId);
      res.json(contestants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contestants" });
    }
  });

  app.post("/api/contestants", async (req, res) => {
    try {
      const parsed = insertContestantSchema.parse(req.body);
      const contestant = await storage.createContestant(parsed);
      res.status(201).json(contestant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create contestant" });
    }
  });

  app.patch("/api/contestants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertContestantSchema.partial().parse(req.body);
      const contestant = await storage.updateContestant(id, parsed);
      if (!contestant) {
        return res.status(404).json({ error: "Contestant not found" });
      }
      res.json(contestant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update contestant" });
    }
  });

  app.delete("/api/contestants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContestant(id);
      if (!deleted) {
        return res.status(404).json({ error: "Contestant not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contestant" });
    }
  });

  // Weeks API
  app.get("/api/weeks", async (req, res) => {
    try {
      const weeks = await storage.getWeeks();
      res.json(weeks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weeks" });
    }
  });

  app.post("/api/weeks", async (req, res) => {
    try {
      const parsed = insertWeekSchema.parse(req.body);
      const week = await storage.createWeek(parsed);
      res.status(201).json(week);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create week" });
    }
  });

  app.delete("/api/weeks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWeek(id);
      if (!deleted) {
        return res.status(404).json({ error: "Week not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete week" });
    }
  });

  // Scores API
  app.get("/api/scores", async (req, res) => {
    try {
      const scores = await storage.getContestantScores();
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  app.get("/api/weeks/:weekId/scores", async (req, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const scores = await storage.getContestantScoresByWeek(weekId);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  app.post("/api/scores", async (req, res) => {
    try {
      const { contestantId, weekId, points } = req.body;
      const score = await storage.upsertContestantScore({ contestantId, weekId, points });
      res.json(score);
    } catch (error) {
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  // Bulk save scores
  app.post("/api/weeks/:weekId/scores", async (req, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const { scores, bonuses } = req.body as { 
        scores: { contestantId: number; points: number }[]; 
        bonuses: { teamId: number; bonus: number }[] 
      };
      
      const savedScores = await Promise.all(
        scores.map(s => storage.upsertContestantScore({ 
          contestantId: s.contestantId, 
          weekId, 
          points: s.points 
        }))
      );
      
      const savedBonuses = await Promise.all(
        bonuses.map(b => storage.upsertTeamBonus({ 
          teamId: b.teamId, 
          weekId, 
          bonus: b.bonus 
        }))
      );
      
      res.json({ scores: savedScores, bonuses: savedBonuses });
    } catch (error) {
      res.status(500).json({ error: "Failed to save scores" });
    }
  });

  // Team Bonuses API
  app.get("/api/bonuses", async (req, res) => {
    try {
      const bonuses = await storage.getTeamBonuses();
      res.json(bonuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bonuses" });
    }
  });

  app.get("/api/weeks/:weekId/bonuses", async (req, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const bonuses = await storage.getTeamBonusesByWeek(weekId);
      res.json(bonuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bonuses" });
    }
  });

  // Dashboard data - aggregated view
  app.get("/api/dashboard", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      const contestants = await storage.getContestants();
      const weeks = await storage.getWeeks();
      const allScores = await storage.getContestantScores();
      const allBonuses = await storage.getTeamBonuses();

      // Calculate team totals
      const teamTotals = teams.map(team => {
        const teamContestants = contestants.filter(c => c.teamId === team.id);
        const contestantPoints = allScores
          .filter(s => teamContestants.some(c => c.id === s.contestantId))
          .reduce((sum, s) => sum + s.points, 0);
        const bonusPoints = allBonuses
          .filter(b => b.teamId === team.id)
          .reduce((sum, b) => sum + b.bonus, 0);
        
        return {
          ...team,
          totalPoints: contestantPoints + bonusPoints,
          contestants: teamContestants,
        };
      });

      // Calculate contestant totals
      const contestantTotals = contestants.map(contestant => {
        const points = allScores
          .filter(s => s.contestantId === contestant.id)
          .reduce((sum, s) => sum + s.points, 0);
        const team = teams.find(t => t.id === contestant.teamId);
        
        return {
          ...contestant,
          totalPoints: points,
          teamName: team?.name,
        };
      });

      // Calculate weekly progression for chart
      const weeklyData = weeks.map(week => {
        const weekScores = allScores.filter(s => s.weekId === week.id);
        const weekBonuses = allBonuses.filter(b => b.weekId === week.id);
        
        const dataPoint: Record<string, string | number> = { week: `Week ${week.weekNumber}` };
        
        teams.forEach(team => {
          const teamContestants = contestants.filter(c => c.teamId === team.id);
          const contestantPoints = weekScores
            .filter(s => teamContestants.some(c => c.id === s.contestantId))
            .reduce((sum, s) => sum + s.points, 0);
          const bonus = weekBonuses.find(b => b.teamId === team.id)?.bonus || 0;
          dataPoint[team.name] = contestantPoints + bonus;
        });
        
        return dataPoint;
      });

      // Calculate cumulative totals for chart
      const cumulativeData = weeklyData.map((weekData, index) => {
        const cumulative: Record<string, string | number> = { week: weekData.week };
        teams.forEach(team => {
          let total = 0;
          for (let i = 0; i <= index; i++) {
            total += (weeklyData[i][team.name] as number) || 0;
          }
          cumulative[team.name] = total;
        });
        return cumulative;
      });

      res.json({
        teams: teamTotals,
        contestants: contestantTotals,
        weeks,
        weeklyData: cumulativeData,
        teamNames: teams.map(t => t.name),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  return httpServer;
}
