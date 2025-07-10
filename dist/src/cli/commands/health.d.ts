/**
 * Health command - Check system health
 */
interface HealthOptions {
    detailed?: boolean;
    json?: boolean;
}
/**
 * Health check command
 */
export declare function healthCommand(options: HealthOptions): Promise<void>;
export {};
//# sourceMappingURL=health.d.ts.map