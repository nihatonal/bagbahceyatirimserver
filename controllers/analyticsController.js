import path from 'path';
import { subDays, format } from "date-fns";
import { fileURLToPath } from 'url';
// import analyticsDataClientt from '../utils/analyticsClient'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { BetaAnalyticsDataClient } from '@google-analytics/data';
// Google Analytics hizmet hesabı anahtar dosyasının yolu
const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFile: path.join(__dirname, '../config/GA_KEY.json'),
});

const GA_PROPERTY = 'properties/479914818';

function formatDate(dateStr) {
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const year = dateStr.slice(0, 4);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = dateStr.slice(6, 8);
  return `${months[month]} ${day}`;
}


// Aylık kullanıcı verisi (son 12 ay)
export const analyticsWeekly = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    res.json(response);
  } catch (error) {
    console.error('Haftalık  analytics hatası:', error);
    res.status(500).json({ error: 'Veri alınamadı' });
  }
};


// Trafik kaynakları
export const analyticsTrafficSources = async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
    });

    res.json(response);
  } catch (error) {
    console.error('Traffic Source Error:', error);
    res.status(500).json({ error: 'Analytics error' });
  }
};




export const topPages = async (req, res) => {

  try {
    const [response] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dimensions: [
        { name: 'pageTitle' },
        { name: 'pagePath' },
      ],
      metrics: [
        { name: 'screenPageViews' },
      ],
      dateRanges: [
        { startDate: '7daysAgo', endDate: 'today' },
      ],
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true,
        },
      ],
      limit: 10,
    });

    res.json(response);
  } catch (error) {
    console.error('Top pages hatası:', error);
    res.status(500).json({ error: 'En çok görüntülenen sayfalar alınamadı' });
  }
};

// routes/analytics.js ya da controller dosyanız içine ekleyin

export const analyticsVisitsComparison = async (req, res) => {
  const { range } = req.query;

  // Tarih aralıkları (haftalık, aylık, vs)
  const ranges = {
    daily: { current: '1daysAgo', previous: '2daysAgo' },   // sadece örnek
    weekly: { current: '7daysAgo', previous: '14daysAgo' },
    monthly: { current: '30daysAgo', previous: '60daysAgo' },
    quarterly: { current: '90daysAgo', previous: '180daysAgo' },
  };

  const selectedRange = ranges[range] || ranges.weekly;

  try {
    // Current dönemi raporu (date dimension ile)
    const [currentResponse] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: selectedRange.current, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    // Previous dönemi raporu
    const [previousResponse] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: selectedRange.previous, endDate: selectedRange.current }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    // previousResponse'daki datayı kolay erişim için Map yapalım
    const previousMap = new Map();
    (previousResponse.rows || []).forEach(row => {
      previousMap.set(row.dimensionValues[0].value, parseInt(row.metricValues[0].value, 10));
    });

    // Formatlanmış tarih isimleri için yardımcı fonksiyon (gün.ay formatında)
    const formatDate = (dateStr) => {
      // dateStr 'YYYYMMDD' formatında
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const year = dateStr.slice(0, 4);
      const month = parseInt(dateStr.slice(4, 6), 10) - 1;
      const day = dateStr.slice(6, 8);
      return `${day} ${months[month]}`;
    };

    // Şimdi current dönem verisini previous ile eşleştirip array oluşturuyoruz
    const visits = (currentResponse.rows || []).map(row => {
      const date = row.dimensionValues[0].value;
      const current = parseInt(row.metricValues[0].value, 10);
      const previous = previousMap.get(date) || 0;
      const change = current - previous;

      return {
        day: formatDate(date),
        current,
        previous,
        change,
      };
    });

    res.json(visits);
  } catch (error) {
    console.error('analyticsVisitsComparison error:', error);
    res.status(500).json({ error: 'Ziyaretçi karşılaştırma verisi alınamadı' });
  }
};




