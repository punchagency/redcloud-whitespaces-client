import React, { useState } from 'react';
import MapComponent from '../Map/map';
import Filter from '../Filter/filter';
import Insights from '../Insights/insights';

const Dashboard = () => {
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [radius, setRadius] = useState(10); // Default radius value

    const handleProductSelect = (product) => {
        setSelectedProduct(product.value);
    };

    const handleBrandSelect = (brand) => {
        setSelectedProduct(null);
        setSelectedBrand(brand.value);
    };

    const handleRadiusChange = (newRadius) => {
        setRadius(newRadius);
    };

    return (
        <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/4 p-4">
                <Filter onProductSelect={handleProductSelect} onBrandSelect={handleBrandSelect} onRadiusChange={handleRadiusChange} />
            </div>
            <div className="w-full md:w-3/4 p-4">
                <MapComponent onRegionSelect={setSelectedRegion} selectedProduct={selectedProduct} selectedBrand={selectedBrand} radius={radius} />
                {selectedRegion && <Insights region={selectedRegion} />}
            </div>
        </div>
    );
};

export default Dashboard; 