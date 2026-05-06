"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";
import { Upload, Layers, Map as MapIcon } from "lucide-react";
import L from "leaflet";

const predefinedColors = [
    "#99cc00", "#ff9900", "#339866", "#800080",
    "#ffcc99", "#33cccc", "#008080", "#666699",
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
];

const AVAILABLE_LAYERS = [
    { id: "biciestacionamientos", name: "Shapes/Biciestacionamientos...", path: "/shapefiles/Social/Biciestacionamientos_Final.shp", color: "#99cc00" },
    { id: "centros_justicia", name: "Shapes/Centros_de_justicia", path: "/shapefiles/Social/Centros_de_justicia.shp", color: "#ff9900" },
    { id: "motos", name: "Shapes/Estacionamientos_Moto...", path: "/shapefiles/Social/Estacionamientos_Moto.shp", color: "#339866" },
    { id: "pilares", name: "Shapes/Pilares", path: "/shapefiles/Social/Pilares.shp", color: "#800080" },
    { id: "ut", name: "Shapes/UT", path: "/shapefiles/Social/UT.shp", color: "#ffcc99" },
    { id: "utopias", name: "Shapes/utopias", path: "/shapefiles/Social/utopias.shp", color: "#33cccc" }
];

function BoundsManager({ geojson, fitBounds }: { geojson: any, fitBounds: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (geojson && fitBounds) {
            try {
                const bounds = L.geoJSON(geojson).getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [20, 20] });
                }
            } catch (e) { }
        }
    }, [geojson, fitBounds, map]);
    return null;
}

