import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { createToken, requireAuth } from './middleware/auth';
import { Activity, activityTypes, Team, User, Workout } from './models';

const router = Router();
const publicUserFields = 'name email fitnessLevel goal preferredActivities createdAt';
const pointsPerMinute: Record<string, number> = {
  walking: 1,
  running: 2,
  strength: 1.5,
  cycling: 1.5,
  yoga: 1.2,
};

function validId(id: string) {
  return Types.ObjectId.isValid(id);
}

function routeId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

router.get('/health', (_request, response) => {
  response.json({ status: 'ok', database: 'connected' });
});

router.post('/auth/register', async (request, response) => {
  const { name, email, password } = request.body;
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
    response.status(400).json({ message: 'Name must be between 2 and 60 characters.' });
    return;
  }
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    response.status(400).json({ message: 'Enter a valid email address.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    response.status(400).json({ message: 'Password must contain at least 8 characters.' });
    return;
  }
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    response.status(409).json({ message: 'An account with this email already exists.' });
    return;
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: await bcrypt.hash(password, 12),
  });
  response.status(201).json({
    token: createToken(String(user._id)),
    user: await User.findById(user._id).select(publicUserFields),
  });
});

router.post('/auth/login', async (request, response) => {
  const email = typeof request.body.email === 'string' ? request.body.email.toLowerCase().trim() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    response.status(401).json({ message: 'Email or password is incorrect.' });
    return;
  }
  response.json({
    token: createToken(String(user._id)),
    user: await User.findById(user._id).select(publicUserFields),
  });
});

router.get('/auth/me', requireAuth, async (request, response) => {
  const user = await User.findById(request.userId).select(publicUserFields);
  if (!user) {
    response.status(404).json({ message: 'Account not found.' });
    return;
  }
  response.json(user);
});

router.get('/users', requireAuth, async (_request, response) => {
  response.json(await User.find().select('name fitnessLevel').sort({ name: 1 }).limit(100));
});

router.patch('/users/me', requireAuth, async (request, response) => {
  const { name, goal, fitnessLevel, preferredActivities } = request.body;
  const updates: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 60) updates.name = name.trim();
  if (typeof goal === 'string' && goal.length <= 120) updates.goal = goal.trim();
  if (['beginner', 'intermediate', 'advanced'].includes(fitnessLevel)) updates.fitnessLevel = fitnessLevel;
  if (
    Array.isArray(preferredActivities) &&
    preferredActivities.every((type) => activityTypes.includes(type))
  ) {
    updates.preferredActivities = preferredActivities;
  }
  const user = await User.findByIdAndUpdate(request.userId, updates, { new: true, runValidators: true })
    .select(publicUserFields);
  response.json(user);
});

router.get('/teams', requireAuth, async (_request, response) => {
  const teams = await Team.find()
    .populate('ownerId', 'name')
    .populate('memberIds', 'name')
    .sort({ createdAt: -1 });
  response.json(teams);
});

router.post('/teams', requireAuth, async (request, response) => {
  const name = typeof request.body.name === 'string' ? request.body.name.trim() : '';
  if (name.length < 2 || name.length > 40) {
    response.status(400).json({ message: 'Team name must be between 2 and 40 characters.' });
    return;
  }
  const team = await Team.create({
    name,
    description: typeof request.body.description === 'string' ? request.body.description.slice(0, 180) : '',
    ownerId: request.userId,
    memberIds: [request.userId],
  });
  response.status(201).json(team);
});

router.post('/teams/:id/join', requireAuth, async (request, response) => {
  const id = routeId(request.params.id);
  if (!validId(id)) {
    response.status(400).json({ message: 'Invalid team.' });
    return;
  }
  const team = await Team.findById(id);
  if (!team) {
    response.status(404).json({ message: 'Team not found.' });
    return;
  }
  if (team.memberIds.some((memberId: Types.ObjectId) => String(memberId) === request.userId)) {
    response.status(409).json({ message: 'You are already on this team.' });
    return;
  }
  if (team.memberIds.length >= team.maxMembers) {
    response.status(409).json({ message: 'This team has reached its member limit.' });
    return;
  }
  team.memberIds.push(new Types.ObjectId(request.userId));
  await team.save();
  response.json(team);
});

router.post('/teams/:id/leave', requireAuth, async (request, response) => {
  const id = routeId(request.params.id);
  if (!validId(id)) {
    response.status(400).json({ message: 'Invalid team.' });
    return;
  }
  const team = await Team.findById(id);
  if (!team) {
    response.status(404).json({ message: 'Team not found.' });
    return;
  }
  if (String(team.ownerId) === request.userId) {
    response.status(400).json({ message: 'Team owners cannot leave. Transfer ownership first.' });
    return;
  }
  team.memberIds = team.memberIds.filter((memberId: Types.ObjectId) => String(memberId) !== request.userId);
  await team.save();
  response.json(team);
});

