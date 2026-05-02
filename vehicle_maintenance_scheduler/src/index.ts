// Main entry point for Vehicle Maintenance Scheduler
// Fetches depots and vehicles from the evaluation server,
// then runs the 0/1 Knapsack algorithm for each depot.
import Logger from '../../logging_middleware/logger';
import { VehicleAPI } from './api';
import { VehicleScheduler } from './scheduler';
import config from './config';

async function main(): Promise<void> {
  const logger = new Logger(config.TOKEN);
  const api = new VehicleAPI(config.TOKEN, logger);
  const scheduler = new VehicleScheduler(logger);

  try {
    await logger.info('service', 'Vehicle Scheduler starting');

    // Fetch depots from evaluation server
    const depots = await api.getDepots();
    await logger.info('service', `Processing ${depots.length} depots`);

    // Fetch vehicles from evaluation server
    const vehicles = await api.getVehicles();
    await logger.info('service', `Processing ${vehicles.length} vehicles`);

    // Run knapsack scheduler for each depot
    const results = [];
    for (const depot of depots) {
      await logger.info('service', `Scheduling maintenance for depot ${depot.ID} (budget: ${depot.MechanicHours}h)`);
      const result = scheduler.schedule(vehicles, depot);
      results.push(result);

      await logger.info(
        'service',
        `Depot ${depot.ID}: Selected ${result.selectedVehicles.length} vehicles | ` +
        `Total Impact: ${result.totalImpact} | ` +
        `Hours Used: ${result.totalDuration}/${result.mechanicHoursBudget} (${result.utilizationPercent}%)`
      );
    }

    // Print final results
    console.log('\n=== VEHICLE SCHEDULING RESULTS ===\n');
    console.log(JSON.stringify(results, null, 2));

    console.log('\n=== SUMMARY ===');
    for (const r of results) {
      console.log(
        `Depot ${r.depotID}: ${r.selectedVehicles.length} vehicles scheduled | ` +
        `Impact: ${r.totalImpact} | ` +
        `Utilization: ${r.utilizationPercent}%`
      );
    }

    await logger.info('service', 'Vehicle scheduling completed successfully');
  } catch (error: any) {
    await logger.error('service', `Scheduling failed: ${error.message}`);
    process.exit(1);
  }
}

main();
