import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import { FaShop } from "react-icons/fa6";
import { GiShoppingBag } from "react-icons/gi";
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapComponent = ({ onRegionSelect, selectedProduct, radius }) => {
    const [viewState, setViewState] = useState({
        longitude: 5.932599209790851,  // Center longitude for Nigeria
        latitude: 9.340632608330793,   // Center latitude for Nigeria
        zoom: 4        // Adjust zoom level as needed
    });

    const [productLocations, setProductLocations] = useState([]);
    const [competitionLocations, setCompetitionLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedProduct) return;

        const fetchData = async () => {
            try {
                setLoading(true);
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

    const coverageFeatures = useMemo(() => {
        const createFeature = (location, isProduct) => {
            const { min_x, min_y, max_x, max_y, region, seller_name, total_order_count, total_quantity, total_sales_usd } = location;

            if (min_x === null && min_y === null && max_x === null && max_y === null) {
                return null;
            }

            const coordinates = [
                [min_x ?? region[1], min_y ?? region[0]], // Bottom-left
                [max_x ?? region[1], min_y ?? region[0]], // Bottom-right
                [max_x ?? region[1], max_y ?? region[0]], // Top-right
                [min_x ?? region[1], max_y ?? region[0]], // Top-left
                [min_x ?? region[1], min_y ?? region[0]]  // Closing the polygon
            ];

            return {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [coordinates]
                },
                properties: {
                    id: seller_name,
                    isProduct,
                    region,
                    seller_name,
                    total_order_count,
                    total_quantity,
                    total_sales_usd
                }
            };
        };

        const productFeatures = productLocations.map(location => createFeature(location, true)).filter(feature => feature !== null);
        const competitionFeatures = competitionLocations.map(location => createFeature(location, false)).filter(feature => feature !== null);

        return [...productFeatures, ...competitionFeatures];
    }, [productLocations, competitionLocations]);

    const handleLayerClick = (event) => {
        const feature = event.features[0];
        if (feature) {
            setSelectedLocation({
                ...feature.properties,
                region: [event.lngLat.lat, event.lngLat.lng]
            });
        }
        console.log(selectedLocation);
        console.log(event);
    };

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
            interactiveLayerIds={['product-coverage-layer', 'competition-coverage-layer']}
            onClick={handleLayerClick}

        >
            <Source id="coverage-areas" type="geojson" data={{
                type: "FeatureCollection",
                features: coverageFeatures
            }}>
                <Layer
                    id="product-coverage-layer"
                    type="fill"
                    paint={{
                        'fill-color': '#3e068c',
                        'fill-opacity': 0.2
                    }}
                    filter={['==', 'isProduct', true]}
                />
                <Layer
                    id="competition-coverage-layer"
                    type="fill"
                    paint={{
                        'fill-color': '#fc5805',
                        'fill-opacity': 0.2
                    }}
                    filter={['==', 'isProduct', false]}
                />
            </Source>
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
                    <div className="p-2">
                        <h3 className="font-bold text-lg">{selectedLocation.seller_name}</h3>
                        <p>Total Order Count: {selectedLocation.total_order_count}</p>
                        <p>Total Quantity: {selectedLocation.total_quantity}</p>
                        <p>Total Sales (USD): {selectedLocation.total_sales_usd}</p>
                        <p>Coverage Area: {selectedLocation.max_x && selectedLocation.max_y ? 'Defined' : 'Not Defined'}</p>
                    </div>
                </Popup>
            )}
        </Map>
    );
};

export default MapComponent; 