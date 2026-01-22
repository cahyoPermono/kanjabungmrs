import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        divisionId: number;
    };
}
export declare const getTasks: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createTask: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTask: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addComment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTask: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTaskHistory: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=taskController.d.ts.map