/**
 * Config command - Manage configuration settings
 */
interface ConfigOptions {
    show?: boolean;
    reset?: boolean;
    set?: string;
    get?: string;
}
/**
 * Config command handler
 */
export declare function configCommand(options: ConfigOptions): Promise<void>;
export {};
//# sourceMappingURL=config.d.ts.map