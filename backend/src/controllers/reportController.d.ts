import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        divisionId: number;
    };
}
export declare const getDashboardStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=reportController.d.ts.map