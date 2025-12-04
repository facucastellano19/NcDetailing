const getConnection = require('../database/mysql');

class HomeService {

  /**
   * Get home dashboard data (summary cards, recent activity)
   * Calls the stored procedure sp_home_dashboard
   */
  async getHomeDashboard() {
    let connection;
    try {
      connection = await getConnection();

      // ======== CALL STORED PROCEDURE ========
      const [results] = await connection.query('CALL sp_home_dashboard()');

      const [
        summaryMetrics,
        recentServiceSales,
        recentProductSales,
        productSalesDetails
      ] = results;

      // ======== PROCESS PRODUCT SALES ========
      // Create a map to easily add product details to each product sale
      const productSalesMap = new Map(recentProductSales.map(sale => [sale.sale_id, { ...sale, products: [] }]));

      // Populate the products array for each sale
      productSalesDetails.forEach(detail => {
        if (productSalesMap.has(detail.sale_id)) {
          productSalesMap.get(detail.sale_id).products.push({
            product_name: detail.product_name,
            quantity: detail.quantity,
            unit_price: detail.unit_price,
            subtotal: detail.subtotal
          });
        }
      });

      const finalProductSales = Array.from(productSalesMap.values());

      const summary = summaryMetrics?.[0] || {
        totalSales: 0,
        confirmedPayments: 0,
        pendingPayments: 0
      };

      summary.totalSales = parseFloat(summary.confirmedPayments || 0) + parseFloat(summary.pendingPayments || 0);

      // ======== STRUCTURE RESPONSE ========
      return {
        summary: summary,
        recentActivity: {
          services: recentServiceSales || [],
          products: finalProductSales || []
        }
      };

    } catch (error) {
      console.error('Unexpected error in HomeService.getHomeDashboard:', error);
      throw new Error('Failed to fetch home dashboard data');
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = HomeService;