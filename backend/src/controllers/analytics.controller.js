import { asyncHandler } from '../utils/asyncHandler.js';
import * as analyticsService from '../services/analytics.service.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  res.status(200).json(await analyticsService.getAnalytics(req.user.organizationId));
});
