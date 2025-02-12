import { useState } from 'react';
import Filter from '../Filter/filter';
import Insights from '../Insights/insights';
import MapComponent from '../Map/map';

const Dashboard = () => {
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [radius, setRadius] = useState(10); // Default radius value

    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand?.value? brand?.value : null);
        setSelectedProduct(null);
        setSelectedCategory(null); 
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product?.value? product?.value : null);
        setSelectedCategory(null);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category?.value? category?.value : null);
    };

    const handleRadiusChange = (newRadius) => {
        setRadius(newRadius);
    };

    return (
        <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/4 p-4">
                <Filter 
                    onProductSelect={handleProductSelect} 
                    onBrandSelect={handleBrandSelect} 
                    onCategorySelect={handleCategorySelect}
                    onRadiusChange={handleRadiusChange} 
                    selectedBrand={selectedBrand}
                    selectedProduct={selectedProduct}
                    selectedCategory={selectedCategory}
                />
            </div>
            <div className="w-full md:w-3/4 p-4">
                <MapComponent 
                    onRegionSelect={setSelectedRegion} 
                    selectedProduct={selectedProduct} 
                    selectedBrand={selectedBrand} 
                    selectedCategory={selectedCategory}
                    radius={radius} 
                />
                {selectedRegion && <Insights region={selectedRegion} />}
            </div>
        </div>
    );
};

export default Dashboard; 