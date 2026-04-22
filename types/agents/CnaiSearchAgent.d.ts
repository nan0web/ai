export class CnaiSearchAgent extends Model {
    static alias: string;
    static query: {
        help: string;
        type: string;
    };
    /**
     * @param {Partial<CnaiSearchAgent>} [data]
     * @param {import('@nan0web/types').ModelOptions} [options]
     */
    constructor(data?: Partial<CnaiSearchAgent>, options?: import("@nan0web/types").ModelOptions);
    /** @type {string} */
    query: string;
    run(): AsyncGenerator<import("@nan0web/ui/types/core/Intent").ProgressIntent | import("@nan0web/ui/types/core/Intent").ResultIntent, any, unknown>;
}
import { Model } from '@nan0web/types';
