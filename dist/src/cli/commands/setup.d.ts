/**
 * Setup command - Interactive setup wizard
 */
interface SetupOptions {
    force?: boolean;
    minimal?: boolean;
    comprehensive?: boolean;
    verbose?: boolean;
    claudeDesktop?: boolean;
    claudeCode?: boolean;
    project?: boolean;
    auto?: boolean;
}
/**
 * Main setup command handler
 */
export declare function setupCommand(options?: SetupOptions): Promise<void>;
export {};
//# sourceMappingURL=setup.d.ts.map