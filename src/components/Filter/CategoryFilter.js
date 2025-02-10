import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import useCategories from './hooks/useCategories';

const CategoryFilter = ({ selectedCategory: initialSelectedCategory, onCategorySelect }) => {
    // Local state for the search input, pagination, and the locally selected category.
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [localSelectedCategory, setLocalSelectedCategory] = useState(initialSelectedCategory || null);

    // Debounced search value to limit API calls.
    const [debouncedSearch, setDebouncedSearch] = useState(searchValue);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchValue);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchValue]);

    // When the debounced search value changes, reset the page to 1.
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    // Use the custom hook to fetch categories based on the debounced search value and current page.
    const { categories, loading, hasMore, error } = useCategories(debouncedSearch, page);

    // Convert fetched categories into react-select options.
    const options = categories.map((cat) => ({
        value: cat.name,
        label: cat.name,
    }));

    // Handle user input changes in the select's text field.
    const handleInputChange = (inputValue, { action }) => {
        if (action === 'input-change') {
            setSearchValue(inputValue);
        }
    };

    // Handle when a user selects or clears an option.
    const handleChange = (selectedOption) => {

        if (selectedOption) {
            setLocalSelectedCategory(selectedOption.value);
            if (onCategorySelect) {
                onCategorySelect({ name: selectedOption.value });
            }
        } else {

            setLocalSelectedCategory(null);
            if (onCategorySelect) {
                onCategorySelect(null);
            }
            // Reset search text and page so that the hook fetches the initial ten categories.
            setSearchValue('');
            setPage(1);
        }
    };

    return (
        <Select
            options={options}
            onInputChange={handleInputChange}
            onChange={handleChange}
            placeholder="Search and select a category"
            isLoading={loading}
            isClearable
            // Trigger pagination when scrolling to the bottom of the menu.
            onMenuScrollToBottom={() => {
                if (hasMore && !loading) {
                    setPage((prev) => prev + 1);
                }
            }}
            // Controlled value based on local state.
            value={
                localSelectedCategory
                    ? { value: localSelectedCategory, label: localSelectedCategory }
                    : null
            }
            styles={{
                control: (base) => ({
                    ...base,
                    cursor: 'pointer',
                    color: 'black',
                }),
                option: (provided) => ({
                    ...provided,
                    cursor: 'pointer',
                }),
            }}
        />
    );
};

export default CategoryFilter;
