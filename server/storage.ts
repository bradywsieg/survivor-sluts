import { 
  teams, contestants, weeks, contestantScores, teamBonuses,
  type Team, type InsertTeam,
  type Contestant, type InsertContestant,
  type Week, type InsertWeek,
  type ContestantScore, type InsertContestantScore,
  type TeamBonus, type InsertTeamBonus
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  // Contestants
  getContestants(): Promise<Contestant[]>;
  getContestant(id: number): Promise<Contestant | undefined>;
  getContestantsByTeam(teamId: number): Promise<Contestant[]>;
  createContestant(contestant: InsertContestant): Promise<Contestant>;
  updateContestant(id: number, contestant: Partial<InsertContestant>): Promise<Contestant | undefined>;
  deleteContestant(id: number): Promise<boolean>;

  // Weeks
  getWeeks(): Promise<Week[]>;
  getWeek(id: number): Promise<Week | undefined>;
  getWeekByNumber(weekNumber: number): Promise<Week | undefined>;
  createWeek(week: InsertWeek): Promise<Week>;
  deleteWeek(id: number): Promise<boolean>;

  // Contestant Scores
  getContestantScores(): Promise<ContestantScore[]>;
  getContestantScoresByWeek(weekId: number): Promise<ContestantScore[]>;
  upsertContestantScore(score: InsertContestantScore): Promise<ContestantScore>;

  // Team Bonuses
  getTeamBonuses(): Promise<TeamBonus[]>;
  getTeamBonusesByWeek(weekId: number): Promise<TeamBonus[]>;
  upsertTeamBonus(bonus: InsertTeamBonus): Promise<TeamBonus>;
}

export class DatabaseStorage implements IStorage {
  // Teams
  async getTeams(): Promise<Team[]> {
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

  // Contestants
  async getContestants(): Promise<Contestant[]> {
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
    // Delete associated scores first
    await db.delete(contestantScores).where(eq(contestantScores.contestantId, id));
    const result = await db.delete(contestants).where(eq(contestants.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Weeks
  async getWeeks(): Promise<Week[]> {
    return await db.select().from(weeks).orderBy(weeks.weekNumber);
  }

  async getWeek(id: number): Promise<Week | undefined> {
    const [week] = await db.select().from(weeks).where(eq(weeks.id, id));
    return week;
  }

  async getWeekByNumber(weekNumber: number): Promise<Week | undefined> {
    const [week] = await db.select().from(weeks).where(eq(weeks.weekNumber, weekNumber));
    return week;
  }

  async createWeek(week: InsertWeek): Promise<Week> {
    const [newWeek] = await db.insert(weeks).values(week).returning();
    return newWeek;
  }

  async deleteWeek(id: number): Promise<boolean> {
    // Delete associated scores and bonuses first
    await db.delete(contestantScores).where(eq(contestantScores.weekId, id));
    await db.delete(teamBonuses).where(eq(teamBonuses.weekId, id));
    const result = await db.delete(weeks).where(eq(weeks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Contestant Scores
  async getContestantScores(): Promise<ContestantScore[]> {
    return await db.select().from(contestantScores);
  }

  async getContestantScoresByWeek(weekId: number): Promise<ContestantScore[]> {
    return await db.select().from(contestantScores).where(eq(contestantScores.weekId, weekId));
  }

  async upsertContestantScore(score: InsertContestantScore): Promise<ContestantScore> {
    // Check if exists
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

  // Team Bonuses
  async getTeamBonuses(): Promise<TeamBonus[]> {
    return await db.select().from(teamBonuses);
  }

  async getTeamBonusesByWeek(weekId: number): Promise<TeamBonus[]> {
    return await db.select().from(teamBonuses).where(eq(teamBonuses.weekId, weekId));
  }

  async upsertTeamBonus(bonus: InsertTeamBonus): Promise<TeamBonus> {
    // Check if exists
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
