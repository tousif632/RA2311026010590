import axios from 'axios';

interface LogRequest {
  stack: 'backend' | 'frontend';
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  package: string;
  message: string;
}

class Logger {
  private token: string;
  private logApiUrl = 'http://20.207.122.201/evaluation-service/logs';

  constructor(token: string) {
    this.token = token;
  }

  async log(
    stack: 'backend' | 'frontend',
    level: LogRequest['level'],
    package_name: string,
    message: string
  ): Promise<void> {
    try {
      const response = await axios.post(
        this.logApiUrl,
        {
          stack,
          level,
          package: package_name,
          message
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Also log to console
      console.log(`[${level.toUpperCase()}] ${package_name}: ${message}`);
      console.log('Server Response:', response.data);
    } catch (error) {
      console.error('Failed to log:', error);
    }
  }

  // Helper methods for different log levels
  async debug(package_name: string, message: string): Promise<void> {
    await this.log('backend', 'debug', package_name, message);
  }

  async info(package_name: string, message: string): Promise<void> {
    await this.log('backend', 'info', package_name, message);
  }

  async warn(package_name: string, message: string): Promise<void> {
    await this.log('backend', 'warn', package_name, message);
  }

  async error(package_name: string, message: string): Promise<void> {
    await this.log('backend', 'error', package_name, message);
  }

  async fatal(package_name: string, message: string): Promise<void> {
    await this.log('backend', 'fatal', package_name, message);
  }
}

export default Logger;
