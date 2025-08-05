// routes/adminRoutes.js
import express from 'express';
import { analyticsTopPagesOverview, getAnalyticsSummary, getAnalyticsChartData, analyticsCities, analyticsOverview, trafficSources } from '../controllers/analyticsController.js';

const router = express.Router();
router.get('/analytics-locations', analyticsCities);
router.get('/traffic-sources', trafficSources);
router.get('/overview', analyticsOverview);
router.get('/analytics-summary', getAnalyticsSummary);
router.get('/analytics-chartdata', getAnalyticsChartData);
router.get('/analytics-top-pages', analyticsTopPagesOverview)



export default router;