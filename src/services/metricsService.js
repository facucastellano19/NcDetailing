const getConnection = require('../database/mysql');

class MetricsService {

  /**
   * Get dashboard metrics (totals, breakdowns, top lists, etc.)
   * Calls the stored procedure sp_dashboard_metrics
   */
  async getDashboardMetrics(params = {}) {
    let connection;
    try {
      connection = await getConnection();

      const {
        startDate: customStartDate,
        endDate: customEndDate,
        filter = 'monthly' // default breakdown
      } = params;

      // ======== DATE RANGE CALCULATION (similar to before)
      const now = new Date();
      let startDate, endDate;

      if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999); // Ensure endDate includes the entire day
      } else {
        switch (filter) {
          case 'weekly':
            // Week-to-Date: From Monday of the current week to today.
            startDate = new Date(now);
            const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
            startDate.setDate(diffToMonday);
            startDate.setHours(0, 0, 0, 0); // Set to the beginning of the day
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999); // Ensure endDate includes the entire day
            break;
          case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0); // Set to the beginning of the day
            endDate = new Date(now); // Set end date to today
            endDate.setHours(23, 59, 59, 999); 
            break;
          case 'monthly':
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0); // Set to the beginning of the day
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
            endDate.setHours(23, 59, 59, 999);
            break;
        }
      }

      // Dynamic breakdown type based on the actual date range duration.
      // If the range is longer than 31 days, group by month. Otherwise, group by day.
      let breakdownType;
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const differenceInDays = Math.round(Math.abs((endDate - startDate) / oneDayInMs));

      if (differenceInDays > 31) {
        breakdownType = 'monthly';
      } else {
        breakdownType = 'daily';
      }

      // ======== CALL STORED PROCEDURE
      const [results] = await connection.query(
        'CALL sp_dashboard_metrics(?, ?, ?)',
        [startDate, endDate, breakdownType]
      );

      const [
        generalMetrics,
        rawBreakdownData, // Raw data from DB, might have gaps
        topProducts,
        topServices,
        topClients,
        revenueByPaymentMethod
      ] = results;

      // ======== PAD BREAKDOWN DATA TO ENSURE NO GAPS ========
      let breakdownMap;
      if (breakdownType === 'daily') {
        // The DB returns a Date object for the key. We need to convert it to a 'YYYY-MM-DD' string to match our generated keys.
        breakdownMap = new Map((rawBreakdownData || []).map(item => {
          const date = new Date(item.breakdown_key);
          // Adjust for timezone offset to get the correct local date
          const userTimezoneOffset = date.getTimezoneOffset() * 60000;
          const localDate = new Date(date.getTime() + userTimezoneOffset);
          const key = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
          return [key, item];
        }));
      } else { // monthly
        // The SP returns the key as a 'YYYY-MM' string, so no conversion is needed.
        breakdownMap = new Map((rawBreakdownData || []).map(item => [item.breakdown_key, item]));
      }
      const paddedBreakdownData = [];
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()); // Use local timezone

      while (currentDate <= endDate) {
        let key;
        if (breakdownType === 'daily') {
          // Format to YYYY-MM-DD in local timezone
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          key = `${year}-${month}-${day}`;
          currentDate.setDate(currentDate.getDate() + 1);
        } else { // monthly
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
          currentDate.setMonth(currentDate.getMonth() + 1);
        }

        if (breakdownMap.has(key)) {
          const itemFromDb = breakdownMap.get(key);
          // Standardize the key in the final output to be a 'YYYY-MM-DD' string
          itemFromDb.breakdown_key = key;
          paddedBreakdownData.push(itemFromDb);
        } else {
          // If no data for this period, push a zero-filled object
          paddedBreakdownData.push({
            breakdown_key: key,
            service_count: 0,
            product_count: 0,
            service_revenue: 0,
            product_revenue: 0
          });
        }
      }
      // Ensure the loop doesn't overshoot for monthly breakdown if the end date is mid-month
      if (breakdownType === 'monthly' && paddedBreakdownData.length > 0) {
          const lastKey = paddedBreakdownData[paddedBreakdownData.length - 1].breakdown_key;
          const endKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
          if (lastKey > endKey) paddedBreakdownData.pop();
      }

      // ======== STRUCTURE RESPONSE
      return {
        range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          breakdown: breakdownType
        },
        general: generalMetrics?.[0] || {
          totalRevenue: 0,
          totalProductRevenue: 0,
          totalServiceRevenue: 0,
          totalClientsAttended: 0
        },
        breakdown: paddedBreakdownData, // Use the padded data
        top: {
          products: topProducts || [],
          services: topServices || [],
          clients: topClients || []
        },
        paymentMethods: revenueByPaymentMethod || []
      };

    } catch (error) {
      // If the error already has a status, it's a controlled error (like 400 or 404). Re-throw it.
      if (error.status) {
        throw error;
      }
      // For unexpected errors, log and throw a generic 500 error.
      console.error('Unexpected error in MetricsService.getDashboardMetrics:', error);
      throw new Error('Failed to fetch dashboard metrics');
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = MetricsService;
