import { 
  seasons, teams, contestants, weeks, contestantScores, teamBonuses,
  seasonEventSettings, contestantEvents, tribes,
  teamSecrets, bonusQuestions, bonusSubmissions,
  type Season, type InsertSeason,
  type Team, type InsertTeam,
  type Contestant, type InsertContestant,
  type Week, type InsertWeek,
  type ContestantScore, type InsertContestantScore,
  type TeamBonus, type InsertTeamBonus,
  type SeasonEventSetting, type InsertSeasonEventSetting,
  type ContestantEvent, type InsertContestantEvent,
  type Tribe, type InsertTribe,
  type TeamSecret,
  type BonusQuestion, type InsertBonusQuestion,
  type BonusSubmission, type InsertBonusSubmission
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, lt } from "drizzle-orm";

export interface IStorage {
  getSeasons(): Promise<Season[]>;
  getSeason(id: number): Promise<Season | undefined>;
  getLatestSeason(): Promise<Season | undefined>;
  createSeason(season: InsertSeason): Promise<Season>;
  updateSeason(id: number, season: Partial<InsertSeason>): Promise<Season | undefined>;
  deleteSeason(id: number): Promise<boolean>;

  getTribes(seasonId?: number): Promise<Tribe[]>;
  getTribe(id: number): Promise<Tribe | undefined>;
  createTribe(tribe: InsertTribe): Promise<Tribe>;
  updateTribe(id: number, tribe: Partial<InsertTribe>): Promise<Tribe | undefined>;
  deleteTribe(id: number): Promise<boolean>;

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

  getSeasonEventSettings(seasonId: number): Promise<SeasonEventSetting[]>;
  upsertSeasonEventSetting(setting: InsertSeasonEventSetting): Promise<SeasonEventSetting>;
  updateEventPoints(seasonId: number, eventKey: string, points: number): Promise<SeasonEventSetting | undefined>;
  seedSeasonEvents(seasonId: number, events: { eventKey: string; eventName: string; points: number }[]): Promise<void>;

  getContestantEvents(seasonId: number, weekId: number): Promise<ContestantEvent[]>;
  getContestantEventsBySeason(seasonId: number): Promise<ContestantEvent[]>;
  addContestantEvent(event: InsertContestantEvent): Promise<ContestantEvent>;
  deleteContestantEvent(id: number): Promise<boolean>;

  recalcScoresForWeek(seasonId: number, weekId: number): Promise<void>;
  recalcScoresForSeason(seasonId: number): Promise<void>;

  getTeamSecret(teamId: number): Promise<TeamSecret | undefined>;
  setTeamSecret(teamId: number, passcodeHash: string): Promise<TeamSecret>;

  getBonusQuestions(seasonId: number, weekId: number): Promise<BonusQuestion[]>;
  getBonusQuestion(id: number): Promise<BonusQuestion | undefined>;
  createBonusQuestion(question: InsertBonusQuestion): Promise<BonusQuestion>;
  updateBonusQuestion(id: number, question: Partial<InsertBonusQuestion>): Promise<BonusQuestion | undefined>;
  deleteBonusQuestion(id: number): Promise<boolean>;

  getBonusSubmission(seasonId: number, weekId: number, teamId: number): Promise<BonusSubmission | undefined>;
  getBonusSubmissionsByWeek(seasonId: number, weekId: number): Promise<BonusSubmission[]>;
  getBonusSubmissionsByTeam(teamId: number, seasonId: number): Promise<BonusSubmission[]>;
  upsertBonusSubmission(submission: InsertBonusSubmission): Promise<BonusSubmission>;
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

  async getTribes(seasonId?: number): Promise<Tribe[]> {
    if (seasonId) {
      return await db.select().from(tribes).where(eq(tribes.seasonId, seasonId));
    }
    return await db.select().from(tribes);
  }

  async getTribe(id: number): Promise<Tribe | undefined> {
    const [tribe] = await db.select().from(tribes).where(eq(tribes.id, id));
    return tribe;
  }

