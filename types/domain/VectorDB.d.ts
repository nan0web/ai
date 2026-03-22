export class VectorDB {
    constructor(config?: {});
    dim: any;
    space: any;
    maxElements: any;
    index: hnswlib.HierarchicalNSW;
    metadata: Map<any, any>;
    nextId: number;
    addVector(vector: any, meta?: {}): number;
    search(vector: any, k?: number): any[];
    save(filePath: any): Promise<void>;
    load(filePath: any): Promise<boolean>;
}
import hnswlib from 'hnswlib-node';