export default function MapViewer() {
    const [layers, setLayers] = useState<any[]>([]);
    const [baseLayer, setBaseLayer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const colorIndex = useRef(0);

    // Keep track of which predefined layers are toggled ON
    const [activePredefined, setActivePredefined] = useState<Record<string, boolean>>({});

    const getNextColor = () => {
        const c = predefinedColors[colorIndex.current % predefinedColors.length];
        colorIndex.current += 1;
        return c;
    };

    useEffect(() => {
        const loadDefaults = async () => {
            try {
                const base = await shp("/shapefiles/09mun.shp");
                setBaseLayer(base);
            } catch (e) {
                console.error("Failed to load base layer", e);
            }
        };
        loadDefaults();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".zip")) {
            alert("Please provide a .zip file containing the Shapefile (.shp, .dbf, .shx)");
            e.target.value = "";
            return;
        }

        setLoading(true);
        try {
            const buffer = await file.arrayBuffer();
            const geojson = await shp(buffer);

            const layersData = Array.isArray(geojson) ? geojson : [geojson];
            const newLayers = layersData.map((data, i) => {
                const name = data.fileName || file.name.replace(".zip", "") + (layersData.length > 1 ? ` ${i + 1}` : "");
                return {
                    id: `user-${Date.now()}-${i}`,
                    name: name,
                    data: data,
                    color: getNextColor(),
                    active: true,
                    isNew: i === 0,
                    isUserUpload: true
                };
            });

            setLayers((prev) => [...newLayers, ...prev]);
        } catch (err) {
            console.error("Error processing file:", err);
            alert("Error loading shapefile. Ensure user is uploading a valid zip.");
        } finally {
            setLoading(false);
            e.target.value = "";
        }
    };

    const togglePredefinedLayer = async (layerConfig: any) => {
        const isCurrentlyActive = !!activePredefined[layerConfig.id];

        // Toggle state visually immediately
        setActivePredefined(prev => ({ ...prev, [layerConfig.id]: !isCurrentlyActive }));

        // If it was already loaded into `layers`, just toggle its `active` status
        if (layers.some(l => l.id === layerConfig.id)) {
            setLayers(prev => prev.map(l => l.id === layerConfig.id ? { ...l, active: !isCurrentlyActive, isNew: false } : l));
            return;
        }

        // If turning ON for the first time, fetch it natively from /public/shapefiles
        if (!isCurrentlyActive) {
            setLoading(true);
            try {
                const geojson = await shp(layerConfig.path);
                const loadedLayer = {
                    id: layerConfig.id,
                    name: layerConfig.name,
                    data: geojson,
                    color: layerConfig.color,
                    active: true,
                    isNew: true,
                    isUserUpload: false
                };
                setLayers(prev => [...prev, loadedLayer]);
            } catch (err) {
                console.error(`Error loading predefined layer ${layerConfig.name}:`, err);
                alert(`Error cargando capa ${layerConfig.name}`);
                setActivePredefined(prev => ({ ...prev, [layerConfig.id]: false })); // revert
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleUserLayer = (id: string) => {
        setLayers(layers.map(l => l.id === id ? { ...l, active: !l.active, isNew: false } : { ...l, isNew: false }));
    };

    return (
        <div className="flex h-screen w-full font-outfit">
            {/* Sidebar */}
            <aside className="w-[340px] bg-white shadow-lg z-10 flex flex-col border-r h-full relative">
                <div className="p-6 bg-mapPrimary text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <MapIcon size={24} />
                        <h1 className="text-2xl font-bold tracking-wide">Visor CDMX</h1>
                    </div>
                    <p className="text-sm opacity-90 text-gray-200 leading-tight">Capas Geográficas CDMX</p>

                    <label className="mt-6 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors border border-white/30 rounded-lg p-3 cursor-pointer">
                        <Upload size={18} />
                        <span className="font-medium text-sm">Cargar .zip Shapefile</span>
                        <input type="file" className="hidden" accept=".zip" onChange={handleFileUpload} />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="flex items-center gap-2 mb-4 text-gray-600">
                        <Layers size={18} />
                        <h2 className="font-semibold uppercase text-xs tracking-wider">CAPAS ACTIVAS</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Predefined Layers fetched naturally */}
                        <div className="space-y-4">
                            {AVAILABLE_LAYERS.map(layer => (
                                <div key={layer.id} className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={!!activePredefined[layer.id]}
                                        onChange={() => togglePredefinedLayer(layer)}
                                        className="w-5 h-5 text-mapPrimary rounded border-gray-300 focus:ring-mapPrimary accent-mapPrimary cursor-pointer"
                                    />
                                    <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-none">
                                        <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: layer.color }}></div>
                                        <span className="text-[15px] text-black truncate font-medium">{layer.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* User Uploaded Layers via ZIP */}
                        {layers.filter(l => l.isUserUpload).map(layer => (
                            <div key={layer.id} className="flex items-center gap-3 mt-4">
                                <input
                                    type="checkbox"
                                    checked={layer.active}
                                    onChange={() => toggleUserLayer(layer.id)}
                                    className="w-5 h-5 text-mapPrimary rounded border-gray-300 focus:ring-mapPrimary accent-mapPrimary cursor-pointer"
                                />
                                <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-none">
                                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: layer.color }}></div>
                                    <span className="text-[15px] text-gray-800 truncate font-medium">{layer.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t mt-auto">
                    <div className="text-xs text-center text-gray-500">
                        Datos utilizando registros de la Fiscalía General de Justicia CDMX
                    </div>
                </div>
            </aside>

            {/* Map Content */}
            <main className="flex-1 relative">
                {loading && (
                    <div className="absolute inset-0 z-[1000] bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-mapPrimary border-t-transparent"></div>
                            <p className="mt-4 font-semibold text-mapPrimary">Procesando Shapefile...</p>
                        </div>
                    </div>
                )}

                <MapContainer center={[19.4326, -99.1332]} zoom={10} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; CARTO'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        maxZoom={20}
                    />

                    {baseLayer && (
                        <GeoJSON
                            data={baseLayer}
                            style={{
                                color: '#333333',
                                weight: 1.5,
                                fillOpacity: 0,
                                dashArray: '5, 5'
                            }}
                        />
                    )}

                    {layers.filter(l => l.active).map(layer => (
                        <div key={layer.id}>
                            <BoundsManager geojson={layer.data} fitBounds={layer.isNew} />
                            <GeoJSON
                                data={layer.data}
                                pointToLayer={(feature, latlng) => {
                                    return L.circleMarker(latlng, {
                                        radius: 5,
                                        fillColor: layer.color,
                                        color: '#fff',
                                        weight: 1,
                                        opacity: 1,
                                        fillOpacity: 0.8
                                    });
                                }}
                                style={() => ({
                                    color: layer.color,
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0.4
                                })}
                                onEachFeature={(feature, featureLayer) => {
                                    if (feature.properties) {
                                        let html = '<div class="font-outfit text-sm" style="max-height: 200px; overflow: auto; min-width: 200px;">';
                                        Object.entries(feature.properties).slice(0, 8).forEach(([k, v]) => {
                                            html += `<div class="border-b last:border-b-0 py-1"><span class="font-semibold text-gray-700">${k}:</span> <span class="text-gray-900">${v}</span></div>`;
                                        });
                                        html += '</div>';
                                        featureLayer.bindPopup(html);
                                    }
                                }}
                            />
                        </div>
                    ))}
                </MapContainer>
            </main>
        </div>
    );
}