router.delete('/teams/:id', requireAuth, async (request, response) => {
  const id = routeId(request.params.id);
  if (!validId(id)) {
    response.status(400).json({ message: 'Invalid team.' });
    return;
  }
  const team = await Team.findOne({ _id: id, ownerId: request.userId });
  if (!team) {
    response.status(404).json({ message: 'Team not found or you are not its owner.' });
    return;
  }
  await Activity.updateMany({ teamId: team._id }, { $set: { teamId: null } });
  await team.deleteOne();
  response.status(204).end();
});

router.get('/activities', requireAuth, async (_request, response) => {
  response.json(await Activity.find()
    .populate('userId', 'name')
    .populate('teamId', 'name')
    .sort({ completedAt: -1 })
    .limit(50));
});

router.get('/activities/me', requireAuth, async (request, response) => {
  response.json(await Activity.find({ userId: request.userId })
    .populate('teamId', 'name')
    .sort({ completedAt: -1 })
    .limit(50));
});

router.post('/activities', requireAuth, async (request, response) => {
  const { type, durationMinutes, distanceKm, note, teamId } = request.body;
  if (!activityTypes.includes(type)) {
    response.status(400).json({ message: 'Choose a supported activity type.' });
    return;
  }
  const duration = Number(durationMinutes);
  if (!Number.isFinite(duration) || duration < 1 || duration > 600) {
    response.status(400).json({ message: 'Duration must be between 1 and 600 minutes.' });
    return;
  }
  let validTeamId: string | null = null;
  if (teamId) {
    if (!validId(teamId)) {
      response.status(400).json({ message: 'Invalid team.' });
      return;
    }
    const team = await Team.findOne({ _id: teamId, memberIds: request.userId });
    if (!team) {
      response.status(400).json({ message: 'Join this team before assigning an activity to it.' });
      return;
    }
    validTeamId = teamId;
  }
  const activity = await Activity.create({
    userId: request.userId,
    teamId: validTeamId,
    type,
    durationMinutes: duration,
    distanceKm: Number.isFinite(Number(distanceKm)) && Number(distanceKm) > 0 ? Number(distanceKm) : null,
    note: typeof note === 'string' ? note.slice(0, 180) : '',
    points: Math.max(1, Math.round(duration * pointsPerMinute[type])),
  });
  response.status(201).json(await activity.populate('teamId', 'name'));
});

router.delete('/activities/:id', requireAuth, async (request, response) => {
  const id = routeId(request.params.id);
  if (!validId(id)) {
    response.status(400).json({ message: 'Invalid activity.' });
    return;
  }
  const activity = await Activity.findOneAndDelete({ _id: id, userId: request.userId });
  if (!activity) {
    response.status(404).json({ message: 'Activity not found.' });
    return;
  }
  response.status(204).end();
});

router.get('/leaderboard', requireAuth, async (_request, response) => {
  const [users, teamTotals] = await Promise.all([
    Activity.aggregate([
      { $group: { _id: '$userId', points: { $sum: '$points' }, minutes: { $sum: '$durationMinutes' }, sessions: { $sum: 1 } } },
      { $sort: { points: -1, minutes: -1 } },
      { $limit: 100 },
    ]),
    Activity.aggregate([
      { $match: { teamId: { $ne: null } } },
      { $group: { _id: '$teamId', points: { $sum: '$points' }, minutes: { $sum: '$durationMinutes' }, sessions: { $sum: 1 } } },
      { $sort: { points: -1 } },
    ]),
  ]);
  const [members, teams] = await Promise.all([
    User.find({ _id: { $in: users.map((entry) => entry._id) } }).select('name'),
    Team.find({ _id: { $in: teamTotals.map((entry) => entry._id) } }).select('name'),
  ]);
  const memberNames = new Map(members.map((member) => [String(member._id), member.name]));
  const teamNames = new Map(teams.map((team) => [String(team._id), team.name]));
  response.json({
    users: users.map((entry) => ({ ...entry, name: memberNames.get(String(entry._id)) || 'Former member' })),
    teams: teamTotals.map((entry) => ({ ...entry, name: teamNames.get(String(entry._id)) || 'Former team' })),
  });
});

router.get('/workouts', requireAuth, async (_request, response) => {
  response.json(await Workout.find().sort({ level: 1, durationMinutes: 1 }));
});

router.get('/workouts/recommended', requireAuth, async (request, response) => {
  const user = await User.findById(request.userId).select('fitnessLevel preferredActivities');
  if (!user) {
    response.status(404).json({ message: 'Account not found.' });
    return;
  }
  const preferred = user.preferredActivities.length ? user.preferredActivities : activityTypes;
  const rank = { beginner: 0, intermediate: 1, advanced: 2 };
  const workouts = await Workout.find({
    type: { $in: preferred },
    level: { $in: fitnessRankLevels(user.fitnessLevel, rank) },
  }).sort({ durationMinutes: 1 });
  response.json(workouts);
});

function fitnessRankLevels(level: string, rank: Record<string, number>) {
  return Object.keys(rank).filter((candidate) => rank[candidate] <= rank[level]);
}

export default router;