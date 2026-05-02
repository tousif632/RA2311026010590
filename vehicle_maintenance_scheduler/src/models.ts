// Data models for Vehicle Maintenance Scheduler

export interface Depot {
  ID: number;
  MechanicHours: number;
}

export interface Vehicle {
  TaskID: string;
  Duration: number;
  Impact: number;
}

export interface ScheduleResult {
  depotID: number;
  selectedVehicles: Vehicle[];
  totalDuration: number;
  totalImpact: number;
  mechanicHoursBudget: number;
  utilizationPercent: number;
}
