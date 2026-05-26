import { DbNode } from "../../models/DbNode";

export interface IHealthService {
    getNodes(): DbNode[];
    promoteSlave(idx: number): Promise<{ success: boolean; message: string }>;
}