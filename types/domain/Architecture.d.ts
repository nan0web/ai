/**
 * Architecture — represents model architecture and modality information.
 */
export class Architecture extends Model {
    /** @type {{ help: string, default: string[] }} */
    static input_modalities: {
        help: string;
        default: string[];
    };
    static instruct_type: {
        help: string;
        default: string;
    };
    static modality: {
        help: string;
        default: string;
    };
    /** @type {{ help: string, default: string[] }} */
    static output_modalities: {
        help: string;
        default: string[];
    };
    static tokenizer: {
        help: string;
        default: string;
    };
    static context_length: {
        help: string;
        default: number;
    };
    /**
     * @param {Record<string, any>} [data] Input data
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
     */
    constructor(data?: Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions>);
    /** @type {string[]} Input modes (text/img) */
    input_modalities: string[];
    /** @type {string[]} Output modes (text/img) */
    output_modalities: string[];
    /** @type {string} Type of instruction kit */ instruct_type: string;
    /** @type {string} Primary model modality */ modality: string;
    /** @type {string} Tokenizer used by model */ tokenizer: string;
    /** @type {number} Native context window */ context_length: number;
}
import { Model } from '@nan0web/types';
