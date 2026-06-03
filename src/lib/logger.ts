import prisma from './prisma';

type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SYSTEM';

interface LogData {
  userId?: string;
  userName?: string;
  action: ActionType;
  module: string;
  details: string;
  ipAddress?: string;
}

/**
 * Creates a new activity log entry in the database.
 * @param req The Astro Request object (used to extract IP address if available)
 * @param data The log details
 */
export async function logActivity(req: Request | null, data: LogData) {
  try {
    let ip = '';
    if (req) {
      ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    }

    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        module: data.module,
        details: data.details,
        ipAddress: ip,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}
