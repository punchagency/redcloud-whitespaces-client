import { useEffect, useState, useRef } from 'react'
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import useCategories from './hooks/useCategories';

const CategoryFilter = ({ selectedCategory: initialSelectedCategory, onCategorySelect }) => {

    // Local state for controlling the popover, search input, and selected category.
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    // Now selectedCategory will store the unique category name.
    const [selectedCategory, setSelectedCategory] = useState(initialSelectedCategory || null);
    const [page, setPage] = useState(1);

    // use the custom hook to fetch categories
    const { categories, loading, hasMore, error } = useCategories(searchValue, page)

    // When the search input changes, reset to page 1.
    useEffect(() => {
        setPage(1);
    }, [searchValue]);

    // Intersection Observer ref for infinite scrolling.
    const observerTarget = useRef(null);

    useEffect(() => {
        if (!open) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage((prev) => prev + 1);
                }
            },
            { threshold: 1.0 }
        );
        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }
        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loading, open]);

    // Handle category selection using the unique category name.
    const handleSelect = (category) => {
        setSelectedCategory(category.name);
        if (onCategorySelect) {
            onCategorySelect(category);
        }
        setOpen(false);
    };


    return (
        <div className="w-full max-w-md mx-auto">
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <button
                        className="w-full p-2 flex items-center justify-between border rounded-md bg-white hover:bg-gray-50"
                        aria-label="Select category"
                    >
                        <span className="text-sm">
                            {selectedCategory
                                ? selectedCategory
                                : 'Select category...'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        className="w-[var(--radix-popover-trigger-width)] p-0 bg-white rounded-md shadow-lg border"
                        sideOffset={5}
                    >
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    className="w-full pl-8 p-2 text-sm border rounded-md"
                                    placeholder="Search categories..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {loading && page === 1 ? (
                                <div className="p-4 flex justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">No categories found</div>
                            ) : (
                                <>
                                    {categories.map((category) => (
                                        <button
                                            key={category.name}
                                            className={`w-full p-2 text-left text-sm hover:bg-gray-100 flex items-center ${selectedCategory === category.name ? 'bg-gray-50' : ''
                                                }`}
                                            onClick={() => handleSelect(category)}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                    {hasMore && (
                                        <div ref={observerTarget} className="p-2 text-center">
                                            {loading && <Loader2 className="h-4 w-4 animate-spin inline" />}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {error && (
                            <div className="p-2 text-center text-sm text-red-500">
                                {error.message || 'Error loading categories'}
                            </div>
                        )}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );

}

export default CategoryFilter