  async createTribe(tribe: InsertTribe): Promise<Tribe> {
    const [newTribe] = await db.insert(tribes).values(tribe).returning();
    return newTribe;
  }

  async updateTribe(id: number, tribe: Partial<InsertTribe>): Promise<Tribe | undefined> {
    const [updated] = await db.update(tribes).set(tribe).where(eq(tribes.id, id)).returning();
    return updated;
  }

  async deleteTribe(id: number): Promise<boolean> {
    await db.update(contestants).set({ tribeId: null }).where(eq(contestants.tribeId, id));
    const result = await db.delete(tribes).where(eq(tribes.id, id));
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
    await db.delete(contestantEvents).where(eq(contestantEvents.contestantId, id));
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
    await db.delete(contestantEvents).where(eq(contestantEvents.weekId, id));
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
    return await db.select().from(contestantScores).where(inArray(contestantScores.weekId, weekIds));
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
    return await db.select().from(teamBonuses).where(inArray(teamBonuses.weekId, weekIds));
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

  async getSeasonEventSettings(seasonId: number): Promise<SeasonEventSetting[]> {
    return await db.select().from(seasonEventSettings)
      .where(eq(seasonEventSettings.seasonId, seasonId))
      .orderBy(seasonEventSettings.id);
  }

  async upsertSeasonEventSetting(setting: InsertSeasonEventSetting): Promise<SeasonEventSetting> {
    const [existing] = await db.select().from(seasonEventSettings)
      .where(and(
        eq(seasonEventSettings.seasonId, setting.seasonId),
        eq(seasonEventSettings.eventKey, setting.eventKey)
      ));
    
    if (existing) {
      const [updated] = await db.update(seasonEventSettings)
        .set({ points: setting.points, eventName: setting.eventName })
        .where(eq(seasonEventSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newSetting] = await db.insert(seasonEventSettings).values(setting).returning();
      return newSetting;
    }
  }

  async updateEventPoints(seasonId: number, eventKey: string, points: number): Promise<SeasonEventSetting | undefined> {
    const [updated] = await db.update(seasonEventSettings)
      .set({ points })
      .where(and(
        eq(seasonEventSettings.seasonId, seasonId),
        eq(seasonEventSettings.eventKey, eventKey)
      ))
      .returning();
    return updated;
  }

  async seedSeasonEvents(seasonId: number, events: { eventKey: string; eventName: string; points: number }[]): Promise<void> {
    const existing = await this.getSeasonEventSettings(seasonId);
    if (existing.length > 0) return;

    const values = events.map(e => ({
      seasonId,
      eventKey: e.eventKey,
      eventName: e.eventName,
      points: e.points,
    }));

    if (values.length > 0) {
      await db.insert(seasonEventSettings).values(values);
    }
  }

  async getContestantEvents(seasonId: number, weekId: number): Promise<ContestantEvent[]> {
    return await db.select().from(contestantEvents)
      .where(and(
        eq(contestantEvents.seasonId, seasonId),
        eq(contestantEvents.weekId, weekId)
      ));
  }

  async getContestantEventsBySeason(seasonId: number): Promise<ContestantEvent[]> {
    return await db.select().from(contestantEvents)
      .where(eq(contestantEvents.seasonId, seasonId));
  }

  async addContestantEvent(event: InsertContestantEvent): Promise<ContestantEvent> {
    const [newEvent] = await db.insert(contestantEvents).values(event).returning();
    return newEvent;
  }

  async deleteContestantEvent(id: number): Promise<boolean> {
    const result = await db.delete(contestantEvents).where(eq(contestantEvents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async recalcScoresForWeek(seasonId: number, weekId: number): Promise<void> {
    const events = await this.getContestantEvents(seasonId, weekId);
    const settings = await this.getSeasonEventSettings(seasonId);
    const settingsMap = new Map(settings.map(s => [s.eventKey, s.points]));

    const allContestants = await this.getContestants(seasonId);
    
    for (const contestant of allContestants) {
      const contestantEvts = events.filter(e => e.contestantId === contestant.id);
      let total = 0;
      for (const evt of contestantEvts) {
        if (evt.pointsOverride !== null) {
          total += evt.pointsOverride;
        } else if (evt.eventKey) {
          total += settingsMap.get(evt.eventKey) ?? 0;
        }
      }
      await this.upsertContestantScore({
        contestantId: contestant.id,
        weekId,
        points: total,
      });
    }
  }

  async recalcScoresForSeason(seasonId: number): Promise<void> {
    const seasonWeeks = await this.getWeeks(seasonId);
    for (const week of seasonWeeks) {
      await this.recalcScoresForWeek(seasonId, week.id);
    }
  }

  async getTeamSecret(teamId: number): Promise<TeamSecret | undefined> {
    const [secret] = await db.select().from(teamSecrets).where(eq(teamSecrets.teamId, teamId));
    return secret;
  }

  async setTeamSecret(teamId: number, passcodeHash: string): Promise<TeamSecret> {
    const existing = await this.getTeamSecret(teamId);
    if (existing) {
      const [updated] = await db.update(teamSecrets)
        .set({ passcodeHash, updatedAt: new Date() })
        .where(eq(teamSecrets.teamId, teamId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(teamSecrets).values({ teamId, passcodeHash }).returning();
    return created;
  }

  async getBonusQuestions(seasonId: number, weekId: number): Promise<BonusQuestion[]> {
    return await db.select().from(bonusQuestions)
      .where(and(eq(bonusQuestions.seasonId, seasonId), eq(bonusQuestions.weekId, weekId)))
      .orderBy(bonusQuestions.id);
  }

  async getBonusQuestion(id: number): Promise<BonusQuestion | undefined> {
    const [q] = await db.select().from(bonusQuestions).where(eq(bonusQuestions.id, id));
    return q;
  }

  async createBonusQuestion(question: InsertBonusQuestion): Promise<BonusQuestion> {
    const [created] = await db.insert(bonusQuestions).values(question).returning();
    return created;
  }

  async updateBonusQuestion(id: number, question: Partial<InsertBonusQuestion>): Promise<BonusQuestion | undefined> {
    const [updated] = await db.update(bonusQuestions).set(question).where(eq(bonusQuestions.id, id)).returning();
    return updated;
  }

  async deleteBonusQuestion(id: number): Promise<boolean> {
    const result = await db.delete(bonusQuestions).where(eq(bonusQuestions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getBonusSubmission(seasonId: number, weekId: number, teamId: number): Promise<BonusSubmission | undefined> {
    const [sub] = await db.select().from(bonusSubmissions)
      .where(and(
        eq(bonusSubmissions.seasonId, seasonId),
        eq(bonusSubmissions.weekId, weekId),
        eq(bonusSubmissions.teamId, teamId)
      ));
    return sub;
  }

  async getBonusSubmissionsByWeek(seasonId: number, weekId: number): Promise<BonusSubmission[]> {
    return await db.select().from(bonusSubmissions)
      .where(and(eq(bonusSubmissions.seasonId, seasonId), eq(bonusSubmissions.weekId, weekId)));
  }

  async getBonusSubmissionsByTeam(teamId: number, seasonId: number): Promise<BonusSubmission[]> {
    return await db.select().from(bonusSubmissions)
      .where(and(eq(bonusSubmissions.teamId, teamId), eq(bonusSubmissions.seasonId, seasonId)))
      .orderBy(bonusSubmissions.weekId);
  }

  async upsertBonusSubmission(submission: InsertBonusSubmission): Promise<BonusSubmission> {
    const existing = await this.getBonusSubmission(submission.seasonId, submission.weekId, submission.teamId);
    if (existing) {
      const [updated] = await db.update(bonusSubmissions)
        .set({ answersJson: submission.answersJson, updatedAt: new Date() })
        .where(eq(bonusSubmissions.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(bonusSubmissions).values(submission).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
