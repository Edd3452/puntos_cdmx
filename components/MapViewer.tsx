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

    const getNextColor = () => {
        const c = predefinedColors[colorIndex.current % predefinedColors.length];
        colorIndex.current += 1;
        return c;
    };

    useEffect(() => {
        // Load default boundaries and layers here
        const loadDefaults = async () => {
            try {
                const base = await shp("/shapefiles/09mun.shp");
                setBaseLayer(base);

                // Preload example layers
                const marginacion = await shp("/shapefiles/GradoMarginacion.shp");
                setLayers((prev) => [
                    ...prev,
                    { id: "marginacion", name: "Grado Marginación", data: marginacion, color: getNextColor(), active: true }
                ]);

            } catch (e) {
                console.error("Failed to load initial layers", e);
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
                    isNew: i === 0
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

    const toggleLayer = (id: string) => {
        setLayers(layers.map(l => l.id === id ? { ...l, active: !l.active, isNew: false } : { ...l, isNew: false }));
    };

    return (
        <div className="flex h-screen w-full font-outfit">
            {/* Sidebar */}
            <aside className="w-80 bg-white shadow-lg z-10 flex flex-col border-r h-full relative">
                <div className="p-6 bg-mapPrimary text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <MapIcon size={24} />
                        <h1 className="text-xl font-bold tracking-wide">Visor CDMX</h1>
                    </div>
                    <p className="text-sm opacity-90 text-gray-200 leading-tight">Capas Geográficas CDMX</p>

                    <label className="mt-6 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors border border-white/30 rounded-lg p-3 cursor-pointer">
                        <Upload size={18} />
                        <span className="font-medium text-sm">Cargar .zip Shapefile</span>
                        <input type="file" className="hidden" accept=".zip" onChange={handleFileUpload} />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex items-center gap-2 mb-4 text-gray-600">
                        <Layers size={18} />
                        <h2 className="font-semibold uppercase text-xs tracking-wider">Capas Activas</h2>
                    </div>

                    <div className="space-y-2">
                        {layers.map(layer => (
                            <div key={layer.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${layer.active ? 'bg-gray-50 border-gray-200' : 'bg-white border-transparent'}`}>
                                <input
                                    type="checkbox"
                                    checked={layer.active}
                                    onChange={() => toggleLayer(layer.id)}
                                    className="w-4 h-4 text-mapPrimary rounded focus:ring-mapPrimary accent-mapPrimary cursor-pointer"
                                />
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: layer.color }}></div>
                                    <span className="text-sm text-gray-800 truncate font-medium">{layer.name}</span>
                                </div>
                            </div>
                        ))}
                        {layers.length === 0 && !loading && (
                            <p className="text-center text-sm text-gray-400 py-8">Ninguna capa cargada</p>
                        )}
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
