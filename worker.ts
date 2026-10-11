import { startWorker } from './src/lib/worker';

// Start the worker
startWorker();

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n👋 Worker stopped');
  process.exit(0);
});
