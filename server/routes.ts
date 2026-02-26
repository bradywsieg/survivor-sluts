import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeamSchema, insertContestantSchema, insertWeekSchema, insertSeasonSchema, insertTribeSchema, insertBonusQuestionSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

const ADMIN_PIN = "1911";

function requirePin(req: Request, res: Response, next: NextFunction) {
  const pin = req.headers["x-commissioner-pin"] as string;
  if (pin === ADMIN_PIN) {
    return next();
  }
  return res.status(401).json({ error: "Invalid PIN" });
}

const defaultEvents: { eventKey: string; eventName: string; points: number }[] = [
  { eventKey: "1st-place", eventName: "1st Place", points: 100 },
  { eventKey: "2nd-place", eventName: "2nd Place", points: 60 },
  { eventKey: "3rd-place", eventName: "3rd Place", points: 60 },
  { eventKey: "4th-place", eventName: "4th Place", points: 40 },
  { eventKey: "5th-place", eventName: "5th Place", points: 40 },
  { eventKey: "6th-place", eventName: "6th Place", points: 30 },
  { eventKey: "7th-place", eventName: "7th Place", points: 20 },
  { eventKey: "8th-place", eventName: "8th Place", points: 20 },
  { eventKey: "9th-place", eventName: "9th Place", points: 15 },
  { eventKey: "10th-place", eventName: "10th Place", points: 15 },
  { eventKey: "gains-any-advantage-has-to-be-activated-other-than-idol", eventName: "Gains any advantage (has to be activated) other than idol", points: 10 },
  { eventKey: "gains-idol-has-to-be-activated", eventName: "Gains idol (has to be activated)", points: 10 },
  { eventKey: "exits-due-to-healthinjury-before-merge", eventName: "Exits due to health/injury before merge", points: -10 },
  { eventKey: "exits-voluntarily", eventName: "Exits voluntarily", points: -25 },
  { eventKey: "kicked-off-with-idol", eventName: "Kicked off with idol", points: -10 },
  { eventKey: "places-fake-idol", eventName: "Places fake idol", points: 10 },
  { eventKey: "plays-fake-idol", eventName: "Plays fake idol", points: -5 },
  { eventKey: "someone-else-plays-your-fake-idol", eventName: "Someone else plays your fake idol", points: 15 },
  { eventKey: "wins-first-individual-immunity-challenge", eventName: "Wins first individual immunity challenge", points: 15 },
  { eventKey: "wins-2nd-individual-immunity-challenge", eventName: "Wins 2nd individual immunity challenge", points: 10 },
  { eventKey: "wins-3rd-individual-immunity-challenge", eventName: "Wins 3rd individual immunity challenge", points: 10 },
  { eventKey: "wins-final-individual-immunity-challenge", eventName: "Wins final individual immunity challenge", points: 15 },
  { eventKey: "wins-other-individual-immunity-challenge", eventName: "Wins other individual immunity challenge", points: 10 },
  { eventKey: "wins-mergatory-individual-immunity-challenge", eventName: "Wins Mergatory Individual Immunity Challenge", points: 10 },
  { eventKey: "gives-immunity-either-idol-or-individual-immunity-necklace-away", eventName: "Gives immunity (either idol or individual immunity necklace) away", points: 15 },
  { eventKey: "plays-idol-and-person-it-is-played-for-gets-zero-votes-including-self", eventName: "Plays idol and person it is played for gets zero votes (including self)", points: -5 },
  { eventKey: "advances-after-being-involved-in-tie-at-tribal-on-revote", eventName: "Advances after being involved in tie at tribal on revote", points: 5 },
  { eventKey: "is-eliminated-after-tie-at-tribal", eventName: "Is eliminated after tie at tribal", points: 5 },
  { eventKey: "eliminated-by-rocks", eventName: "Eliminated by rocks", points: 10 },
  { eventKey: "eliminated-in-fire-making-challenge", eventName: "Eliminated in fire making challenge", points: 5 },
  { eventKey: "advances-in-fire-making-challenge", eventName: "Advances in fire making challenge", points: 10 },
  { eventKey: "makes-it-to-merge", eventName: "Makes it to merge", points: 10 },
  { eventKey: "on-winning-reward-challenge-team", eventName: "On winning reward challenge team", points: 5 },
  { eventKey: "on-winning-immunity-challenge-team", eventName: "On winning immunity challenge team", points: 5 },
  { eventKey: "picked-for-reward", eventName: "Picked for reward", points: 5 },
  { eventKey: "goes-on-journey", eventName: "Goes on Journey", points: 5 },
  { eventKey: "wins-journey", eventName: "Wins Journey", points: 5 },
  { eventKey: "loses-journey", eventName: "Loses Journey", points: -5 },
  { eventKey: "plays-shot-in-the-dark-successfully", eventName: "Plays shot in the dark successfully", points: 15 },
  { eventKey: "plays-shot-in-the-dark-unsuccessfully", eventName: "Plays shot in the dark unsuccessfully", points: -5 },
  { eventKey: "plays-idol-at-tribal", eventName: "Plays idol at tribal", points: 10 },
  { eventKey: "plays-advantage-extra-vote-steal-vote-etc", eventName: "Plays advantage (extra vote, steal vote etc.)", points: 10 },
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // PIN validation endpoint
  app.post("/api/admin/verify-pin", (req, res) => {
    const { pin } = req.body;
    if (pin === ADMIN_PIN) {
      return res.json({ success: true });
    }
    return res.status(401).json({ error: "Invalid PIN" });
  });

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
      if (defaultEvents.length > 0) {
        await storage.seedSeasonEvents(season.id, defaultEvents);
      }
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

  // Tribes API
  app.get("/api/tribes", async (req, res) => {
    try {
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined;
      const tribesList = await storage.getTribes(seasonId);
      res.json(tribesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tribes" });
    }
  });

  app.get("/api/tribes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tribe = await storage.getTribe(id);
      if (!tribe) {
        return res.status(404).json({ error: "Tribe not found" });
      }
      res.json(tribe);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tribe" });
    }
  });

  app.post("/api/tribes", requirePin, async (req, res) => {
    try {
      const parsed = insertTribeSchema.parse(req.body);
      const tribe = await storage.createTribe(parsed);
      res.status(201).json(tribe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create tribe" });
    }
  });

  app.patch("/api/tribes/:id", requirePin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertTribeSchema.partial().parse(req.body);
      const tribe = await storage.updateTribe(id, parsed);
      if (!tribe) {
        return res.status(404).json({ error: "Tribe not found" });
      }
      res.json(tribe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update tribe" });
    }
  });

  app.delete("/api/tribes/:id", requirePin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTribe(id);
      if (!deleted) {
        return res.status(404).json({ error: "Tribe not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tribe" });
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

  app.get("/api/weeks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const week = await storage.getWeek(id);
      if (!week) return res.status(404).json({ error: "Week not found" });
      res.json(week);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch week" });
    }
  });

  app.post("/api/weeks", requirePin, async (req, res) => {
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

  app.delete("/api/weeks/:id", requirePin, async (req, res) => {
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

  // Scores API (keep existing read endpoints for dashboard)
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

  app.post("/api/scores", requirePin, async (req, res) => {
    try {
      const { contestantId, weekId, points } = req.body;
      const score = await storage.upsertContestantScore({ contestantId, weekId, points });
      res.json(score);
    } catch (error) {
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  app.post("/api/weeks/:weekId/scores", requirePin, async (req, res) => {
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

  app.post("/api/weeks/:weekId/bonuses", requirePin, async (req, res) => {
    try {
      const weekId = parseInt(req.params.weekId);
      const { teamId, bonus } = req.body;
      const saved = await storage.upsertTeamBonus({ teamId, weekId, bonus });
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: "Failed to save bonus" });
    }
  });

  // Season Event Settings API (rubric)
  app.get("/api/seasons/:seasonId/events", async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      let events = await storage.getSeasonEventSettings(seasonId);
      if (events.length === 0 && defaultEvents.length > 0) {
        await storage.seedSeasonEvents(seasonId, defaultEvents);
        events = await storage.getSeasonEventSettings(seasonId);
      }
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event settings" });
    }
  });

  app.put("/api/seasons/:seasonId/events/:eventKey", requirePin, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const eventKey = req.params.eventKey;
      const { points } = req.body;
      const updated = await storage.updateEventPoints(seasonId, eventKey, points);
      if (!updated) {
        return res.status(404).json({ error: "Event not found" });
      }
      await storage.recalcScoresForSeason(seasonId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.put("/api/seasons/:seasonId/events", requirePin, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const { events } = req.body as { events: { eventKey: string; points: number }[] };
      for (const evt of events) {
        await storage.updateEventPoints(seasonId, evt.eventKey, evt.points);
      }
      await storage.recalcScoresForSeason(seasonId);
      const updated = await storage.getSeasonEventSettings(seasonId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update events" });
    }
  });

  app.get("/api/contestants/:contestantId/events", async (req, res) => {
    try {
      const contestantId = parseInt(req.params.contestantId);
      const seasonId = parseInt(req.query.seasonId as string);
      if (!seasonId) return res.status(400).json({ error: "seasonId required" });
      const allEvents = await storage.getContestantEventsBySeason(seasonId);
      const contestantEvts = allEvents.filter(e => e.contestantId === contestantId);
      const weeks = await storage.getWeeks(seasonId);
      const eventSettings = await storage.getSeasonEventSettings(seasonId);
      const result = contestantEvts.map(evt => {
        const week = weeks.find(w => w.id === evt.weekId);
        const pts = evt.pointsOverride !== null ? evt.pointsOverride : (eventSettings.find(s => s.eventKey === evt.eventKey)?.points ?? 0);
        return {
          id: evt.id,
          weekNumber: week?.weekNumber,
          eventName: evt.eventName,
          eventKey: evt.eventKey,
          points: pts,
        };
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contestant events" });
    }
  });

  // Contestant Events API
  app.get("/api/seasons/:seasonId/weeks/:weekId/contestant-events", async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const weekId = parseInt(req.params.weekId);
      const events = await storage.getContestantEvents(seasonId, weekId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contestant events" });
    }
  });

  app.post("/api/seasons/:seasonId/weeks/:weekId/contestant-events", requirePin, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const weekId = parseInt(req.params.weekId);
      const { contestantId, eventKeys, customEvent } = req.body as {
        contestantId: number;
        eventKeys?: string[];
        customEvent?: { eventName: string; points: number };
      };

      const results = [];

      if (eventKeys && eventKeys.length > 0) {
        const settings = await storage.getSeasonEventSettings(seasonId);
        for (const key of eventKeys) {
          const setting = settings.find(s => s.eventKey === key);
          if (setting) {
            const evt = await storage.addContestantEvent({
              seasonId,
              weekId,
              contestantId,
              eventKey: key,
              eventName: setting.eventName,
              pointsOverride: null,
            });
            results.push(evt);
          }
        }
      }

      if (customEvent) {
        const evt = await storage.addContestantEvent({
          seasonId,
          weekId,
          contestantId,
          eventKey: null,
          eventName: customEvent.eventName,
          pointsOverride: customEvent.points,
        });
        results.push(evt);
      }

      await storage.recalcScoresForWeek(seasonId, weekId);
      res.status(201).json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to add contestant events" });
    }
  });

  app.delete("/api/contestant-events/:id", requirePin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContestantEvent(id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.post("/api/seasons/:seasonId/weeks/:weekId/recalc", requirePin, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const weekId = parseInt(req.params.weekId);
      await storage.recalcScoresForWeek(seasonId, weekId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to recalculate" });
    }
  });

  app.get("/api/bonus/deadline-status", async (req, res) => {
    try {
      const weekId = parseInt(req.query.weekId as string);
      if (!weekId) return res.json({ open: true, deadline: null });
      const week = await storage.getWeek(weekId);
      if (!week || !week.bonusDeadline) return res.json({ open: true, deadline: null });
      const now = new Date();
      const open = now < week.bonusDeadline;
      res.json({ open, deadline: week.bonusDeadline.toISOString() });
    } catch (error) {
      res.json({ open: true, deadline: null });
    }
  });

  // Team Secrets
  app.post("/api/teams/:teamId/set-secret", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { passcode, oldPasscode } = req.body as { passcode: string; oldPasscode?: string };
      if (!passcode || passcode.length < 3) {
        return res.status(400).json({ error: "Passcode must be at least 3 characters" });
      }
      const existing = await storage.getTeamSecret(teamId);
      if (existing) {
        if (!oldPasscode) return res.status(400).json({ error: "Current passcode required to reset" });
        const valid = await bcrypt.compare(oldPasscode, existing.passcodeHash);
        if (!valid) return res.status(401).json({ error: "Current passcode is incorrect" });
      }
      const hash = await bcrypt.hash(passcode, 10);
      await storage.setTeamSecret(teamId, hash);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to set passcode:", error);
      res.status(500).json({ error: "Failed to set passcode" });
    }
  });

  app.post("/api/teams/:teamId/verify-secret", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { passcode } = req.body as { passcode: string };
      const secret = await storage.getTeamSecret(teamId);
      if (!secret) return res.json({ verified: false, hasSecret: false });
      const valid = await bcrypt.compare(passcode, secret.passcodeHash);
      res.json({ verified: valid, hasSecret: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify passcode" });
    }
  });

  app.get("/api/teams/:teamId/has-secret", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const secret = await storage.getTeamSecret(teamId);
      res.json({ hasSecret: !!secret });
    } catch (error) {
      res.status(500).json({ error: "Failed to check secret" });
    }
  });

  // Bonus Questions - Public read
  app.get("/api/bonus/questions", async (req, res) => {
    try {
      const seasonId = parseInt(req.query.seasonId as string);
      const weekId = parseInt(req.query.weekId as string);
      if (!seasonId || !weekId) return res.status(400).json({ error: "seasonId and weekId required" });
      const questions = await storage.getBonusQuestions(seasonId, weekId);
      const sanitized = questions.map(q => ({
        ...q,
        correctAnswer: null,
        isWager: q.isWager,
      }));
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Bonus Submissions - Public
  app.post("/api/bonus/submit", async (req, res) => {
    try {
      const { seasonId, weekId, teamId, passcode, answers } = req.body as {
        seasonId: number; weekId: number; teamId: number; passcode: string;
        answers: Record<string, any>;
      };
      const week = await storage.getWeek(weekId);
      if (week?.bonusDeadline && new Date() >= week.bonusDeadline) {
        return res.status(403).json({ error: "Sorry, bonus questions can no longer be submitted for this week's episode. Do better." });
      }
      const secret = await storage.getTeamSecret(teamId);
      if (!secret) return res.status(400).json({ error: "Team passcode not set" });
      const valid = await bcrypt.compare(passcode, secret.passcodeHash);
      if (!valid) return res.status(401).json({ error: "Invalid passcode" });

      const submission = await storage.upsertBonusSubmission({
        seasonId, weekId, teamId, answersJson: JSON.stringify(answers),
      });
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit answers" });
    }
  });

  // Team bonus history
  app.get("/api/bonus/history/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const seasonId = parseInt(req.query.seasonId as string);
      if (!seasonId) return res.status(400).json({ error: "seasonId required" });
      const submissions = await storage.getBonusSubmissionsByTeam(teamId, seasonId);
      const allWeeks = await storage.getWeeks(seasonId);
      const history = await Promise.all(submissions.map(async (sub) => {
        const questions = await storage.getBonusQuestions(sub.seasonId, sub.weekId);
        const week = allWeeks.find(w => w.id === sub.weekId);
        return {
          weekId: sub.weekId,
          weekNumber: week?.weekNumber,
          submittedAt: sub.updatedAt || sub.submittedAt,
          answers: JSON.parse(sub.answersJson),
          questions: questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            points: q.points,
            optionsJson: q.optionsJson,
            correctAnswer: q.correctAnswer,
            isWager: q.isWager,
          })),
        };
      }));
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Admin Bonus Questions
  app.get("/api/admin/bonus/questions", requirePin, async (req, res) => {
    try {
      const seasonId = parseInt(req.query.seasonId as string);
      const weekId = parseInt(req.query.weekId as string);
      if (!seasonId || !weekId) return res.status(400).json({ error: "seasonId and weekId required" });
      const questions = await storage.getBonusQuestions(seasonId, weekId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.post("/api/admin/bonus/questions", requirePin, async (req, res) => {
    try {
      const parsed = insertBonusQuestionSchema.parse(req.body);
      const question = await storage.createBonusQuestion(parsed);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.patch("/api/admin/bonus/questions/:id", requirePin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateBonusQuestion(id, req.body);
      if (!updated) return res.status(404).json({ error: "Question not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/admin/bonus/questions/:id", requirePin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBonusQuestion(id);
      if (!deleted) return res.status(404).json({ error: "Question not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Copy last week questions
  app.post("/api/admin/bonus/:seasonId/:weekId/copy-last-week", requirePin, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const weekId = parseInt(req.params.weekId);

      const existingQuestions = await storage.getBonusQuestions(seasonId, weekId);
      if (existingQuestions.length > 0) {
        return res.status(400).json({ error: "Questions already exist for this week" });
      }

      const allWeeks = await storage.getWeeks(seasonId);
      const currentWeek = allWeeks.find(w => w.id === weekId);
      if (!currentWeek) return res.status(404).json({ error: "Week not found" });

      const prevWeek = allWeeks
        .filter(w => w.weekNumber < currentWeek.weekNumber)
        .sort((a, b) => b.weekNumber - a.weekNumber)[0];
      if (!prevWeek) return res.status(404).json({ error: "No previous week found" });

      const prevQuestions = await storage.getBonusQuestions(seasonId, prevWeek.id);
      if (prevQuestions.length === 0) return res.status(404).json({ error: "No questions found in previous week" });

      let count = 0;
      for (const q of prevQuestions) {
        await storage.createBonusQuestion({
          seasonId, weekId,
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points,
          optionsJson: q.optionsJson,
          correctAnswer: null,
          isWager: q.isWager,
        });
        count++;
      }
      res.json({ success: true, count });
    } catch (error) {
      res.status(500).json({ error: "Failed to copy questions" });
    }
  });

  app.patch("/api/admin/bonus/deadline", requirePin, async (req, res) => {
    try {
      const { weekId, deadline } = req.body as { weekId: number; deadline: string | null };
      const deadlineDate = deadline ? new Date(deadline) : null;
      const updated = await storage.updateWeekDeadline(weekId, deadlineDate);
      if (!updated) return res.status(404).json({ error: "Week not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deadline" });
    }
  });

  // Bulk save correct answers for all questions
  app.post("/api/admin/bonus/save-answers", requirePin, async (req, res) => {
    try {
      const { answers } = req.body as { answers: { id: number; correctAnswer: string | null }[] };
      if (!Array.isArray(answers)) return res.status(400).json({ error: "answers must be an array" });
      for (const a of answers) {
        if (typeof a.id !== "number") continue;
        await storage.updateBonusQuestion(a.id, { correctAnswer: a.correctAnswer || null });
      }
      res.json({ success: true, saved: answers.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to save answers" });
    }
  });

  // Admin grade / score bonus
  app.post("/api/admin/bonus/grade", requirePin, async (req, res) => {
    try {
      const { seasonId, weekId } = req.body as { seasonId: number; weekId: number };
      const questions = await storage.getBonusQuestions(seasonId, weekId);
      const submissions = await storage.getBonusSubmissionsByWeek(seasonId, weekId);

      for (const sub of submissions) {
        const answers: Record<string, any> = JSON.parse(sub.answersJson);
        let totalBonus = 0;

        for (const q of questions) {
          if (q.correctAnswer === null) continue;
          const answer = answers[q.id.toString()];
          if (!answer) continue;

          if (q.isWager) {
            const wagerAmt = Math.min(Math.max(parseInt(answer.wager) || 0, 0), 50);
            const userAnswer = q.questionType === "contestant"
              ? (answer.answer || "").toString()
              : (answer.answer || "").toString().toLowerCase().trim();
            const correct = q.questionType === "contestant"
              ? q.correctAnswer
              : q.correctAnswer.toLowerCase().trim();
            if (userAnswer === correct) {
              totalBonus += wagerAmt;
            } else {
              totalBonus -= wagerAmt;
            }
          } else if (q.questionType === "contestant") {
            const userAnswer = (answer.answer || "").toString();
            if (userAnswer === q.correctAnswer) {
              totalBonus += q.points;
            }
          } else {
            const userAnswer = (answer.answer || "").toString().toLowerCase().trim();
            const correct = q.correctAnswer.toLowerCase().trim();
            if (userAnswer === correct) {
              totalBonus += q.points;
            }
          }
        }

        await storage.upsertTeamBonus({ teamId: sub.teamId, weekId, bonus: totalBonus });
      }

      res.json({ success: true, teamsScored: submissions.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to grade bonus" });
    }
  });

  // Admin get submissions for a week (basic list)
  app.get("/api/admin/bonus/submissions", requirePin, async (req, res) => {
    try {
      const seasonId = parseInt(req.query.seasonId as string);
      const weekId = parseInt(req.query.weekId as string);
      if (!seasonId || !weekId) return res.status(400).json({ error: "seasonId and weekId required" });
      const submissions = await storage.getBonusSubmissionsByWeek(seasonId, weekId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Admin detailed submissions view with answers and scoring
  app.get("/api/admin/bonus/submissions-detail", requirePin, async (req, res) => {
    try {
      const seasonId = parseInt(req.query.seasonId as string);
      const weekId = parseInt(req.query.weekId as string);
      if (!seasonId || !weekId) return res.status(400).json({ error: "seasonId and weekId required" });
      const questions = await storage.getBonusQuestions(seasonId, weekId);
      const submissions = await storage.getBonusSubmissionsByWeek(seasonId, weekId);
      const allTeams = await storage.getTeams(seasonId);
      const allContestants = await storage.getContestants(seasonId);

      const allQuestionsGraded = questions.every(q => q.correctAnswer !== null);

      const detail = submissions.map(sub => {
        const team = allTeams.find(t => t.id === sub.teamId);
        const answers: Record<string, any> = JSON.parse(sub.answersJson);

        const questionResults = questions.map(q => {
          const answer = answers[q.id.toString()];
          let userAnswer = answer ? (answer.answer || "") : "";
          let wagerAmount = answer?.wager ? parseInt(answer.wager) : null;
          let pointsEarned = 0;
          let isCorrect: boolean | null = null;

          if (q.correctAnswer !== null && answer) {
            if (q.isWager) {
              const amt = Math.min(Math.max(wagerAmount || 0, 0), 50);
              const ua = q.questionType === "contestant" ? userAnswer.toString() : userAnswer.toString().toLowerCase().trim();
              const ca = q.questionType === "contestant" ? q.correctAnswer : q.correctAnswer.toLowerCase().trim();
              isCorrect = ua === ca;
              pointsEarned = isCorrect ? amt : -amt;
            } else if (q.questionType === "contestant") {
              isCorrect = userAnswer.toString() === q.correctAnswer;
              pointsEarned = isCorrect ? q.points : 0;
            } else {
              isCorrect = userAnswer.toString().toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
              pointsEarned = isCorrect ? q.points : 0;
            }
          }

          if (q.questionType === "contestant" && userAnswer) {
            const c = allContestants.find(c => c.id === parseInt(userAnswer));
            userAnswer = c?.name || userAnswer;
          }

          return {
            questionId: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            points: q.points,
            isWager: q.isWager,
            userAnswer,
            wagerAmount,
            isCorrect,
            pointsEarned,
          };
        });

        const computedTotal = allQuestionsGraded
          ? questionResults.reduce((sum, qr) => sum + qr.pointsEarned, 0)
          : null;

        return {
          teamId: sub.teamId,
          teamName: team?.name || `Team ${sub.teamId}`,
          submittedAt: sub.submittedAt,
          updatedAt: sub.updatedAt,
          totalBonus: computedTotal,
          questionResults,
        };
      });

      res.json(detail);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submission details" });
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
      const tribesList = resolvedSeasonId ? await storage.getTribes(resolvedSeasonId) : [];
      const allEvents = resolvedSeasonId ? await storage.getContestantEventsBySeason(resolvedSeasonId) : [];

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

      const classifyEvent = (key: string, name: string): { type: "idol" | "advantage" | null; action: "gain" | "play" | "lose" | null } => {
        const k = key.toLowerCase();
        const n = name.toLowerCase();

        const isAdvantageNotIdol = k.includes("advantage") && (k.includes("other-than-idol") || n.includes("other than idol"));
        const mentionsIdol = k.includes("idol") || n.includes("idol");
        const mentionsAdvantage = k.includes("advantage") || n.includes("advantage");

        let type: "idol" | "advantage" | null = null;
        if (isAdvantageNotIdol) {
          type = "advantage";
        } else if (mentionsIdol && !mentionsAdvantage) {
          type = "idol";
        } else if (mentionsAdvantage) {
          type = "advantage";
        } else if (mentionsIdol) {
          type = "idol";
        }

        if (!type) return { type: null, action: null };

        let action: "gain" | "play" | "lose" | null = null;
        if (k.includes("gain") || k.includes("found") || k.includes("find")) {
          action = "gain";
        } else if (k.includes("play") || k.includes("used") || k.includes("use")) {
          action = "play";
        } else if (k.includes("kicked-off") || n.includes("kicked off")) {
          action = "lose";
        } else if (k.includes("gives") || n.includes("gives")) {
          action = "lose";
        }
        return { type, action };
      };

      const idolWatch = contestants
        .filter(c => !c.eliminated)
        .map(c => {
          const cEvents = allEvents.filter(e => e.contestantId === c.id);

          let idolsGained = 0, idolsUsed = 0, advantagesGained = 0, advantagesUsed = 0;
          for (const ev of cEvents) {
            const { type, action } = classifyEvent(ev.eventKey || "", ev.eventName || "");
            if (type === "idol" && action === "gain") idolsGained++;
            if (type === "idol" && (action === "play" || action === "lose")) idolsUsed++;
            if (type === "advantage" && action === "gain") advantagesGained++;
            if (type === "advantage" && (action === "play" || action === "lose")) advantagesUsed++;
          }

          const unplayedIdols = idolsGained - idolsUsed;
          const unplayedAdvantages = advantagesGained - advantagesUsed;

          if (unplayedIdols <= 0 && unplayedAdvantages <= 0) return null;
          const tribe = tribesList.find(t => t.id === c.tribeId);
          return {
            contestantId: c.id,
            name: c.name,
            imageUrl: c.imageUrl,
            tribeColor: tribe?.color || null,
            tribeName: tribe?.name || null,
            unplayedIdols: Math.max(0, unplayedIdols),
            unplayedAdvantages: Math.max(0, unplayedAdvantages),
          };
        })
        .filter(Boolean);

      res.json({
        teams: teamTotals,
        contestants: contestantTotals,
        weeks,
        weeklyData: cumulativeData,
        teamNames: teams.map(t => t.name),
        teamImages: teams.reduce((acc, t) => { acc[t.name] = t.imageUrl || ""; return acc; }, {} as Record<string, string>),
        weeklyContestantScores,
        tribes: tribesList,
        idolWatch,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.post("/api/seed-season50-tribes", requirePin, async (_req: Request, res: Response) => {
    try {
      const seasons = await storage.getSeasons();
      const season50 = seasons.find(s => s.number === 50);
      if (!season50) return res.status(404).json({ error: "Season 50 not found" });

      const existingTribes = await storage.getTribes(season50.id);
      if (existingTribes.length > 0) return res.json({ message: "Tribes already seeded", tribes: existingTribes });

      const vatu = await storage.createTribe({ name: "Vatu", color: "#7B2D8E", seasonId: season50.id });
      const cila = await storage.createTribe({ name: "Cila", color: "#E87722", seasonId: season50.id });
      const kalo = await storage.createTribe({ name: "Kalo", color: "#00A79D", seasonId: season50.id });

      const contestants = await storage.getContestants(season50.id);

      const tribeMap: Record<string, number> = {
        "Colby Donaldson": vatu.id, "Genevieve Mushaluk": vatu.id, "Rizo Velovic": vatu.id,
        "Angelina Keeley": vatu.id, "Q Burdette": vatu.id, "Stephenie LaGrossa Kendrick": vatu.id,
        "Kyle Fraser": vatu.id, "Aubry Bracco": vatu.id,
        "Joe Hunter": cila.id, "Savannah Louie": cila.id, "Christian Hubicki": cila.id,
        "Cirie Fields": cila.id, "Ozzy Lusth": cila.id, "Emily Flippen": cila.id,
        "Rick Devens": cila.id, "Jenna Lewis-Dougherty": cila.id,
        "Jonathan Young": kalo.id, "Dee Valladares": kalo.id, "Mike White": kalo.id,
        "Kamilla Karthigesu": kalo.id, "Charlie Davis": kalo.id, "Tiffany Ervin": kalo.id,
        'Benjamin "Coach" Wade': kalo.id, "Chrissy Hofbeck": kalo.id,
      };

      const bioMap: Record<string, string> = {
        "Colby Donaldson": "The original Survivor heartthrob from Season 2: The Australian Outback. A three-time player known for his cowboy charm and challenge prowess.",
        "Genevieve Mushaluk": "Strategic powerhouse from Season 47 who played a cutthroat game. Known for her sharp social reads and aggressive gameplay.",
        "Rizo Velovic": "4th place finisher from Season 49 who lost at fire-making. A physical and social threat who narrowly missed the finals.",
        "Angelina Keeley": "Memorable player from Season 37: David vs. Goliath. Famous for negotiating for rice and her bold, entertaining gameplay.",
        "Q Burdette": "Big personality from Season 46 known for his physical dominance and unpredictable strategic moves.",
        "Stephenie LaGrossa Kendrick": "Legendary three-time player from Palau and Guatemala. Known as one of the toughest competitors in Survivor history.",
        "Kyle Fraser": "Season 48 winner who dominated the new era. A strong social and strategic player who controlled the game.",
        "Aubry Bracco": "Three-time player from Kaoh Rong, Game Changers, and Edge of Extinction. Known for her cerebral gameplay and emotional journey.",
        "Joe Hunter": "Physical competitor from Season 42. Known for his strength in challenges and genuine personality.",
        "Savannah Louie": "Season 49 winner who played a dominant strategic and social game. A new-era champion returning to prove herself again.",
        "Christian Hubicki": "Fan-favorite from Season 37: David vs. Goliath. A robotics engineer known for his charm, wit, and puzzle-solving skills.",
        "Cirie Fields": "Four-time player and one of the most beloved contestants ever. Known for her masterful social game and strategic genius.",
        "Ozzy Lusth": "Four-time player legendary for his challenge dominance, especially in water and endurance challenges.",
        "Emily Flippen": "Breakout star from Season 45 who went from early target to late-game power player. Known for her strategic evolution.",
        "Rick Devens": "Edge of Extinction standout who came back from the edge to nearly win it all. A news anchor known for his idol finds.",
        "Jenna Lewis-Dougherty": "Original Season 1 castaway who returned for All-Stars. One of the OG Survivor players bringing old-school gameplay.",
        "Jonathan Young": "Physical beast from Season 42 known for his incredible strength in challenges and gentle personality.",
        "Dee Valladares": "Season 45 winner who played a strategic masterclass. Known for her calculated moves and social awareness.",
        "Mike White": "Emmy-winning creator of The White Lotus who was runner-up on Season 37. Brings Hollywood creativity to the island.",
        "Kamilla Karthigesu": "Contestant from Season 48 known for her social connections and strategic awareness in the new era.",
        "Charlie Davis": "Runner-up from Season 46 who played a strong strategic game. Known for his close alliance work and jury management.",
        "Tiffany Ervin": "Memorable player from Season 46 known for her bold moves and entertaining confessionals.",
        'Benjamin "Coach" Wade': "Three-time player and self-proclaimed Dragon Slayer. One of Survivor's most iconic and entertaining characters.",
        "Chrissy Hofbeck": "Strategic player from Season 35: Heroes vs. Healers vs. Hustlers. An actuary known for her analytical approach to the game.",
      };

      for (const c of contestants) {
        const tribeId = tribeMap[c.name];
        const bio = bioMap[c.name];
        if (tribeId || bio) {
          await storage.updateContestant(c.id, {
            ...(tribeId ? { tribeId } : {}),
            ...(bio ? { bio } : {}),
          });
        }
      }

      res.json({ message: "Season 50 tribes and bios seeded successfully", tribes: [vatu, cila, kalo] });
    } catch (error) {
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  return httpServer;
}
