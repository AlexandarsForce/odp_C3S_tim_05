import { DbNode } from "../../models/DbNode";

export interface IHealthService {
    getHealthStatus(): DbNode[];
    promoteSlaveToMaster(idx: number): Promise<{ success: boolean; message: string }>;
    isWriteAvailable(): boolean;
}