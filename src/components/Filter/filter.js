import React, { useState } from 'react';
import Select from 'react-select';
import debounce from 'lodash.debounce';
import CategoryFilter from './CategoryFilter';

const Filter = ({ onProductSelect, onBrandSelect, onRadiusChange, onCategorySelect }) => {
    const [brands, setBrands] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [radius, setRadius] = useState(10); // Default radius value

    const fetchBrands = async (inputValue) => {
        if (!inputValue) return;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/list-of-brands?brand=${inputValue || selectedBrand || ''}&limit=100&offset=0`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setBrands(data.results.map(brand => ({
                value: brand?.brand,
                label: brand?.brand
            })));
        } catch (err) {
            setError(err);
            console.error("Error fetching brands:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (inputValue, selectedBrand) => {
        if (!inputValue && !selectedBrand) return;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/list-of-products?brand=${selectedBrand || ''}&product_name=${inputValue || ''}&limit=100&offset=0`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setProducts(data.results.map(product => ({
                value: product?.product_name,
                label: `${product?.product_name} (${product?.brand})`
            })));
        } catch (err) {
            setError(err);
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    // Debounce the fetch functions to limit API calls
    const debouncedFetchBrands = debounce(fetchBrands, 300);
    const debouncedFetchProducts = debounce(fetchProducts, 300);

    const handleBrandInputChange = (inputValue) => {
        debouncedFetchBrands(inputValue);
    };

    const handleProductInputChange = (inputValue) => {
        debouncedFetchProducts(inputValue, selectedBrand);
    };



    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand.value);
        onBrandSelect(brand);
    };


    const handleCategorySelect = (category) => {
        if (category === null) {
            // Clear selection: revert to initial state.
            setSelectedCategory(null);
            if (onCategorySelect) {
                onCategorySelect(null);
            }
        } else {
            setSelectedCategory(category.name);
            if (onCategorySelect) {
                onCategorySelect(category);
            }
        }
    };




    const handleRadiusChange = (event) => {
        const newRadius = parseInt(event.target.value, 10);
        setRadius(newRadius);
        onRadiusChange(newRadius);
    };

    return (
        <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-4">Filter Options</h2>
            <hr className="my-4 border-t-2 border-black" />
            <h3 className="text-md font-semibold mb-2">Brand</h3>
            <Select
                options={brands}
                onInputChange={handleBrandInputChange}
                onChange={handleBrandSelect}
                placeholder="Search and select a brand"
                isLoading={loading}
                className="mb-4"
                styles={{
                    control: (base) => ({
                        ...base,
                        cursor: 'pointer',
                        color: 'black'
                    })
                }}
            />

            <h3 className="text-md font-semibold mb-2">Product</h3>
            <Select
                options={products}
                onInputChange={handleProductInputChange}
                onChange={onProductSelect}
                placeholder="Search and select a product"
                isLoading={loading}
                className="mb-4"
                styles={{
                    control: (base) => ({
                        ...base,
                        cursor: 'pointer',
                        color: 'black'
                    })
                }}
            />

            {/* Category filter integrated here */}
            <h3 className="text-md font-semibold mb-2">Category</h3>
            <CategoryFilter
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
            />

            {error && <div className="text-red-500">Error: {error.message}</div>}

            {/* <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Radius (km)</h3>
                <label className="block text-sm font-medium text-gray-700">Radius: {radius}</label>
                <input
                    type="range"
                    disabled={true}
                    min="1"
                    max="100"
                    value={radius}
                    onChange={handleRadiusChange}
                    className="w-full"
                    style={{ cursor: 'pointer' }}
                />
            </div> */}
        </div>
    );
};

export default Filter; 