import type { Repository } from './repository.js';

export const cleanupCommandLogs=async(repository:Repository,now=new Date())=>repository.deleteCommandsBefore(new Date(now.getTime()-30*86_400_000));
export const CLEANUP_COMMAND_LOGS_SQL="DELETE FROM match_commands WHERE accepted_at < now() - interval '30 days'";
