declare namespace _default {
    export { makeFlat };
}
export default _default;
/**
 * @param {object[]} models
 * @returns {ModelInfo[]}
 */
declare function makeFlat(models: object[]): ModelInfo[];
import { ModelInfo } from '../domain/ModelInfo.js';