export const analyticsTopPagesByRange = async (req, res) => {
  try {
    const { range } = req.query;

    // Varsayılan range: 7 gün
    let startDate = '7daysAgo';

    switch (range) {
      case 'daily':
        startDate = '1daysAgo';
        break;
      case 'weekly':
        startDate = '7daysAgo';
        break;
      case 'monthly':
        startDate = '30daysAgo';
        break;
      case 'quarterly':
        startDate = '90daysAgo';
        break;
      default:
        startDate = '7daysAgo';
    }

    const [response] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dimensions: [
        { name: 'pageTitle' },
        { name: 'pagePath' },
      ],
      metrics: [
        { name: 'screenPageViews' },
      ],
      dateRanges: [
        { startDate, endDate: 'today' },
      ],
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true,
        },
      ],
      limit: 10,
    });

    // Aynı path’lerin varyasyonlarını (örn. "/tr", "/") filtrele
    const cleaned = [];
    const seenPaths = new Set();

    for (const row of response.rows || []) {
      const title = row.dimensionValues[0].value;
      const path = row.dimensionValues[1].value;
      const views = parseInt(row.metricValues[0].value, 10);

      // /admin sayfalarını atla
      if (path.startsWith('/admin')) continue;

      // Aynı sayfa: "/" ve "/tr"
      const normalized = path === '/tr' ? '/' : path;

      if (!seenPaths.has(normalized)) {
        cleaned.push({ title, path: normalized, views });
        seenPaths.add(normalized);
      }
    }

    res.json(cleaned);
  } catch (error) {
    console.error('Top Pages Error:', error);
    res.status(500).json({ error: 'Top pages verisi alınamadı' });
  }
};


export const analyticsOverview = async (req, res) => {
  const { range: rawRange, viewType } = req.query;

  const rangeMap = {
    daily: '7d',
    weekly: '30d',
    monthly: '90d',
  };

  const ranges = {
    '7d': { start: '7daysAgo', previous: '14daysAgo', group: 'day' },
    '30d': { start: '30daysAgo', previous: '60daysAgo', group: 'week' },
    '90d': { start: '90daysAgo', previous: '180daysAgo', group: 'month' },
  };

  const labels = {
    '7d': ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    '30d': ['1. Hafta', '2. Hafta', '3. Hafta', '4. Hafta'],
    '90d': ['1. Ay', '2. Ay', '3. Ay'],
  };

  const range = rangeMap[rawRange] || rawRange; // "daily" → "7d" vs.
  const selected = ranges[range] || ranges['7d'];

  try {
    // 📊 1. Dönem verileri: bounceRate dahil
    const [detailedReport] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: selected.start, endDate: 'today' }],
      dimensions: [{ name: selected.group }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ dimension: { dimensionName: selected.group } }],
    });

    const grouped = {};
    for (const row of detailedReport.rows || []) {
      const groupValue = row.dimensionValues[0].value;
      const views = parseInt(row.metricValues[0].value, 10);
      const sessions = parseInt(row.metricValues[1].value, 10);
      const bounceRate = parseFloat(row.metricValues[2].value);

      let label = '';

      if (range === '7d') {
        const index = parseInt(groupValue, 10);
        label = labels[range]?.[index] || `Grup ${groupValue}`;
      } else if (range === '30d') {
        const weekMatch = groupValue.match(/W(\d+)/);
        label = weekMatch ? `${weekMatch[1]}. Hafta` : groupValue;
      } else if (range === '90d') {
        const monthMatch = groupValue.match(/-(\d{2})$/);
        label = monthMatch ? `${parseInt(monthMatch[1], 10)}. Ay` : groupValue;
      } else {
        label = groupValue;
      }

      grouped[groupValue] = {
        name: label,
        views,
        sessions,
        bounceRate: Number(bounceRate.toFixed(1)), // % olarak dönmeye hazır
      };
    }

    // 📈 2. Özet metrikler
    const [summaryCurrent] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: selected.start, endDate: 'today' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    });

    const [summaryPrevious] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: selected.previous, endDate: selected.start }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    });

    const curr = summaryCurrent.rows?.[0]?.metricValues || [];
    const prev = summaryPrevious.rows?.[0]?.metricValues || [];

    const metrics = {
      totalPageViews: {
        value: Number(curr[0]?.value || 0).toLocaleString('tr-TR'),
        change: calculateChange(curr[0]?.value, prev[0]?.value),
      },
      uniqueVisitors: {
        value: Number(curr[1]?.value || 0).toLocaleString('tr-TR'),
        change: calculateChange(curr[1]?.value, prev[1]?.value),
      },
      avgSessionDuration: {
        value: formatSeconds(curr[2]?.value),
        change: calculateTimeChange(curr[2]?.value, prev[2]?.value),
      },
      bounceRate: {
        value: parseFloat(curr[3]?.value || 0).toFixed(1) + '%',
        change: calculateChange(curr[3]?.value, prev[3]?.value),
      },
    };

    res.json({
      pageViews: Object.values(grouped),
      metrics,
    });
  } catch (error) {
    console.error('analyticsOverview error:', error);
    res.status(500).json({ error: 'Analytics overview verisi alınamadı' });
  }
};

