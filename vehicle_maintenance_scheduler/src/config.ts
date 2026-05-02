// Config for Vehicle Maintenance Scheduler
import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  TOKEN: process.env.ACCESS_TOKEN || '',
  BASE_URL: 'http://20.207.122.201/evaluation-service',
  LOG_LEVEL: 'info'
};

if (!config.TOKEN) {
  throw new Error('ACCESS_TOKEN environment variable not set. Please create a .env file with ACCESS_TOKEN=your-token-here');
}

export default config;
