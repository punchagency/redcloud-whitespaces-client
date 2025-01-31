import React from 'react';

const Insights = ({ region }) => {
    return (
        <div className="bg-white p-4 rounded shadow mt-4">
            <h2 className="text-lg font-bold mb-2">Region Insights</h2>
            <p>Total Order Count: {region.total_order_count}</p>
            <p>Total Quantity: {region.total_quantity}</p>
            <p>Total Sales (USD): {region.total_sales_usd}</p>
            {/* Additional insights and suggested actions can be added here */}
        </div>
    );
};

export default Insights; 