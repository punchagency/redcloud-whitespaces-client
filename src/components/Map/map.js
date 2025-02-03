import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { FaShop } from "react-icons/fa6";
import { GiShoppingBag } from "react-icons/gi";
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapComponent = ({ onRegionSelect, selectedProduct, radius }) => {
    const [viewState, setViewState] = useState({
        longitude: -100,
        latitude: 40,
        zoom: 3.5
    });

    const [productLocations, setProductLocations] = useState([]);
    const [competitionLocations, setCompetitionLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedProduct) return;

        const fetchData = async () => {
            try {
                const [productRes, competitionRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/regional-performance`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            brand: selectedProduct,
                            radius_km: radius
                        })
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/comparable-product-performance`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            brand: selectedProduct,
                            radius_km: radius
                        })
                    })
                ]);

                if (!productRes.ok || !competitionRes.ok) {
                    throw new Error(`HTTP error! status: ${productRes.status} or ${competitionRes.status}`);
                }

                const productData = await productRes.json();
                const competitionData = await competitionRes.json();

                setProductLocations(productData.results);
                setCompetitionLocations(competitionData.results);

            } catch (err) {
                setError(err);
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedProduct, radius]);

    const averageCoordinates = useMemo(() => {
        const allLocations = [...productLocations, ...competitionLocations];
        // if (allLocations.length === 0) return { avgLat: 40, avgLng: -100 }; // Default values

        let totalLat = 0;
        let totalLng = 0;
        allLocations.forEach(item => {
            totalLat += item.region[0];
            totalLng += item.region[1];
        });
        return {
            avgLat: totalLat / allLocations.length,
            avgLng: totalLng / allLocations.length
        };
    }, [productLocations, competitionLocations]);

    useEffect(() => {
        setViewState(prev => ({
            ...prev,
            latitude: averageCoordinates.avgLat,
            longitude: averageCoordinates.avgLng
        }));
    }, [averageCoordinates]);

    if (loading) {
        return <div>Loading map data...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={viewState}
            style={{ width: '100%', height: '500px' }}
            mapStyle="mapbox://styles/mapbox/streets-v9"
        >
            {productLocations.map((location, index) => (
                <Marker
                    key={`product-${index}`}
                    longitude={location.region[1]}
                    latitude={location.region[0]}
                    onClick={() => setSelectedLocation(location)}
                >
                    <FaShop
                        size={20}
                        color="#3e068c"
                        style={{ cursor: 'pointer' }}
                    />
                </Marker>
            ))}
            {competitionLocations.map((location, index) => (
                <Marker
                    key={`competition-${index}`}
                    longitude={location.region[1]}
                    latitude={location.region[0]}
                    onClick={() => setSelectedLocation(location)}
                >
                    <GiShoppingBag
                        size={20}
                        color="#fc5805"
                    />
                </Marker>
            ))}
            {selectedLocation && (
                <Popup
                    longitude={selectedLocation.region[1]}
                    latitude={selectedLocation.region[0]}
                    onClose={() => setSelectedLocation(null)}
                    closeOnClick={false}
                >
                    <div>
                        <h3>Region Insights</h3>
                        <p>Total Order Count: {selectedLocation.total_order_count}</p>
                        <p>Total Quantity: {selectedLocation.total_quantity}</p>
                        <p>Total Sales (USD): {selectedLocation.total_sales_usd}</p>
                    </div>
                </Popup>
            )}
        </Map>
    );
};

export default MapComponent; 