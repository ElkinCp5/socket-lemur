export declare enum LogLevel {
    INFO = "INFO",
    ERROR = "ERROR",
    WARNING = "WARNING",
}

export declare interface LoggerSystem {
    log(level: LogLevel, message: string, meta?: any): Promise<void>;
    error(message: string, error?: any): Promise<void>;
    warn(message: string, meta?: any): Promise<void>;
    info(message: string, meta?: any): Promise<void>;
}
