import { seedDemo } from './scripts/seedDemo';

const DAY_MS = 24 * 60 * 60 * 1000;
const RESET_HOUR_UTC = 8;

function msUntilNextResetHour(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(RESET_HOUR_UTC, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

async function runReset(): Promise<void> {
  try {
    await seedDemo({ force: true });
  } catch (error) {
    console.error('Nightly demo reset failed:', error);
  }
}

export function scheduleDemoReset(): void {
  seedDemo({ force: false }).catch((error) =>
    console.error('Initial demo seed failed:', error)
  );

  setTimeout(() => {
    void runReset();
    setInterval(() => void runReset(), DAY_MS);
  }, msUntilNextResetHour());

  console.log('Demo nightly reset scheduled.');
}
