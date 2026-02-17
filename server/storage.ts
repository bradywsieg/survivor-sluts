import { 
  seasons, teams, contestants, weeks, contestantScores, teamBonuses,
  type Season, type InsertSeason,
  type Team, type InsertTeam,
  type Contestant, type InsertContestant,
  type Week, type InsertWeek,
  type ContestantScore, type InsertContestantScore,
  type TeamBonus, type InsertTeamBonus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getSeasons(): Promise<Season[]>;
  getSeason(id: number): Promise<Season | undefined>;
  getLatestSeason(): Promise<Season | undefined>;
  createSeason(season: InsertSeason): Promise<Season>;
  updateSeason(id: number, season: Partial<InsertSeason>): Promise<Season | undefined>;
  deleteSeason(id: number): Promise<boolean>;

  getTeams(seasonId?: number): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  getContestants(seasonId?: number): Promise<Contestant[]>;
  getContestant(id: number): Promise<Contestant | undefined>;
  getContestantsByTeam(teamId: number): Promise<Contestant[]>;
  createContestant(contestant: InsertContestant): Promise<Contestant>;
  updateContestant(id: number, contestant: Partial<InsertContestant>): Promise<Contestant | undefined>;
  deleteContestant(id: number): Promise<boolean>;

  getWeeks(seasonId?: number): Promise<Week[]>;
  getWeek(id: number): Promise<Week | undefined>;
  getWeekByNumber(weekNumber: number, seasonId?: number): Promise<Week | undefined>;
  createWeek(week: InsertWeek): Promise<Week>;
  deleteWeek(id: number): Promise<boolean>;

  getContestantScores(): Promise<ContestantScore[]>;
  getContestantScoresByWeek(weekId: number): Promise<ContestantScore[]>;
  getContestantScoresBySeason(seasonId: number): Promise<ContestantScore[]>;
  upsertContestantScore(score: InsertContestantScore): Promise<ContestantScore>;

  getTeamBonuses(): Promise<TeamBonus[]>;
  getTeamBonusesByWeek(weekId: number): Promise<TeamBonus[]>;
  getTeamBonusesBySeason(seasonId: number): Promise<TeamBonus[]>;
  upsertTeamBonus(bonus: InsertTeamBonus): Promise<TeamBonus>;
}

export class DatabaseStorage implements IStorage {
  async getSeasons(): Promise<Season[]> {
    return await db.select().from(seasons).orderBy(desc(seasons.number));
  }

  async getSeason(id: number): Promise<Season | undefined> {
    const [season] = await db.select().from(seasons).where(eq(seasons.id, id));
    return season;
  }

  async getLatestSeason(): Promise<Season | undefined> {
    const [season] = await db.select().from(seasons).orderBy(desc(seasons.number)).limit(1);
    return season;
  }

  async createSeason(season: InsertSeason): Promise<Season> {
    const [newSeason] = await db.insert(seasons).values(season).returning();
    return newSeason;
  }

  async updateSeason(id: number, season: Partial<InsertSeason>): Promise<Season | undefined> {
    const [updated] = await db.update(seasons).set(season).where(eq(seasons.id, id)).returning();
    return updated;
  }

