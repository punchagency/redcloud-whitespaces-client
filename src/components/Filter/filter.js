import React, { useState } from 'react';
import Select from 'react-select';
import debounce from 'lodash.debounce';

const Filter = ({ onProductSelect, onRadiusChange }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [radius, setRadius] = useState(10); // Default radius value

    const fetchProducts = async (inputValue) => {
        if (!inputValue) return;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/list-of-products?brand=${inputValue}&limit=100&offset=0`);
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

    // Debounce the fetchProducts function to limit API calls
    const debouncedFetchProducts = debounce(fetchProducts, 300);

    const handleInputChange = (inputValue) => {
        debouncedFetchProducts(inputValue);
    };

    const handleRadiusChange = (event) => {
        const newRadius = parseInt(event.target.value, 10);
        setRadius(newRadius);
        onRadiusChange(newRadius);
    };

    return (
        <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-4">Filter Options</h2>
            <Select
                options={products}
                onInputChange={handleInputChange}
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
            {error && <div className="text-red-500">Error: {error.message}</div>}
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Radius (km): {radius}</label>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={radius}
                    onChange={handleRadiusChange}
                    className="w-full"
                    style={{ cursor: 'pointer' }}
                />
            </div>
        </div>
    );
};

export default Filter; 