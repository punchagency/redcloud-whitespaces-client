import React, { useState } from 'react';
import MapComponent from '../Map/map';
import Filter from '../Filter/filter';
import Insights from '../Insights/insights';

const Dashboard = () => {
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [radius, setRadius] = useState(10); // Default radius value

    const handleProductSelect = (product) => {
        setSelectedProduct(product.value);
    };

    const handleBrandSelect = (brand) => {
        setSelectedProduct(null);
        setSelectedBrand(brand.value);
    };

    // Handler for category selection.
    const handleCategorySelect = (category) => {
        // When a category is selected, update the state and clear any product selection.
        if (category) {
            setSelectedCategory(category.name);
            // setSelectedProduct(null);
        } else {
            // If cleared, set selectedCategory to null.
            setSelectedCategory(null);
        }
    };


    const handleRadiusChange = (newRadius) => {
        setRadius(newRadius);
    };

    return (
        <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/4 p-4 flex flex-col gap-4">
                <Filter onProductSelect={handleProductSelect} onBrandSelect={handleBrandSelect} onRadiusChange={handleRadiusChange} onCategorySelect={handleCategorySelect} />
            </div>
            <div className="w-full md:w-3/4 p-4">
                <MapComponent onRegionSelect={setSelectedRegion} selectedProduct={selectedProduct} selectedBrand={selectedBrand} selectedCategory={selectedCategory} radius={radius} />
                {selectedRegion && <Insights region={selectedRegion} />}
            </div>
        </div>
    );
};

export default Dashboard; 