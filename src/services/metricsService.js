const getConnection = require('../database/mysql');

class MetricsService {
  async getDashboardMetrics(params = {}) {
    let connection;
    try {
      connection = await getConnection();

      const { filter, startDate: customStartDate, endDate: customEndDate } = params;
      let startDate, endDate;
      const now = new Date();

      // ======== DATE RANGE CALCULATION (SIMPLIFIED) ========

      // Apply predefined filters first
      if (filter) {
        switch (filter) {
          case 'this_week': {
            const today = new Date();
            const day = today.getDay();
            const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday being 0
            startDate = new Date(today.getFullYear(), today.getMonth(), diffToMonday);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            break;
          }
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
        }
      }

      // Let custom dates override predefined filters
      if (customStartDate) {
        startDate = new Date(customStartDate);
      }
      if (customEndDate) {
        endDate = new Date(customEndDate);
      }

      // 3. Set time to cover full days and validate
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      if (startDate && endDate && startDate > endDate) {
        throw new Error('startDate cannot be after endDate');
      }

      // ======== BUILD SQL DATE FILTER CLAUSE ========
      let dateFilterClause = '';
      const queryParams = [];

      if (startDate && endDate) {
        dateFilterClause = 'AND s.created_at BETWEEN ? AND ?';
        queryParams.push(startDate, endDate);
      }
      else if (startDate) { // Only start date provided
        dateFilterClause = 'AND s.created_at >= ?';
        queryParams.push(startDate);
      } else if (endDate) { // Only end date provided
        dateFilterClause = 'AND s.created_at <= ?';
        queryParams.push(endDate);
      }

      // ======== DYNAMIC BREAKDOWN LOGIC (DAILY VS MONTHLY) ========
      let breakdownType = 'monthly'; // Default
      let breakdownQueries = [];

      // Determine breakdown type
      if (filter === 'this_week' || filter === 'this_month') {
        breakdownType = 'daily';
      } else if (startDate && endDate) {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Use daily breakdown for periods of 31 days or less
        if (diffDays <= 32) { // Use 32 to safely include 31-day months
          breakdownType = 'daily';
        }
      }

      if (breakdownType === 'daily') {
        // Ensure we have a valid date range for daily breakdown
        const dailyStartDate = startDate || new Date(now.getFullYear(), 0, 1); // Default to start of year if no start date
        const dailyEndDate = endDate || now;

        breakdownQueries = [
          // Daily Sales Count
          connection.query(`
            WITH RECURSIVE dates AS (SELECT DATE(?) AS dt UNION ALL SELECT dt + INTERVAL 1 DAY FROM dates WHERE dt < DATE(?))
            SELECT d.dt AS breakdown_key,
                   COALESCE(SUM(CASE WHEN s.sale_type_id = 2 THEN 1 ELSE 0 END), 0) AS products,
                   COALESCE(SUM(CASE WHEN s.sale_type_id = 1 THEN 1 ELSE 0 END), 0) AS services
            FROM dates d
            LEFT JOIN sales s ON DATE(s.created_at) = d.dt AND s.deleted_at IS NULL AND s.payment_status_id = 2
            GROUP BY d.dt ORDER BY d.dt;
          `, [dailyStartDate, dailyEndDate]),
          // Daily Revenue
          connection.query(`
            WITH RECURSIVE dates AS (SELECT DATE(?) AS dt UNION ALL SELECT dt + INTERVAL 1 DAY FROM dates WHERE dt < DATE(?))
            SELECT d.dt AS breakdown_key,
                   COALESCE(SUM(CASE WHEN s.sale_type_id = 2 THEN s.total ELSE 0 END), 0) AS products,
                   COALESCE(SUM(CASE WHEN s.sale_type_id = 1 THEN s.total ELSE 0 END), 0) AS services
            FROM dates d
            LEFT JOIN sales s ON DATE(s.created_at) = d.dt AND s.deleted_at IS NULL AND s.payment_status_id = 2
            GROUP BY d.dt ORDER BY d.dt;
          `, [dailyStartDate, dailyEndDate])
        ];
      } else { // Monthly breakdown
        // Ensure we have a valid date range for monthly breakdown
        const monthlyStartDate = startDate || new Date(now.getFullYear(), 0, 1); // Default to start of year
        const monthlyEndDate = endDate || now;

        breakdownQueries = [
          // Monthly Sales Count
          connection.query(`
            WITH RECURSIVE month_series AS (
              SELECT DATE_FORMAT(?, '%Y-%m-01') AS month_start
              UNION ALL
              SELECT month_start + INTERVAL 1 MONTH FROM month_series WHERE month_start + INTERVAL 1 MONTH <= ?
            )
            SELECT DATE_FORMAT(m.month_start, '%Y-%m') AS breakdown_key,
                   COALESCE(SUM(CASE WHEN s.sale_type_id = 2 THEN 1 ELSE 0 END), 0) AS products,
                   COALESCE(SUM(CASE WHEN s.sale_type_id = 1 THEN 1 ELSE 0 END), 0) AS services
            FROM month_series m
            LEFT JOIN sales s ON DATE_FORMAT(s.created_at, '%Y-%m') = DATE_FORMAT(m.month_start, '%Y-%m')
              AND s.deleted_at IS NULL AND s.payment_status_id = 2
            GROUP BY m.month_start ORDER BY m.month_start;
          `, [monthlyStartDate, monthlyEndDate]),
          // Monthly Revenue
          connection.query(`
            WITH RECURSIVE month_series AS (
              SELECT DATE_FORMAT(?, '%Y-%m-01') AS month_start
              UNION ALL
              SELECT month_start + INTERVAL 1 MONTH FROM month_series WHERE month_start + INTERVAL 1 MONTH <= ?
            )
            SELECT DATE_FORMAT(m.month_start, '%Y-%m') AS breakdown_key,
                   COALESCE(SUM(CASE WHEN s.sale_type_id = 2 THEN s.total ELSE 0 END), 0) AS products,
                   COALESCE(SUM(CASE WHEN s.sale_type_id = 1 THEN s.total ELSE 0 END), 0) AS services
            FROM month_series m
            LEFT JOIN sales s ON DATE_FORMAT(s.created_at, '%Y-%m') = DATE_FORMAT(m.month_start, '%Y-%m')
              AND s.deleted_at IS NULL AND s.payment_status_id = 2
            GROUP BY m.month_start ORDER BY m.month_start;
          `, [monthlyStartDate, monthlyEndDate])
        ];
      }

      const [
        [[generalMetrics]],
        [salesBreakdownData],
        [revenueBreakdownData],
        [topProducts],
        [topServices],
        [topClients],
        [revenueByPaymentMethod]
      ] = await Promise.all([
        // -------- GENERAL METRICS --------
        connection.query(`
          SELECT 
            COALESCE(SUM(s.total), 0) AS totalRevenue,
            COALESCE(SUM(CASE WHEN s.sale_type_id = 2 THEN s.total ELSE 0 END), 0) AS totalProductRevenue,
            COALESCE(SUM(CASE WHEN s.sale_type_id = 1 THEN s.total ELSE 0 END), 0) AS totalServiceRevenue,
            COALESCE(COUNT(DISTINCT s.client_id), 0) AS totalClientsAttended
          FROM sales s
          WHERE s.deleted_at IS NULL AND s.payment_status_id = 2 ${dateFilterClause}
        `, queryParams),

        // Add the dynamic breakdown queries
        ...breakdownQueries,

        // -------- TOP 5 PRODUCTS --------
        connection.query(`
          SELECT 
            p.name AS product,
            COALESCE(SUM(sp.quantity), 0) AS quantity
          FROM sale_products sp
          JOIN products p ON p.id = sp.product_id
          JOIN sales s ON s.id = sp.sale_id
          WHERE s.deleted_at IS NULL AND s.payment_status_id = 2 ${dateFilterClause}
          GROUP BY p.name
          ORDER BY quantity DESC
          LIMIT 5;
        `, queryParams),

        // -------- TOP 5 SERVICES --------
        connection.query(`
          SELECT 
            sv.name AS service,
            COALESCE(COUNT(*), 0) AS quantity
          FROM sale_services ss
          JOIN services sv ON sv.id = ss.service_id
          JOIN sales s ON s.id = ss.sale_id
          WHERE s.deleted_at IS NULL AND s.payment_status_id = 2 ${dateFilterClause}
          GROUP BY sv.name
          ORDER BY quantity DESC
          LIMIT 5;
        `, queryParams),

        // -------- TOP 5 CLIENTS --------
        connection.query(`
          SELECT 
            CONCAT(c.first_name, ' ', c.last_name) AS client,
            COALESCE(SUM(s.total), 0) AS total
          FROM sales s
          JOIN clients c ON c.id = s.client_id
          WHERE s.deleted_at IS NULL AND s.payment_status_id = 2 ${dateFilterClause}
          GROUP BY c.id
          ORDER BY total DESC
          LIMIT 5;
        `, queryParams),

        // -------- REVENUE BY PAYMENT METHOD --------
        connection.query(`
          SELECT 
            pm.name AS method,
            COALESCE(SUM(s.total), 0) AS total
          FROM sales s
          JOIN payment_methods pm ON pm.id = s.payment_method_id
          WHERE s.deleted_at IS NULL AND s.payment_status_id = 2 ${dateFilterClause}
          GROUP BY pm.name;
        `, queryParams)
      ]);

      const formatCategories = (data) => {
        if (breakdownType === 'daily') {
          // Format date as DD/MM
          return data.map(r => new Date(r.breakdown_key).toLocaleDateString('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }));
        }
        // For monthly, format as MM/YYYY
        return data.map(r => {
          const [year, month] = r.breakdown_key.split('-');
          return `${month}/${year}`;
        });
      };

      return {
        generalMetrics,
        salesBreakdown: {
          breakdownType,
          categories: formatCategories(salesBreakdownData),
          series: [
            { name: 'Products', data: salesBreakdownData.map(r => r.products) },
            { name: 'Services', data: salesBreakdownData.map(r => r.services) }
          ]
        },
        revenueBreakdown: {
          breakdownType,
          categories: formatCategories(revenueBreakdownData),
          series: [
            { name: 'Products', data: revenueBreakdownData.map(r => r.products) },
            { name: 'Services', data: revenueBreakdownData.map(r => r.services) }
          ]
        },
        topProducts: {
          categories: topProducts.map(r => r.product),
          series: topProducts.map(r => r.quantity)
        },
        topServices: {
          categories: topServices.map(r => r.service),
          series: topServices.map(r => r.quantity)
        },
        topClients: {
          categories: topClients.map(r => r.client),
          series: topClients.map(r => r.total)
        },
        revenueByPaymentMethod: {
          labels: revenueByPaymentMethod.map(r => r.method),
          series: revenueByPaymentMethod.map(r => r.total)
        }
      };

    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = MetricsService;
