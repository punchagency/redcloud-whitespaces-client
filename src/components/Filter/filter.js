import debounce from 'lodash.debounce';
import { useCallback, useState } from 'react';
import Select from 'react-select';

const Filter = ({ onProductSelect, onBrandSelect, onCategorySelect, onRadiusChange, selectedBrand, selectedProduct, selectedCategory }) => {
    const [brands, setBrands] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);

    const selectOptions = {
        control: (base) => ({
            ...base,
            cursor: 'pointer',
            color: 'black'
        }),
        placeholder: (base) => ({
            ...base,
            color: 'black'
        }),
        singleValue: (base) => ({
            ...base,
            color: 'black'
        }),
        menu: (base) => ({
            ...base,
            color: 'black',
            backgroundColor: 'white'
        }),
        option: (base, state) => ({
            ...base,
            color: state.isSelected ? 'white' : 'black',
            backgroundColor: state.isSelected ? '#007bff' : 'white',
            '&:hover': {
                backgroundColor: '#f1f1f1'
            }
        })
    }

    const fetchBrands = useCallback(async (inputValue) => {
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
    }, [selectedBrand]);

    const fetchCategories = useCallback(async (inputValue, selectedBrand) => {
        if (!inputValue) return;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/list-of-categories?brand=${selectedBrand}&category_name=${inputValue}&limit=100&offset=0`);
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
    }, []);

    const fetchProducts = useCallback(async (inputValue, selectedBrand, selectedCategory) => {
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
    }, []);

    // Debounce the fetch functions to limit API calls
    const debouncedFetchBrands = useCallback(debounce(fetchBrands, 300), [fetchBrands]);
    const debouncedFetchProducts = useCallback(debounce(fetchProducts, 300), [fetchProducts]);
    const debouncedFetchCategories = useCallback(debounce(fetchCategories, 300), [fetchCategories]);

    const handleBrandInputChange = useCallback((inputValue) => {
        debouncedFetchBrands(inputValue);
    }, [debouncedFetchBrands]);

    const handleProductInputChange = useCallback((inputValue) => {
        debouncedFetchProducts(inputValue, selectedBrand, selectedCategory);
    }, [debouncedFetchProducts, selectedBrand, selectedCategory]);

    const handleCategoryInputChange = useCallback((inputValue) => {
        debouncedFetchCategories(inputValue, selectedBrand);
    }, [debouncedFetchCategories, selectedBrand]);

    const handleBrandSelect = useCallback((brand) => {
        setProducts([]);
        setCategories([]);
        onBrandSelect(brand);
        onProductSelect(null);
        onCategorySelect(null);
    }, [onBrandSelect, onProductSelect, onCategorySelect]);

    const handleProductSelect = useCallback((product) => {
        onProductSelect(product);
        setCategories([]);
        onCategorySelect(null);
    }, [onProductSelect, onCategorySelect]);

    const handleRadiusChange = useCallback((event) => {
        const newRadius = parseInt(event.target.value, 10);
        setRadius(newRadius);
        onRadiusChange(newRadius);
    }, [onRadiusChange]);

    const handleCategorySelect = useCallback((category) => {
        onCategorySelect(category);
    }, [onCategorySelect]);

    const handleReset = () => {
        onBrandSelect(null);
        onCategorySelect(null);
        onProductSelect(null);
    };

    return (
        <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-4 text-black">Filter Options</h2>
            <hr className="my-4 border-t-2 border-black" />
            <h3 className="text-md font-semibold mb-2 text-black">Brand</h3>
            <Select
                options={brands}
                onInputChange={handleBrandInputChange}
                onChange={handleBrandSelect}
                value={brands.find(brand => brand.value === selectedBrand) || null}
                placeholder="Search and select a brand"
                isLoading={loading}
                isClearable
                className="mb-4"
                styles={selectOptions}
            />

            <h3 className="text-md font-semibold mb-2 text-black">Product</h3>
            <Select
                options={products}
                onInputChange={handleProductInputChange}
                onChange={handleProductSelect}
                value={products.find(product => product.value === selectedProduct) || null}
                placeholder="Search and select a product"
                isLoading={loading}
                isClearable
                className="mb-4"
                styles={selectOptions}
            />

            <h3 className="text-md font-semibold mb-2 text-black">Category</h3>
            <Select
                options={categories}
                onInputChange={handleCategoryInputChange}
                onChange={handleCategorySelect}
                value={categories.find(category => category.value === selectedCategory) || null}
                placeholder="Search & select a category"
                isLoading={loading}
                isClearable
                className="mb-4"
                styles={selectOptions}
            />

            {error && <div className="text-red-500">Error: {error.message}</div>}

            <button
                onClick={handleReset}
                className="mt-4 bg-red-500 text-white py-2 px-4 rounded"
            >
                Reset
            </button>

            <hr className="my-4 border-t-2 border-black" />

            <div className="mt-4">
                <h2 className="text-lg font-bold mb-4 text-black">Legend</h2>
                <div className="flex items-center mb-2">
                    <span className="inline-block w-4 h-4 mr-2" style={{ backgroundColor: '#203A58' }}></span>
                    <span className="text-sm text-black">Product Sales Area</span>
                </div>
                <div className="flex items-center">
                    <span className="inline-block w-4 h-4 mr-2" style={{ backgroundColor: '#9e0000' }}></span>
                    <span className="text-sm text-black">Similar Product/White Space Sales Area</span>
                </div>
                <div className="flex items-center">
                    <span className="inline-block w-4 h-4 mr-2" style={{ backgroundColor: '#81B29A' }}></span>
                    <span className="text-sm text-black">Sellers</span>
                </div>
            </div>
        </div>
    );
};

export default Filter;