import React, { useState, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, Search, Loader2 } from 'lucide-react'


const ITEMS_PER_PAGE = 10;


const CategoryFilter = ({ selectedBrand }) => {

    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [selectedBrand, setSelectedBrand] = useState(selectedBrand || null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [error, setError] = useState(null);

    // fetch categories when dropdown is opened
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories?page=${page}&limit=${ITEMS_PER_PAGE}`);
            const data = await response.json();
            if (pageNum === 1) {
                setCategories(data.categories);
            } else {
                setCategories(prev => [...prev, ...data.categories]);
            }
            setHasMore(data.categories.length === ITEMS_PER_PAGE);  // i dont think this is right
            setInitialLoad(false);
        } catch (error) {
            setError(error.message);

        } finally {
            setLoading(false);
        }
    }

    // Handle dropdown open
    useEffect(() => {
        if (open && initialLoad) {
            fetchCategories(1);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            setPage(1);
            fetchCategories(1, searchValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchValue])

    // Intersection observer to load more categories
    const observerTarget = React.useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading && open) {
                setPage(prev => {
                    const nextPage = prev + 1;
                    fetchCategories(nextPage, searchValue);
                    return nextPage;
                });
            }
        }, { threshold: 1.0 });

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }
    },
        [hasMore, loading, open])

    return (
        <div className="w-full max-w-md mx-auto">
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <button
                        className="w-full p-2 flex items-center justify-between border rounded-md bg-white hover:bg-gray-50"
                        aria-label="Select category"
                    >
                        <span className="text-sm">
                            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Select category...'}
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
                            {initialLoad ? (
                                <div className="p-4 flex justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    No categories found
                                </div>
                            ) : (
                                <>
                                    {categories.map(category => (
                                        <button
                                            key={category.id}
                                            className={`w-full p-2 text-left text-sm hover:bg-gray-100 flex items-center ${selectedCategory === category.id ? 'bg-gray-50' : ''}`}
                                            onClick={() => {
                                                setSelectedCategory(category.id);
                                                setOpen(false);
                                            }}
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
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
};

export default CategoryFilter;


// Categories endpoint
// whitespace for category endpoint 
