declare namespace _default {
    export { getModels };
    export { makeFlat };
}
export default _default;
declare function getModels(): {
    models: [string, {
        context_length: number;
    }][];
};
declare function makeFlat(models?: any[]): ModelInfo[];
import { ModelInfo } from '../domain/ModelInfo.js';
