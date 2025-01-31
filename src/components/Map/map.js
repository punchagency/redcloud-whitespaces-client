import React, { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl';
import { FaLocationDot } from "react-icons/fa6";

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

                // Calculate average latitude and longitude for centering the map
                const allLocations = [...productData.results, ...competitionData.results];
                let totalLat = 0;
                let totalLng = 0;
                allLocations.forEach(item => {
                    totalLat += item.region[0];
                    totalLng += item.region[1];
                });
                const avgLat = totalLat / allLocations.length;
                const avgLng = totalLng / allLocations.length;

                setViewState(prev => ({ ...prev, latitude: avgLat, longitude: avgLng }));

            } catch (err) {
                setError(err);
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedProduct, radius]);

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
                    onClick={() => onRegionSelect(location)}
                >
                    {/* <div style={{ border: '2px solid #3e068c', width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> */}
                        <FaLocationDot
                            size={20}
                            color="#3e068c"
                        />
                    {/* </div> */}
                </Marker>
            ))}
            {competitionLocations.map((location, index) => (
                <Marker
                    key={`competition-${index}`}
                    longitude={location.region[1]}
                    latitude={location.region[0]}
                    onClick={() => onRegionSelect(location)}
                >
                    <FaLocationDot
                        size={20}
                        color="#fc5805"
                    />
                </Marker>
            ))}
        </Map>
    );
};

export default MapComponent; 