"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class Logger {
    constructor(token) {
        this.logApiUrl = 'http://20.207.122.201/evaluation-service/logs';
        this.token = token;
    }
    async log(stack, level, package_name, message) {
        try {
            const response = await axios_1.default.post(this.logApiUrl, {
                stack,
                level,
                package: package_name,
                message
            }, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            // Also log to console
            console.log(`[${level.toUpperCase()}] ${package_name}: ${message}`);
            console.log('Server Response:', response.data);
        }
        catch (error) {
            console.error('Failed to log:', error);
        }
    }
    // Helper methods for different log levels
    async debug(package_name, message) {
        await this.log('backend', 'debug', package_name, message);
    }
    async info(package_name, message) {
        await this.log('backend', 'info', package_name, message);
    }
    async warn(package_name, message) {
        await this.log('backend', 'warn', package_name, message);
    }
    async error(package_name, message) {
        await this.log('backend', 'error', package_name, message);
    }
    async fatal(package_name, message) {
        await this.log('backend', 'fatal', package_name, message);
    }
}
exports.default = Logger;
