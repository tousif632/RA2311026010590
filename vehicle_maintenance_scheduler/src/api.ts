// API service for fetching depots and vehicles from evaluation server
import axios, { AxiosInstance } from 'axios';
import Logger from '../../logging_middleware/logger';
import { Depot, Vehicle } from './models';

export class VehicleAPI {
  private client: AxiosInstance;
  private logger: Logger;
  private baseURL = 'http://20.207.122.201/evaluation-service';

  constructor(token: string, logger: Logger) {
    this.logger = logger;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Fetch all depots from the evaluation server
   * Each depot has an ID and MechanicHours budget
   */
  async getDepots(): Promise<Depot[]> {
    try {
      await this.logger.info('service', 'Fetching depots from evaluation server');
      const response = await this.client.get('/depots');
      await this.logger.info('service', `Successfully fetched ${response.data.depots.length} depots`);
      return response.data.depots;
    } catch (error: any) {
      await this.logger.error('service', `Failed to fetch depots: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch all vehicles from the evaluation server
   * Each vehicle has a TaskID, Duration (mechanic hours needed), and Impact score
   */
  async getVehicles(): Promise<Vehicle[]> {
    try {
      await this.logger.info('service', 'Fetching vehicles from evaluation server');
      const response = await this.client.get('/vehicles');
      await this.logger.info('service', `Successfully fetched ${response.data.vehicles.length} vehicles`);
      return response.data.vehicles;
    } catch (error: any) {
      await this.logger.error('service', `Failed to fetch vehicles: ${error.message}`);
      throw error;
    }
  }
}