// Yardımcı süre formatlama (örn: 154 -> 2m 34s)function calculateChange(current, previous) {
function calculateChange(current, previous) {
  const curr = parseFloat(current) || 0;
  const prev = parseFloat(previous) || 0;
  if (prev === 0) return 0;
  const change = ((curr - prev) / prev) * 100;
  return parseFloat(change.toFixed(1));
}

function calculateTimeChange(currentStr, previousStr) {
  const toSeconds = (value) => Math.floor(parseFloat(value) || 0);
  return calculateChange(toSeconds(currentStr), toSeconds(previousStr));
}

function formatSeconds(value) {
  const seconds = Math.floor(parseFloat(value) || 0);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

////////////////////
// Get Metrics
export const getAnalyticsSummary = async (req, res) => {
  const { range: rawRange } = req.query;

  const rangeMap = {
    daily: '7d',
    weekly: '30d',
    monthly: '90d',
  };

  const ranges = {
    '7d': { start: '7daysAgo', previous: '14daysAgo' },
    '30d': { start: '30daysAgo', previous: '60daysAgo' },
    '90d': { start: '90daysAgo', previous: '180daysAgo' },
  };

  const range = rangeMap[rawRange] || rawRange;
  const selected = ranges[range] || ranges['7d'];

  try {
    const [current] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: selected.start, endDate: 'today' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    });

    const [previous] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: selected.previous, endDate: selected.start }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    });

    const curr = current.rows?.[0]?.metricValues || [];
    const prev = previous.rows?.[0]?.metricValues || [];

    const metrics = {
      totalPageViews: {
        value: Number(curr[0]?.value || 0).toLocaleString('tr-TR'),
        change: calculateChange(curr[0]?.value, prev[0]?.value),
      },
      uniqueVisitors: {
        value: Number(curr[1]?.value || 0).toLocaleString('tr-TR'),
        change: calculateChange(curr[1]?.value, prev[1]?.value),
      },
      avgSessionDuration: {
        value: formatSeconds(curr[2]?.value),
        change: calculateTimeChange(curr[2]?.value, prev[2]?.value),
      },
      bounceRate: {
        value: parseFloat(curr[3]?.value || 0).toFixed(1) + '%',
        change: calculateChange(curr[3]?.value, prev[3]?.value),
      },
    };

    res.json(metrics);
  } catch (error) {
    console.error('getAnalyticsSummary error:', error);
    res.status(500).json({ error: 'Özet veriler alınamadı' });
  }
};

// Get Data for Charts
export const getAnalyticsChartData = async (req, res) => {
  const { range: rawRange } = req.query;

  const rangeMap = {
    daily: '7d',
    weekly: '30d',
    monthly: '90d',
  };

  const ranges = {
    '7d': { start: '7daysAgo', group: 'day' },
    '30d': { start: '30daysAgo', group: 'week' },
    '90d': { start: '90daysAgo', group: 'month' },
  };

  const labels = {
    '7d': ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    '30d': ['1. Hafta', '2. Hafta', '3. Hafta', '4. Hafta'],
    '90d': ['1. Ay', '2. Ay', '3. Ay'],
  };

  const range = rangeMap[rawRange] || rawRange;
  const selected = ranges[range] || ranges['7d'];

  try {
    const [report] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: selected.start, endDate: 'today' }],
      dimensions: [{ name: selected.group }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ dimension: { dimensionName: selected.group } }],
    });

    const grouped = {};
    for (const row of report.rows || []) {
      const groupValue = row.dimensionValues[0].value;
      const views = parseInt(row.metricValues[0].value, 10);
      const sessions = parseInt(row.metricValues[1].value, 10);
      const bounceRate = parseFloat(row.metricValues[2].value);

      let label = '';
      if (range === '7d') {
        const index = parseInt(groupValue, 10);
        label = labels[range]?.[index] || `Grup ${groupValue}`;
      } else if (range === '30d') {
        const weekMatch = groupValue.match(/W(\d+)/);
        label = weekMatch ? `${weekMatch[1]}. Hafta` : groupValue;
      } else if (range === '90d') {
        const monthMatch = groupValue.match(/-(\d{2})$/);
        label = monthMatch ? `${parseInt(monthMatch[1], 10)}. Ay` : groupValue;
      } else {
        label = groupValue;
      }

      grouped[groupValue] = {
        name: label,
        views,
        sessions,
        bounceRate: Number(bounceRate.toFixed(1)),
      };
    }

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('getAnalyticsChartData error:', error);
    res.status(500).json({ error: 'Grafik verisi alınamadı' });
  }
};

