// Knapsack-based vehicle scheduler
// Solves the 0/1 Knapsack Problem to maximize impact within mechanic-hour budget
import Logger from '../../logging_middleware/logger';
import { Vehicle, ScheduleResult, Depot } from './models';

export class VehicleScheduler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Solves 0/1 Knapsack Problem
   * Items     = Vehicles (each with Duration and Impact)
   * Capacity  = MechanicHours budget for the depot
   * Goal      = Maximize total Impact without exceeding capacity
   *
   * Time Complexity:  O(n × capacity)
   * Space Complexity: O(n × capacity)
   */
  schedule(vehicles: Vehicle[], depot: Depot): ScheduleResult {
    const capacity = depot.MechanicHours;
    const n = vehicles.length;

    this.logger.info('service', `Running knapsack for depot ${depot.ID}: ${n} vehicles, budget=${capacity}h`);

    // Create DP table: dp[i][w] = max impact using first i vehicles with capacity w
    const dp: number[][] = Array(n + 1)
      .fill(null)
      .map(() => Array(capacity + 1).fill(0));

    // Fill DP table bottom-up
    for (let i = 1; i <= n; i++) {
      const vehicle = vehicles[i - 1];
      for (let w = 0; w <= capacity; w++) {
        // Option 1: skip this vehicle
        dp[i][w] = dp[i - 1][w];

        // Option 2: include this vehicle if it fits
        if (vehicle.Duration <= w) {
          dp[i][w] = Math.max(
            dp[i][w],
            dp[i - 1][w - vehicle.Duration] + vehicle.Impact
          );
        }
      }
    }

    // Backtrack through DP table to find which vehicles were selected
    const selected: Vehicle[] = [];
    let currentCapacity = capacity;

    for (let i = n; i > 0; i--) {
      if (dp[i][currentCapacity] !== dp[i - 1][currentCapacity]) {
        const vehicle = vehicles[i - 1];
        selected.push(vehicle);
        currentCapacity -= vehicle.Duration;
      }
    }

    const totalDuration = selected.reduce((sum, v) => sum + v.Duration, 0);
    const totalImpact = selected.reduce((sum, v) => sum + v.Impact, 0);

    const result: ScheduleResult = {
      depotID: depot.ID,
      selectedVehicles: selected,
      totalDuration,
      totalImpact,
      mechanicHoursBudget: capacity,
      utilizationPercent: capacity > 0 ? Math.round((totalDuration / capacity) * 100) : 0
    };

    return result;
  }
}
