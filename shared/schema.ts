import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const seasons = pgTable("seasons", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  number: integer("number").notNull().unique(),
});

export const seasonsRelations = relations(seasons, ({ many }) => ({
  teams: many(teams),
  contestants: many(contestants),
  weeks: many(weeks),
  eventSettings: many(seasonEventSettings),
  tribes: many(tribes),
}));

export const insertSeasonSchema = createInsertSchema(seasons).omit({ id: true });
export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type Season = typeof seasons.$inferSelect;

export const tribes = pgTable("tribes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#808080"),
  seasonId: integer("season_id").references(() => seasons.id).notNull(),
});

export const tribesRelations = relations(tribes, ({ one, many }) => ({
  season: one(seasons, { fields: [tribes.seasonId], references: [seasons.id] }),
  contestants: many(contestants),
}));

export const insertTribeSchema = createInsertSchema(tribes).omit({ id: true });
export type InsertTribe = z.infer<typeof insertTribeSchema>;
export type Tribe = typeof tribes.$inferSelect;

export const teams = pgTable("teams", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  seasonId: integer("season_id").references(() => seasons.id),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  season: one(seasons, { fields: [teams.seasonId], references: [seasons.id] }),
  contestants: many(contestants),
  teamBonuses: many(teamBonuses),
}));

export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export const contestants = pgTable("contestants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  teamId: integer("team_id").references(() => teams.id),
  eliminated: boolean("eliminated").default(false).notNull(),
  seasonId: integer("season_id").references(() => seasons.id),
  tribeId: integer("tribe_id").references(() => tribes.id),
  bio: text("bio"),
});

export const contestantsRelations = relations(contestants, ({ one, many }) => ({
  team: one(teams, {
    fields: [contestants.teamId],
    references: [teams.id],
  }),
  season: one(seasons, { fields: [contestants.seasonId], references: [seasons.id] }),
  tribe: one(tribes, { fields: [contestants.tribeId], references: [tribes.id] }),
  scores: many(contestantScores),
  events: many(contestantEvents),
}));

export const insertContestantSchema = createInsertSchema(contestants).omit({ id: true });
export type InsertContestant = z.infer<typeof insertContestantSchema>;
export type Contestant = typeof contestants.$inferSelect;

export const weeks = pgTable("weeks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weekNumber: integer("week_number").notNull(),
  seasonId: integer("season_id").references(() => seasons.id),
});

export const weeksRelations = relations(weeks, ({ one, many }) => ({
  season: one(seasons, { fields: [weeks.seasonId], references: [seasons.id] }),
  contestantScores: many(contestantScores),
  teamBonuses: many(teamBonuses),
  contestantEvents: many(contestantEvents),
}));

export const insertWeekSchema = createInsertSchema(weeks).omit({ id: true });
export type InsertWeek = z.infer<typeof insertWeekSchema>;
export type Week = typeof weeks.$inferSelect;

export const contestantScores = pgTable("contestant_scores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  contestantId: integer("contestant_id").references(() => contestants.id).notNull(),
  weekId: integer("week_id").references(() => weeks.id).notNull(),
  points: integer("points").default(0).notNull(),
});

export const contestantScoresRelations = relations(contestantScores, ({ one }) => ({
  contestant: one(contestants, {
    fields: [contestantScores.contestantId],
    references: [contestants.id],
  }),
  week: one(weeks, {
    fields: [contestantScores.weekId],
    references: [weeks.id],
  }),
}));

export const insertContestantScoreSchema = createInsertSchema(contestantScores).omit({ id: true });
export type InsertContestantScore = z.infer<typeof insertContestantScoreSchema>;
export type ContestantScore = typeof contestantScores.$inferSelect;

export const teamBonuses = pgTable("team_bonuses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  weekId: integer("week_id").references(() => weeks.id).notNull(),
  bonus: integer("bonus").default(0).notNull(),
});

export const teamBonusesRelations = relations(teamBonuses, ({ one }) => ({
  team: one(teams, {
    fields: [teamBonuses.teamId],
    references: [teams.id],
  }),
  week: one(weeks, {
    fields: [teamBonuses.weekId],
    references: [weeks.id],
  }),
}));

export const insertTeamBonusSchema = createInsertSchema(teamBonuses).omit({ id: true });
export type InsertTeamBonus = z.infer<typeof insertTeamBonusSchema>;
export type TeamBonus = typeof teamBonuses.$inferSelect;

export const seasonEventSettings = pgTable("season_event_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  seasonId: integer("season_id").references(() => seasons.id).notNull(),
  eventKey: text("event_key").notNull(),
  eventName: text("event_name").notNull(),
  points: integer("points").default(0).notNull(),
}, (table) => [
  unique().on(table.seasonId, table.eventKey),
]);

export const seasonEventSettingsRelations = relations(seasonEventSettings, ({ one }) => ({
  season: one(seasons, {
    fields: [seasonEventSettings.seasonId],
    references: [seasons.id],
  }),
}));

export const insertSeasonEventSettingSchema = createInsertSchema(seasonEventSettings).omit({ id: true });
export type InsertSeasonEventSetting = z.infer<typeof insertSeasonEventSettingSchema>;
export type SeasonEventSetting = typeof seasonEventSettings.$inferSelect;

export const contestantEvents = pgTable("contestant_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  seasonId: integer("season_id").references(() => seasons.id).notNull(),
  weekId: integer("week_id").references(() => weeks.id).notNull(),
  contestantId: integer("contestant_id").references(() => contestants.id).notNull(),
  eventKey: text("event_key"),
  eventName: text("event_name").notNull(),
  pointsOverride: integer("points_override"),
});

export const contestantEventsRelations = relations(contestantEvents, ({ one }) => ({
  season: one(seasons, {
    fields: [contestantEvents.seasonId],
    references: [seasons.id],
  }),
  week: one(weeks, {
    fields: [contestantEvents.weekId],
    references: [weeks.id],
  }),
  contestant: one(contestants, {
    fields: [contestantEvents.contestantId],
    references: [contestants.id],
  }),
}));

export const insertContestantEventSchema = createInsertSchema(contestantEvents).omit({ id: true });
export type InsertContestantEvent = z.infer<typeof insertContestantEventSchema>;
export type ContestantEvent = typeof contestantEvents.$inferSelect;