// Trafik kaynakları
export const trafficSources = async (req, res) => {

  const sourceMap = {
    "Organic Search": { name: "Organik Arama", color: "#A855F7" },
    "Direct": { name: "Doğrudan", color: "#06B6D4" },
    "Social": { name: "Sosyal Medya", color: "#10B981" },
    "Email": { name: "E-posta", color: "#F59E0B" },
    "Referral": { name: "Yönlendirme", color: "#F43F5E" },
    "Paid Search": { name: "Ücretli Arama", color: "#3B82F6" },
    "Display": { name: "Görüntülü Reklam", color: "#8B5CF6" },
    // Yeni kaynaklar geldikçe buraya ekleyebilirsin
  };

  try {
    const { range = "7d", viewType = "daily" } = req.query;

    // Tarih aralığını ayarla
    const getStartDate = (range) => {
      if (range === "30d") return "30daysAgo";
      if (range === "90d") return "90daysAgo";
      return "7daysAgo"; // default
    };

    const [response] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: getStartDate(range), endDate: "today" }],
      dimensions: [
        { name: "sessionDefaultChannelGroup" },
      ],
      metrics: [{ name: "sessions" }],
    });

    const rows = response.rows || [];
    if (rows.length === 0) return res.json([]);

    const sourceCounts = {};

    rows.forEach((row) => {
      const source = row.dimensionValues[0].value;
      const count = parseInt(row.metricValues[0].value, 10);

      sourceCounts[source] = (sourceCounts[source] || 0) + count;
    });

    const total = Object.values(sourceCounts).reduce((sum, val) => sum + val, 0);
    // Format: { name: 'Doğrudan', value: 123 }
    const result = Object.entries(sourceCounts).map(([sourceKey, value]) => {
      const mapped = sourceMap[sourceKey] || { name: sourceKey, color: "#9CA3AF" }; // Gri varsayılan
      return {
        name: mapped.name,
        value: Math.round((value / total) * 100), // Burada `value` doğru değişken
        color: mapped.color,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Traffic Sources Error:", err);
    res.status(500).json({ error: "Failed to fetch traffic sources data" });
  }
};

// Users Locations
export const analyticsCities = async (req, res) => {
  const { range: rawRange = 'daily' } = req.query;

  const rangeMap = {
    daily: '7d',
    weekly: '30d',
    monthly: '90d',
  };

  const ranges = {
    '7d': { start: '7daysAgo' },
    '30d': { start: '30daysAgo' },
    '90d': { start: '90daysAgo' },
  };

  const range = rangeMap[rawRange] || rawRange;
  const selected = ranges[range] || ranges['7d'];

  try {
    const [response] = await analyticsDataClient.runReport({
      property: GA_PROPERTY,
      dateRanges: [{ startDate: selected.start, endDate: 'today' }],
      dimensions: [{ name: 'city' }], // veya "city"
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    });

    const rows = response?.rows || [];

    const parsed = rows.map((row) => ({
      country: row.dimensionValues[0].value || 'Bilinmeyen',
      users: parseInt(row.metricValues[0].value, 10),
    }));

    const totalUsers = parsed.reduce((sum, item) => sum + item.users, 0);

    const topFive = parsed.slice(0, 5);
    const others = parsed.slice(5);
    const otherUsers = others.reduce((sum, item) => sum + item.users, 0);

    const result = [
      ...topFive.map((item) => ({
        country: item.country,
        users: item.users,
        percentage: Math.round((item.users / totalUsers) * 100),
      })),
    ];

    if (otherUsers > 0) {
      result.push({
        country: 'Diğerleri',
        users: otherUsers,
        percentage: Math.round((otherUsers / totalUsers) * 100),
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Ülke bazlı analytics hatası:', error);
    res.status(500).json({ error: 'Veri alınamadı' });
  }
};

// Pages

// Yardımcılar
const rangeMap = {
  daily: '7d',
  weekly: '30d',
  monthly: '90d',
};

const ranges = {
  '7d': { start: '7daysAgo', previous: '14daysAgo' },
  '30d': { start: '30daysAgo', previous: '60daysAgo' },
  '90d': { start: '90daysAgo', previous: '180daysAgo' },
};

function normalizePath(path) {
  if (!path) return '/';
  // Dil öneklerini çıkar: /tr/xyz → /xyz ; /en → /
  let p = path.replace(/^\/(tr|en)(?=\/|$)/, '');
  // sondaki "/" varsa kaldır
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
  if (p === '') p = '/';
  return p.toLowerCase();
}

// function calculateChange(current, previous) {
//   if (!previous || previous === 0) return '+0%';
//   const diff = ((current - previous) / previous) * 100;
//   const sign = diff >= 0 ? '+' : '';
//   return sign + Math.round(diff) + '%';
// }

// Veriyi çekip normalize edip aggregate eden fonksiyon
const fetchAggregatedPages = async (startDate, endDate) => {
  const [response] = await analyticsDataClient.runReport({
    property: GA_PROPERTY,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [
      {
        metric: {
          metricName: 'screenPageViews',
        },
        desc: true,
      },
    ],
    // limit isteğe bağlı, biz sonra slice ederiz
  });

  const rows = response?.rows || [];
  const map = {}; // normalizedPath -> { views, titleViews: {title: views} }

  for (const row of rows) {
    const rawPath = row.dimensionValues[0].value || '/';
    const title = row.dimensionValues[1].value || 'Bilinmeyen';
    const views = parseInt(row.metricValues[0].value, 10) || 0;

    const norm = normalizePath(rawPath);
    if (norm.startsWith('/admin')) continue; // admin sayfalarını atla

    if (!map[norm]) {
      map[norm] = { views: 0, titleViews: {} };
    }

    map[norm].views += views;
    map[norm].titleViews[title] = (map[norm].titleViews[title] || 0) + views;
  }

  return map; // { "/anasayfa": { views: 1234, titleViews: { "Anasayfa": 1000, "Homepage": 234 } }, ... }
};

// Endpoint
export const analyticsTopPagesOverview = async (req, res) => {
  const { range: rawRange = 'daily' } = req.query;
  const rangeKey = rangeMap[rawRange] || rawRange; // örn "7d"
  const selected = ranges[rangeKey] || ranges['7d'];

  try {
    // current ve previous için veri çek
    const [currentMap, previousMap] = await Promise.all([
      fetchAggregatedPages(selected.start, 'today'),
      fetchAggregatedPages(selected.previous, selected.start),
    ]);

    // Title map oluştur: hem current hem previous içeriğine bakarak en çok görüntülenen title'ı seç
    const titleMap = {};
    const allPages = new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]);
    for (const page of allPages) {
      const combinedTitleViews = {};

      if (currentMap[page]) {
        for (const [t, v] of Object.entries(currentMap[page].titleViews)) {
          combinedTitleViews[t] = (combinedTitleViews[t] || 0) + v;
        }
      }
      if (previousMap[page]) {
        for (const [t, v] of Object.entries(previousMap[page].titleViews)) {
          combinedTitleViews[t] = (combinedTitleViews[t] || 0) + v;
        }
      }

      // en çok view'e sahip başlığı seç
      const bestTitle = Object.entries(combinedTitleViews).sort((a, b) => b[1] - a[1])[0];
      titleMap[page] = bestTitle ? bestTitle[0] : 'Bilinmeyen';
    }

    // Top N (6) sayfayı seçmek için sıralama
    const currentEntries = Object.entries(currentMap).map(([page, data]) => ({
      page,
      views: data.views,
      title: titleMap[page] || 'Bilinmeyen',
    }));

    const totalViews = currentEntries.reduce((sum, e) => sum + e.views, 0);

    // Sırala ve top 6 al
    const topPages = currentEntries
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
      .map((item) => {
        const prevViews = previousMap[item.page]?.views || 0;
        return {
          page: item.page,
          title: item.title,
          views: item.views,
          percentage: totalViews ? Number(((item.views / totalViews) * 100).toFixed(1)) : 0,
          change: calculateChange(item.views, prevViews),
        };
      });

    res.json(
      topPages,
    );
  } catch (error) {
    console.error('Top pages overview error:', error);
    res.status(500).json({ error: 'En çok ziyaret edilen sayfalar alınamadı' });
  }
};
