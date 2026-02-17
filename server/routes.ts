import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeamSchema, insertContestantSchema, insertWeekSchema, insertSeasonSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seasons API
  app.get("/api/seasons", async (req, res) => {
    try {
      const seasons = await storage.getSeasons();
      res.json(seasons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seasons" });
    }
  });

  app.get("/api/seasons/latest", async (req, res) => {
    try {
      const season = await storage.getLatestSeason();
      res.json(season || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest season" });
    }
  });

  app.get("/api/seasons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const season = await storage.getSeason(id);
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }
      res.json(season);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch season" });
    }
  });

  app.post("/api/seasons", async (req, res) => {
    try {
      const parsed = insertSeasonSchema.parse(req.body);
      const season = await storage.createSeason(parsed);
      res.status(201).json(season);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create season" });
    }
  });

  app.patch("/api/seasons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertSeasonSchema.partial().parse(req.body);
      const season = await storage.updateSeason(id, parsed);
      if (!season) {
        return res.status(404).json({ error: "Season not found" });
      }
      res.json(season);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update season" });
    }
  });

  app.delete("/api/seasons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSeason(id);
      if (!deleted) {
        return res.status(404).json({ error: "Season not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete season" });
    }
  });

  // Teams API
  app.get("/api/teams", async (req, res) => {
    try {
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined;
      const teams = await storage.getTeams(seasonId);
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
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined;
      const contestants = await storage.getContestants(seasonId);
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
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined;
      const weeks = await storage.getWeeks(seasonId);
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
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined;
      if (seasonId) {
        const scores = await storage.getContestantScoresBySeason(seasonId);
        return res.json(scores);
      }
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
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined;
      if (seasonId) {
        const bonuses = await storage.getTeamBonusesBySeason(seasonId);
        return res.json(bonuses);
      }
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

  // Dashboard data - aggregated view with season filtering
  app.get("/api/dashboard", async (req, res) => {
    try {
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined;
      
      let resolvedSeasonId = seasonId;
      if (!resolvedSeasonId) {
        const latest = await storage.getLatestSeason();
        resolvedSeasonId = latest?.id;
      }

      const teams = resolvedSeasonId ? await storage.getTeams(resolvedSeasonId) : await storage.getTeams();
      const contestants = resolvedSeasonId ? await storage.getContestants(resolvedSeasonId) : await storage.getContestants();
      const weeks = resolvedSeasonId ? await storage.getWeeks(resolvedSeasonId) : await storage.getWeeks();
      const allScores = resolvedSeasonId ? await storage.getContestantScoresBySeason(resolvedSeasonId) : await storage.getContestantScores();
      const allBonuses = resolvedSeasonId ? await storage.getTeamBonusesBySeason(resolvedSeasonId) : await storage.getTeamBonuses();

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

      const weeklyContestantScores: Record<number, { contestantId: number; points: number }[]> = {};
      weeks.forEach(week => {
        weeklyContestantScores[week.id] = allScores
          .filter(s => s.weekId === week.id)
          .map(s => ({ contestantId: s.contestantId, points: s.points }));
      });

      res.json({
        teams: teamTotals,
        contestants: contestantTotals,
        weeks,
        weeklyData: cumulativeData,
        teamNames: teams.map(t => t.name),
        teamImages: teams.reduce((acc, t) => { acc[t.name] = t.imageUrl || ""; return acc; }, {} as Record<string, string>),
        weeklyContestantScores,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  return httpServer;
}
