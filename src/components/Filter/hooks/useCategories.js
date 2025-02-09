import { useState, useEffect } from 'react'

const ITEMS_PER_PAGE = 10

/**
 * Custom hook to fetch categories with pagination and search.
 *
 * @param {string} search - The search term to filter categories.
 * @param {number} page - The current page number.
 * @param {number} limit - Number of items per page.
 * @returns {object} { categories, loading, hasMore, error }
 */


function useCategories(search, page, limit = ITEMS_PER_PAGE) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        // When the search term changes, reset the categories list.
        if (page === 1) {
            setCategories([]);
        }
        setLoading(true);
        setError(null);

        // Build the URL including page, limit, and search term parameters.
        const url = `${process.env.NEXT_PUBLIC_API_URL}/categories?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''
            }`;

        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                // If on the first page, replace the list; otherwise append.
                setCategories((prev) =>
                    page === 1 ? data.categories : [...prev, ...data.categories]
                );
                // If we received less than the limit, there is no more data.
                setHasMore(data.categories.length === limit);
            })
            .catch((err) => setError(err))
            .finally(() => setLoading(false));

    }, [search, page, limit])

    return {
        categories,
        loading,
        hasMore,
        error
    }

}

export default useCategories