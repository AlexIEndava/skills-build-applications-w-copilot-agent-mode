import mongoose from 'mongoose';
import { Workout } from '../models';

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/octofit_db';
const workouts = [
  {
    title: 'The easy-mile reset',
    type: 'running',
    level: 'beginner',
    durationMinutes: 20,
    description: 'An easy run-walk loop to get moving without worrying about pace.',
    equipment: 'Comfortable shoes',
    steps: ['Walk briskly for 4 minutes.', 'Alternate 2 minutes of easy jogging and 2 minutes of walking for 12 minutes.', 'Walk slowly for the final 4 minutes.'],
  },
  {
    title: 'Campus walk and unwind',
    type: 'walking',
    level: 'beginner',
    durationMinutes: 18,
    description: 'A quick outdoor reset at a pace that lets you talk comfortably.',
    equipment: 'Comfortable shoes',
    steps: ['Walk easily for 3 minutes.', 'Walk purposefully for 12 minutes.', 'Slow down and take 3 relaxed breaths.'],
  },
  {
    title: 'No-equipment strength',
    type: 'strength',
    level: 'beginner',
    durationMinutes: 16,
    description: 'A short whole-body circuit. Take a break whenever you need one.',
    equipment: 'None',
    steps: ['Do 8 chair squats and 8 wall push-ups.', 'Hold a comfortable plank for 15 seconds.', 'Repeat the circuit 3 times at your own pace.'],
  },
  {
    title: 'Steady spin',
    type: 'cycling',
    level: 'intermediate',
    durationMinutes: 25,
    description: 'Build a steady rhythm with a few short, optional pick-ups.',
    equipment: 'Bicycle and helmet',
    steps: ['Ride easily for 5 minutes.', 'Ride steadily for 15 minutes, adding 3 comfortable 30-second pick-ups.', 'Spin easily for 5 minutes.'],
  },
  {
    title: 'After-class stretch flow',
    type: 'yoga',
    level: 'beginner',
    durationMinutes: 14,
    description: 'A gentle stretch to unwind after class or practice.',
    equipment: 'Mat optional',
    steps: ['Take 5 slow breaths in a comfortable seated position.', 'Flow through cat-cow and a gentle low lunge on each side.', 'Finish with a relaxed forward fold.'],
  },
  {
    title: 'Strong and steady circuit',
    type: 'strength',
    level: 'intermediate',
    durationMinutes: 24,
    description: 'A balanced bodyweight circuit with controlled, comfortable reps.',
    equipment: 'Mat optional',
    steps: ['Complete 10 reverse lunges per side.', 'Complete 10 incline push-ups and 12 glute bridges.', 'Repeat for 3 rounds, resting as needed.'],
  },
];

/**
 * Seed the octofit_db database with test data
 */
async function seedDatabase() {
  try {
    await mongoose.connect(connectionString);

    console.log('Connected to octofit_db');

    await Promise.all(workouts.map((workout) => Workout.updateOne(
      { title: workout.title },
      { $set: workout },
      { upsert: true },
    )));

    console.log(`Workout catalog ready (${workouts.length} workouts)`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
