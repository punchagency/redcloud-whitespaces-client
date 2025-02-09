import React, { useState } from 'react';
import MapComponent from '../Map/map';
import Filter from '../Filter/filter';
import CategoryFilter from '../Filter/CategoryFilter';
import Insights from '../Insights/insights';

const Dashboard = () => {
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [radius, setRadius] = useState(10); // Default radius value

    const handleProductSelect = (product) => {
        setSelectedProduct(product.value);
    };

    // Handler for category selection.
    const handleCategorySelect = (category) => {
        setSelectedCategory(category.name);
        // Clear product if a category is selected.
        setSelectedProduct(null);
    };

    const handleRadiusChange = (newRadius) => {
        setRadius(newRadius);
    };

    return (
        <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/4 p-4">
                <Filter onProductSelect={handleProductSelect} onRadiusChange={handleRadiusChange} />
            </div>
            <div className="w-full md:w-3/4 p-4">
                <MapComponent onRegionSelect={setSelectedRegion} selectedProduct={selectedProduct} radius={radius} selectedCategory={selectedCategory} />
                {selectedRegion && <Insights region={selectedRegion} />}
            </div>
        </div>
    );
};

export default Dashboard; 