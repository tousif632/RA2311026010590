interface LogRequest {
    stack: 'backend' | 'frontend';
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    package: string;
    message: string;
}
declare class Logger {
    private token;
    private logApiUrl;
    constructor(token: string);
    log(stack: 'backend' | 'frontend', level: LogRequest['level'], package_name: string, message: string): Promise<void>;
    debug(package_name: string, message: string): Promise<void>;
    info(package_name: string, message: string): Promise<void>;
    warn(package_name: string, message: string): Promise<void>;
    error(package_name: string, message: string): Promise<void>;
    fatal(package_name: string, message: string): Promise<void>;
}
export default Logger;
