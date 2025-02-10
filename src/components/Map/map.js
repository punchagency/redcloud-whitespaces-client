import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import { FaLocationDot } from "react-icons/fa6";

import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapComponent = ({ selectedBrand, selectedProduct, radius, selectedCategory }) => {
    const [viewState, setViewState] = useState({
        longitude: 5.932599209790851,  // Center longitude for Nigeria
        latitude: 9.340632608330793,   // Center latitude for Nigeria
        zoom: 5        // Adjust zoom level as needed
    });

    const [productLocations, setProductLocations] = useState([]);
    const [competitionLocations, setCompetitionLocations] = useState([]);
    const [productBuyers, setProductBuyers] = useState([]);
    const [similarProductBuyers, setSimilarProductBuyers] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedProduct && !selectedBrand && !selectedCategory) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const [productRes, competitionRes, productBuyersRes, similarProductBuyersRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/product-sellers-performance`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            product_name: selectedProduct || '',
                            brand: selectedBrand || '',
                            product_category: selectedCategory || '',
                            radius_km: radius
                        })
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/similar-product-sellers-performance`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            product_name: selectedProduct || '',
                            brand: selectedBrand || '',
                            product_category: selectedCategory || '',
                            radius_km: radius
                        })
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/product-buyers-locations`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            product_name: selectedProduct || '',
                            brand: selectedBrand || '',
                            product_category: selectedCategory || '',
                            radius_km: radius
                        })
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/white-space/similar-product-buyers-locations`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            product_name: selectedProduct || '',
                            brand: selectedBrand || '',
                            product_category: selectedCategory || '',
                            radius_km: radius
                        })
                    })
                ]);

                if (!productRes.ok || !competitionRes.ok || !productBuyersRes.ok || !similarProductBuyersRes.ok) {
                    throw new Error(`HTTP error! status: ${productRes.status}, ${competitionRes.status}, ${productBuyersRes.status}, or ${similarProductBuyersRes.status}`);
                }

                const productData = await productRes.json();
                const competitionData = await competitionRes.json();
                const productBuyersData = await productBuyersRes.json();
                const similarProductBuyersData = await similarProductBuyersRes.json();

                setProductLocations(productData.results || []);
                setCompetitionLocations(competitionData.results || []);
                setProductBuyers(productBuyersData.results || []);
                setSimilarProductBuyers(similarProductBuyersData.results || []);

            } catch (err) {
                setError(err);
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedProduct, selectedBrand, selectedCategory, radius]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const clusterPoints = (points) => {
        const clusters = [];
        points.forEach(point => {
            let added = false;
            for (let cluster of clusters) {
                if (calculateDistance(cluster[0].lat, cluster[0].lng, point.lat, point.lng) <= 25) {
                    cluster.push(point);
                    added = true;
                    break;
                }
            }
            if (!added) {
                clusters.push([point]);
            }
        });
        return clusters;
    };

    const calculateConvexHull = (points) => {
        if (points.length < 3) return []; // Convex hull is not possible with less than 3 points

        points.sort((a, b) => a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng);

        const lower = [];
        for (const point of points) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
                lower.pop();
            }
            lower.push(point);
        }

        const upper = [];
        for (let i = points.length - 1; i >= 0; i--) {
            const point = points[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
                upper.pop();
            }
            upper.push(point);
        }

        upper.pop();
        lower.pop();

        return lower.concat(upper);
    };

    const cross = (o, a, b) => {
        return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
    };

    const createPolygonFeatures = (clusters, isProduct) => {
        return clusters.map((cluster, index) => {
            if (cluster.length < 3) return null; // Skip clusters with less than 3 points

            const hull = calculateConvexHull(cluster);
            const coordinates = hull.map(point => [parseFloat(point.lng), parseFloat(point.lat)]);
            coordinates.push(coordinates[0]); // Close the polygon
            return {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [coordinates]
                },
                properties: {
                    id: `cluster-${index}`,
                    isProduct
                }
            };
        }).filter(feature => feature !== null);
    };

    const coverageFeatures = useMemo(() => {
        const productClusters = clusterPoints(productBuyers);
        const similarProductClusters = clusterPoints(similarProductBuyers);

        const productFeatures = createPolygonFeatures(productClusters, true);
        const similarProductFeatures = createPolygonFeatures(similarProductClusters, false);

        return [...productFeatures, ...similarProductFeatures];
    }, [productBuyers, similarProductBuyers]);

    const clusterLayer = {
        id: 'clusters',
        type: 'circle',
        source: 'locations',
        filter: ['>=', ['get', 'point_count'], 1],
        paint: {
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#E07A5F',
                2,
                '#81B29A',
                100,
                '#f1f075',
                // 750,
                // '#f28cb1'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                10,
                2,
                20,
                100,
                30,
                // 750,
                // 40
            ],
            'circle-opacity': 0.8
        }
    };

    const clusterCountLayer = {
        id: 'cluster-count',
        type: 'symbol',
        source: 'locations',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    };

    const unclusteredPointLayer = {
        id: 'unclustered-point',
        type: 'circle',
        source: 'locations',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#81B29A',
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-opacity': 0.8,
            'circle-stroke-opacity': 0.8,
            'circle-stroke-color': '#000'
        }
    };

    const handleLayerClick = (event) => {
        if (event.features && event.features.length > 0) {
            const feature = event.features[0];
            if (feature.layer.id === 'clusters') {
                const { lng, lat } = event.lngLat;

                setViewState({
                    ...viewState,
                    longitude: lng,
                    latitude: lat,
                    zoom: 14
                });
            } else if (feature.layer.id === 'product-coverage-layer' || feature.layer.id === 'similar-product-coverage-layer') {
                const { lng, lat } = event.lngLat;
                setViewState({
                    ...viewState,
                    longitude: lng,
                    latitude: lat,
                    zoom: 14 // Zoom in close to the polygon
                });
            }
        }
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
            interactiveLayerIds={['clusters', 'product-coverage-layer', 'similar-product-coverage-layer']}
            onClick={handleLayerClick}
            onMove={evt => setViewState(evt.viewState)}
        >
            <Source id="coverage-areas" type="geojson" data={{
                type: "FeatureCollection",
                features: coverageFeatures
            }}>
                <Layer
                    id="product-coverage-layer"
                    type="fill"
                    paint={{
                        'fill-color': '#203A58',
                        'fill-opacity': 0.5
                    }}
                    filter={['==', 'isProduct', true]}
                />
                <Layer
                    id="similar-product-coverage-layer"
                    type="fill"
                    paint={{
                        'fill-color': '#9e0000',
                        'fill-opacity': 0.4
                    }}
                    filter={['==', 'isProduct', false]}
                />
                <Layer
                    id="product-outline-layer"
                    type="line"
                    paint={{
                        'line-color': '#203A58',
                        'line-width': 2
                    }}
                    filter={['==', 'isProduct', true]}
                />
                <Layer
                    id="similar-product-outline-layer"
                    type="line"
                    paint={{
                        'line-color': '#9e0000',
                        'line-width': 2
                    }}
                    filter={['==', 'isProduct', false]}
                />
            </Source>
            <Source
                id="location-clusters"
                type="geojson"
                data={{
                    type: "FeatureCollection",
                    features: [
                        ...productLocations.map(location => ({
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [location.region[1], location.region[0]]
                            },
                            properties: {
                                category: 'product'
                            }
                        })),
                        // ...competitionLocations.map(location => ({
                        //     type: "Feature",
                        //     geometry: {
                        //         type: "Point",
                        //         coordinates: [location.region[1], location.region[0]]
                        //     },
                        //     properties: {
                        //         category: 'competition'
                        //     }
                        // }))
                    ]
                }}
                cluster={true}
                clusterMaxZoom={14}
                clusterRadius={50}
            >
                <Layer {...clusterLayer} />
                <Layer {...clusterCountLayer} />
                <Layer {...unclusteredPointLayer} />
            </Source>
            {viewState.zoom > 10 && productLocations.map((location, index) => (
                <Marker
                    key={`product-${index}`}
                    longitude={location.region[1]}
                    latitude={location.region[0]}
                    onClick={() => setSelectedLocation(location)}
                >
                    <FaLocationDot
                        size={6}
                        color="#81B29A"
                        style={{ cursor: 'pointer' }}
                    />
                </Marker>
            ))}
            {/* {viewState.zoom > 10 && competitionLocations.map((location, index) => (
                <Marker
                    key={`competition-${index}`}
                    longitude={location.region[1]}
                    latitude={location.region[0]}
                    onClick={() => setSelectedLocation(location)}
                >
                    <FaLocationDot
                        size={20}
                        color="#fc5805"
                        style={{ cursor: 'pointer' }}
                    />
                </Marker>
            ))} */}
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
                    </div>
                </Popup>
            )}
        </Map>
    );
};

export default MapComponent; 