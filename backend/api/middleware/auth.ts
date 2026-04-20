import type {NextFunction, Request, Response} from 'express';

import {getSupabaseAdmin} from '../supabase';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({error: 'missing_token'});
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const {data, error} = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({error: 'invalid_token'});
    return;
  }

  req.userId = data.user.id;
  next();
}
