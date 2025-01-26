import { LoggerSystem, LogLevel } from "../../dts/logger";

/**
 * Class Logger.
 * @description A class for logging messages with different severity levels.
 */
export class Logger implements LoggerSystem {
    /**
     * Creates an instance of Logger with the provided name.
     * @param name The name of the logger.
     */
    constructor(private readonly name: string) { }

    /**
     * Formats a message with metadata and error details.
     * @param level The severity level of the message.
     * @param message The message to format.
     * @param error (Optional) The error associated with the message.
     * @returns The formatted message.
     */
    private format(level: LogLevel, message: string, error?: any): any {
        return {
            date: new Date().toISOString(),
            type: `[${this.name}]:[${level}]`,
            message,
            error
        };
    }

    /**
     * Logs a message with INFO severity level.
     * @param message The message to log.
     * @param error (Optional) The error associated with the message.
     */
    async log(level: LogLevel, message: string, error?: any): Promise<void> {
        const formattedMessage = this.format(level, message, error);
        console.info("===============================");
        console.log(formattedMessage);
        console.info("===============================");
    }

    /**
     * Logs a message with INFO severity level.
     * @param message The message to log.
     * @param error (Optional) The error associated with the message.
     */
    async info(message: string, meta?: any): Promise<void> {
        await this.log(LogLevel.INFO, message, meta);
    }

    /**
     * Logs an error message with ERROR severity level.
     * @param message The error message to log.
     * @param error (Optional) The error associated with the message.
     */
    async error(message: string, error?: any): Promise<void> {
        await this.log(LogLevel.ERROR, message, error);
    }

    /**
     * Logs a warning message with WARNING severity level.
     * @param message The warning message to log.
     * @param error (Optional) The error associated with the message.
    */
    async warn(message: string, meta?: any): Promise<void> {
        await this.log(LogLevel.WARNING, message, meta);
    }
}
