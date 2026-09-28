import { Schema, model, models } from 'mongoose';

export const activityTypes = ['walking', 'running', 'strength', 'cycling', 'yoga'] as const;
export const fitnessLevels = ['beginner', 'intermediate', 'advanced'] as const;
export type ActivityType = (typeof activityTypes)[number];
export type FitnessLevel = (typeof fitnessLevels)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    fitnessLevel: { type: String, enum: fitnessLevels, default: 'beginner' },
    goal: { type: String, trim: true, maxlength: 120, default: 'Build a steady routine' },
    preferredActivities: { type: [String], enum: activityTypes, default: ['walking', 'running'] },
  },
  { timestamps: true },
);

const teamSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 180, default: '' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    maxMembers: { type: Number, min: 2, max: 40, default: 12 },
  },
  { timestamps: true },
);

const activitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    type: { type: String, enum: activityTypes, required: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 600 },
    distanceKm: { type: Number, min: 0, max: 500, default: null },
    note: { type: String, trim: true, maxlength: 180, default: '' },
    points: { type: Number, required: true, min: 1 },
    completedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

const workoutSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    type: { type: String, enum: activityTypes, required: true },
    level: { type: String, enum: fitnessLevels, required: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 180 },
    description: { type: String, required: true },
    steps: { type: [String], required: true },
    equipment: { type: String, default: 'None' },
  },
  { timestamps: true },
);

export const User = models.User || model('User', userSchema);
export const Team = models.Team || model('Team', teamSchema);
export const Activity = models.Activity || model('Activity', activitySchema);
export const Workout = models.Workout || model('Workout', workoutSchema);