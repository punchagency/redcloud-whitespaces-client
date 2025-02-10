import React, { useState } from 'react';
import Select from 'react-select';
import debounce from 'lodash.debounce';

const Filter = ({ onProductSelect, onBrandSelect, onCategorySelect, onRadiusChange }) => {
    const [brands, setBrands] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [radius, setRadius] = useState(10); // Default radius value
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

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

    const fetchCategories = async (inputValue) => {
        if (!inputValue) return;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/list-of-categories?category_name=${inputValue}&limit=100&offset=0`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setCategories(data.results.map(category => ({
                value: category?.category_name,
                label: category?.category_name
            })));
        } catch (err) {
            setError(err);
            console.error("Error fetching categories:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (inputValue, selectedBrand, selectedCategory) => {
        if (!inputValue && !selectedBrand && !selectedCategory) return;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/list-of-products?brand=${selectedBrand || ''}&product_name=${inputValue || ''}&product_category=${selectedCategory || ''}&limit=100&offset=0`);
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
    const debouncedFetchCategories = debounce(fetchCategories, 300);

    const handleBrandInputChange = (inputValue) => {
        debouncedFetchBrands(inputValue);
    };

    const handleProductInputChange = (inputValue) => {
        debouncedFetchProducts(inputValue, selectedBrand, selectedCategory);
    };

    const handleCategoryInputChange = (inputValue) => {
        debouncedFetchCategories(inputValue);
    };

    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand.value);
        onBrandSelect(brand);
    };

    const handleRadiusChange = (event) => {
        const newRadius = parseInt(event.target.value, 10);
        setRadius(newRadius);
        onRadiusChange(newRadius);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category.value);
        onCategorySelect(category);
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


            <h3 className="text-md font-semibold mb-2">Category</h3>
            <Select
                options={categories}
                onInputChange={handleCategoryInputChange}
                onChange={handleCategorySelect}
                placeholder="Search & select a category"
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


            {error && <div className="text-red-500">Error: {error.message}</div>}

            {/* <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Radius (km)</h3>
                <label className="block text-sm font-medium text-gray-700">Radius: {radius}</label>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={radius}
                    onChange={handleRadiusChange}
                    className="w-full"
                    style={{ cursor: 'pointer' }}
                />
            </div> */}

            <hr className="my-4 border-t-2 border-black" />

            <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Legend</h3>
                <div className="flex items-center mb-2">
                    <span className="inline-block w-4 h-4 mr-2" style={{ backgroundColor: '#203A58' }}></span>
                    <span className="text-sm">Product Sales Area</span>
                </div>
                <div className="flex items-center">
                    <span className="inline-block w-4 h-4 mr-2" style={{ backgroundColor: '#9e0000' }}></span>
                    <span className="text-sm">Similar Product Sales Area</span>
                </div>
            </div>
        </div>
    );
};

export default Filter; 