  async deleteSeason(id: number): Promise<boolean> {
    const result = await db.delete(seasons).where(eq(seasons.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTeams(seasonId?: number): Promise<Team[]> {
    if (seasonId) {
      return await db.select().from(teams).where(eq(teams.seasonId, seasonId));
    }
    return await db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    const [updated] = await db.update(teams).set(team).where(eq(teams.id, id)).returning();
    return updated;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getContestants(seasonId?: number): Promise<Contestant[]> {
    if (seasonId) {
      return await db.select().from(contestants).where(eq(contestants.seasonId, seasonId));
    }
    return await db.select().from(contestants);
  }

  async getContestant(id: number): Promise<Contestant | undefined> {
    const [contestant] = await db.select().from(contestants).where(eq(contestants.id, id));
    return contestant;
  }

  async getContestantsByTeam(teamId: number): Promise<Contestant[]> {
    return await db.select().from(contestants).where(eq(contestants.teamId, teamId));
  }

  async createContestant(contestant: InsertContestant): Promise<Contestant> {
    const [newContestant] = await db.insert(contestants).values(contestant).returning();
    return newContestant;
  }

  async updateContestant(id: number, contestant: Partial<InsertContestant>): Promise<Contestant | undefined> {
    const [updated] = await db.update(contestants).set(contestant).where(eq(contestants.id, id)).returning();
    return updated;
  }

  async deleteContestant(id: number): Promise<boolean> {
    await db.delete(contestantScores).where(eq(contestantScores.contestantId, id));
    const result = await db.delete(contestants).where(eq(contestants.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getWeeks(seasonId?: number): Promise<Week[]> {
    if (seasonId) {
      return await db.select().from(weeks).where(eq(weeks.seasonId, seasonId)).orderBy(weeks.weekNumber);
    }
    return await db.select().from(weeks).orderBy(weeks.weekNumber);
  }

  async getWeek(id: number): Promise<Week | undefined> {
    const [week] = await db.select().from(weeks).where(eq(weeks.id, id));
    return week;
  }

  async getWeekByNumber(weekNumber: number, seasonId?: number): Promise<Week | undefined> {
    if (seasonId) {
      const [week] = await db.select().from(weeks).where(and(eq(weeks.weekNumber, weekNumber), eq(weeks.seasonId, seasonId)));
      return week;
    }
    const [week] = await db.select().from(weeks).where(eq(weeks.weekNumber, weekNumber));
    return week;
  }

  async createWeek(week: InsertWeek): Promise<Week> {
    const [newWeek] = await db.insert(weeks).values(week).returning();
    return newWeek;
  }

  async deleteWeek(id: number): Promise<boolean> {
    await db.delete(contestantScores).where(eq(contestantScores.weekId, id));
    await db.delete(teamBonuses).where(eq(teamBonuses.weekId, id));
    const result = await db.delete(weeks).where(eq(weeks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getContestantScores(): Promise<ContestantScore[]> {
    return await db.select().from(contestantScores);
  }

  async getContestantScoresByWeek(weekId: number): Promise<ContestantScore[]> {
    return await db.select().from(contestantScores).where(eq(contestantScores.weekId, weekId));
  }

  async getContestantScoresBySeason(seasonId: number): Promise<ContestantScore[]> {
    const seasonWeeks = await this.getWeeks(seasonId);
    const weekIds = seasonWeeks.map(w => w.id);
    if (weekIds.length === 0) return [];
    const allScores = await db.select().from(contestantScores);
    return allScores.filter(s => weekIds.includes(s.weekId));
  }

  async upsertContestantScore(score: InsertContestantScore): Promise<ContestantScore> {
    const [existing] = await db.select().from(contestantScores)
      .where(and(
        eq(contestantScores.contestantId, score.contestantId),
        eq(contestantScores.weekId, score.weekId)
      ));
    
    if (existing) {
      const [updated] = await db.update(contestantScores)
        .set({ points: score.points })
        .where(eq(contestantScores.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newScore] = await db.insert(contestantScores).values(score).returning();
      return newScore;
    }
  }

  async getTeamBonuses(): Promise<TeamBonus[]> {
    return await db.select().from(teamBonuses);
  }

  async getTeamBonusesByWeek(weekId: number): Promise<TeamBonus[]> {
    return await db.select().from(teamBonuses).where(eq(teamBonuses.weekId, weekId));
  }

  async getTeamBonusesBySeason(seasonId: number): Promise<TeamBonus[]> {
    const seasonWeeks = await this.getWeeks(seasonId);
    const weekIds = seasonWeeks.map(w => w.id);
    if (weekIds.length === 0) return [];
    const allBonuses = await db.select().from(teamBonuses);
    return allBonuses.filter(b => weekIds.includes(b.weekId));
  }

  async upsertTeamBonus(bonus: InsertTeamBonus): Promise<TeamBonus> {
    const [existing] = await db.select().from(teamBonuses)
      .where(and(
        eq(teamBonuses.teamId, bonus.teamId),
        eq(teamBonuses.weekId, bonus.weekId)
      ));
    
    if (existing) {
      const [updated] = await db.update(teamBonuses)
        .set({ bonus: bonus.bonus })
        .where(eq(teamBonuses.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newBonus] = await db.insert(teamBonuses).values(bonus).returning();
      return newBonus;
    }
  }
}

export const storage = new DatabaseStorage();
