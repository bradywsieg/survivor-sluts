import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Teams table
export const teams = pgTable("teams", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  contestants: many(contestants),
  teamBonuses: many(teamBonuses),
}));

export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Contestants table
export const contestants = pgTable("contestants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  teamId: integer("team_id").references(() => teams.id),
  eliminated: boolean("eliminated").default(false).notNull(),
});

export const contestantsRelations = relations(contestants, ({ one, many }) => ({
  team: one(teams, {
    fields: [contestants.teamId],
    references: [teams.id],
  }),
  scores: many(contestantScores),
}));

export const insertContestantSchema = createInsertSchema(contestants).omit({ id: true });
export type InsertContestant = z.infer<typeof insertContestantSchema>;
export type Contestant = typeof contestants.$inferSelect;

// Weeks table
export const weeks = pgTable("weeks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weekNumber: integer("week_number").notNull().unique(),
});

export const weeksRelations = relations(weeks, ({ many }) => ({
  contestantScores: many(contestantScores),
  teamBonuses: many(teamBonuses),
}));

export const insertWeekSchema = createInsertSchema(weeks).omit({ id: true });
export type InsertWeek = z.infer<typeof insertWeekSchema>;
export type Week = typeof weeks.$inferSelect;

// Contestant scores table
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

// Team bonuses table
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
