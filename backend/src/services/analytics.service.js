import { prisma } from '../config/prisma.js';

// Per user: overdue count + avg completion time (approx via updated_at - created_at on DONE).
export async function getAnalytics(organizationId) {
  const rows = await prisma.$queryRaw`
    SELECT
      u.id    AS "userId",
      u.name  AS "name",
      u.email AS "email",
      COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.status <> 'DONE')::int AS "overdueCount",
      COUNT(t.id) FILTER (WHERE t.status = 'DONE')::int AS "completedCount",
      COALESCE(
        ROUND(AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600.0)
          FILTER (WHERE t.status = 'DONE')::numeric, 2),
        0
      )::float8 AS "avgCompletionHours"
    FROM users u
    LEFT JOIN tasks t ON t.assignee_id = u.id
    WHERE u.organization_id = ${organizationId}
    GROUP BY u.id, u.name, u.email
    ORDER BY "overdueCount" DESC, u.name ASC
  `;

  return {
    generatedAt: new Date().toISOString(),
    totalOverdue: rows.reduce((sum, r) => sum + r.overdueCount, 0),
    perUser: rows,
  };
}
