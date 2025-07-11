/**
 * Models command - Manage AI models
 */
interface ModelOptions {
    list?: boolean;
    pull?: string;
    remove?: string;
    update?: boolean;
}
export declare function modelsCommand(options: ModelOptions): Promise<void>;
export {};
//# sourceMappingURL=models.d.ts.map