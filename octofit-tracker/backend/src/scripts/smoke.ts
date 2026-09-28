import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Activity, Team, User } from '../models';

const apiUrl = process.env.SMOKE_API_URL || 'http://localhost:8000/api';
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const emails = [`octofit-smoke-a-${suffix}@example.test`, `octofit-smoke-b-${suffix}@example.test`];
const tokens: string[] = [];
let createdTeamId = '';

async function request(path: string, token?: string, body?: unknown, method = 'GET') {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = response.status === 204 ? null : await response.json();
  return { response, result };
}

async function run() {
  await connectDatabase();
  const first = await request('/auth/register', undefined, {
    name: 'Smoke Runner A', email: emails[0], password: 'octofit-smoke-pass',
  }, 'POST');
  assert.equal(first.response.status, 201, 'register a student');
  tokens.push(first.result.token);
  const firstId = String(first.result.user._id);

  const duplicate = await request('/auth/register', undefined, {
    name: 'Smoke Runner A', email: emails[0], password: 'octofit-smoke-pass',
  }, 'POST');
  assert.equal(duplicate.response.status, 409, 'reject a duplicate email');

  const login = await request('/auth/login', undefined, {
    email: emails[0], password: 'octofit-smoke-pass',
  }, 'POST');
  assert.equal(login.response.status, 200, 'sign in a student');
  const privateBoard = await request('/leaderboard');
  assert.equal(privateBoard.response.status, 401, 'require sign-in for student activity data');
  const profile = await request('/users/me', tokens[0], {
    name: 'Smoke Runner A', goal: 'Move more', fitnessLevel: 'intermediate', preferredActivities: ['strength'],
  }, 'PATCH');
  assert.equal(profile.response.status, 200, 'update student preferences');
  assert.equal(profile.result.goal, 'Move more');

  const second = await request('/auth/register', undefined, {
    name: 'Smoke Runner B', email: emails[1], password: 'octofit-smoke-pass',
  }, 'POST');
  assert.equal(second.response.status, 201, 'register a second student');
  tokens.push(second.result.token);
  const teamResponse = await request('/teams', tokens[0], {
    name: `Smoke Crew ${suffix}`, description: 'Temporary API smoke test team',
  }, 'POST');
  assert.equal(teamResponse.response.status, 201, 'create a team');
  createdTeamId = teamResponse.result._id;
  const join = await request(`/teams/${createdTeamId}/join`, tokens[1], undefined, 'POST');
  assert.equal(join.response.status, 200, 'join a team');

  const activity = await request('/activities', tokens[0], {
    type: 'strength', durationMinutes: 30, teamId: createdTeamId, note: 'Temporary test session',
  }, 'POST');
  assert.equal(activity.response.status, 201, 'log an activity');
  assert.equal(activity.result.points, 45, 'calculate activity points');
  const myActivities = await request('/activities/me', tokens[0]);
  assert.equal(myActivities.result[0]._id, activity.result._id, "list a student's activities");

  const recommendations = await request('/workouts/recommended', tokens[0]);
  assert.equal(recommendations.response.status, 200, 'get personalized recommendations');
  assert.ok(recommendations.result.some((workout: { type: string }) => workout.type === 'strength'));
  assert.ok(recommendations.result.every((workout: { type: string }) => workout.type === 'strength'));

  const leaderboard = await request('/leaderboard', tokens[0]);
  assert.equal(leaderboard.response.status, 200, 'load the leaderboard');
  assert.ok(leaderboard.result.users.some((entry: { _id: string }) => entry._id === firstId));
  assert.ok(leaderboard.result.teams.some((entry: { _id: string }) => entry._id === createdTeamId));

  const nonOwnerCannotDelete = await request(`/teams/${createdTeamId}`, tokens[1], undefined, 'DELETE');
  assert.equal(nonOwnerCannotDelete.response.status, 404, 'prevent non-owners from deleting a team');
  const deleteTeam = await request(`/teams/${createdTeamId}`, tokens[0], undefined, 'DELETE');
  assert.equal(deleteTeam.response.status, 204, 'allow the owner to delete a team');

  const deleted = await request(`/activities/${activity.result._id}`, tokens[0], undefined, 'DELETE');
  assert.equal(deleted.response.status, 204, 'delete an activity');
  console.log('Smoke test passed: auth, profile, teams, activities, points, recommendations, and leaderboard.');
}

run()
  .catch((error) => {
    console.error('Smoke test failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find({ email: { $in: emails } }).select('_id');
      const userIds = users.map((user) => user._id);
      await Promise.all([
        Activity.deleteMany({ userId: { $in: userIds } }),
        Team.deleteMany({ ownerId: { $in: userIds } }),
        User.deleteMany({ _id: { $in: userIds } }),
      ]);
      await mongoose.disconnect();
    }
  });