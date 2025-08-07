// routes/adminRoutes.js
import express from 'express';
import {
    getDomainViews,
    analyticsTopPagesOverview,
    getAnalyticsSummary,
    getAnalyticsChartData,
    analyticsCities,
    trafficSources
} from '../controllers/analyticsController.js';

const router = express.Router();
router.get('/analytics-locations', analyticsCities);
router.get('/traffic-sources', trafficSources);
router.get('/analytics-summary', getAnalyticsSummary);
router.get('/analytics-chartdata', getAnalyticsChartData);
router.get('/analytics-top-pages', analyticsTopPagesOverview);
router.get('/analytics-domains', getDomainViews)



export default router;