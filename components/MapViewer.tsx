"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";
import { Layers, Map as MapIcon, ChevronDown, ChevronRight, Info } from "lucide-react";
import L from "leaflet";

const predefinedColors = [
    "#99cc00", "#ff9900", "#339866", "#800080",
    "#ffcc99", "#33cccc", "#008080", "#666699",
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
];

const CHOROPLETH_CONFIG: Record<string, any> = {
    "ageb": {
        column: "e_idsm",
        mapping: {
            "Muy bajo": "#4b2c7f",
            "Bajo": "#3b509d",
            "Medio": "#d15c7a",
            "Alto": "#e17061",
            "Muy alto": "#9bb2c0",
            "Sin información": "#ffffff",
            "Sin informacin": "#ffffff"
        },
        legendTitle: "Estratos IDS",
        headerTitle: "Índice de Desarrollo Social (IDS) de la Ciudad de México por AGEB, 2020"
    },
    "marginacion": {
        column: "GM_2020",
        mapping: {
            "Muy alto": "#4b2c7f",
            "Alto": "#3b509d",
            "Medio": "#d15c7a",
            "Bajo": "#e17061",
            "Muy bajo": "#9bb2c0",
        },
        legendTitle: "Grado de Marginación",
        headerTitle: "Grado de Marginación por Colonia, 2020"
    }
};

const LAYER_CATEGORIES = [
    {
        id: "sociales",
        name: "Sociales",
        layers: [
            { id: "biciestacionamientos", name: "Biciestacionamientos", path: "/shapefiles/Social/Biciestacionamientos_Final" },
            { id: "centros_justicia", name: "Centros de justicia", path: "/shapefiles/Social/Centros_de_justicia" },
            { id: "motos", name: "Estacionamientos Moto", path: "/shapefiles/Social/Estacionamientos_Moto" },
            { id: "pilares", name: "Pilares", path: "/shapefiles/Social/Pilares" },
            { id: "ut", name: "UT", path: "/shapefiles/Social/UT" },
            { id: "utopias", name: "Utopias", path: "/shapefiles/Social/utopias" }
        ]
    },
    {
        id: "delitos",
        name: "Delitos",
        subcategories: [
            {
                id: "delitos_personas",
                name: "Delitos a personas",
                layers: [
                    { id: "homicidios", name: "Homicidios", path: "/shapefiles/Delitos/Delitos a personas/Homicidios" },
                    { id: "robo_casa", name: "Robo a casa habitación", path: "/shapefiles/Delitos/Delitos a personas/ROBO A CASA HABITACIÓN" },
                    { id: "robo_cuenta", name: "Robo a cuentahabiente", path: "/shapefiles/Delitos/Delitos a personas/ROBO A CUENTAHABIENTE" },
                    { id: "robo_negocio", name: "Robo a negocio con violencia", path: "/shapefiles/Delitos/Delitos a personas/ROBO A NEGOCIO CON VIOLENCIA" },
                    { id: "violaciones", name: "Violaciones", path: "/shapefiles/Delitos/Delitos a personas/VIOLACIONES" }
                ]
            },
            {
                id: "delitos_vehiculos",
                name: "Delitos con vehículos implicados",
                layers: [
                    { id: "robo_pasajero_microbus", name: "Robo a pasajero en microbús", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DE MICROBUS" },
                    { id: "robo_pasajero_taxi", name: "Robo a pasajero en taxi", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DE TAXI" },
                    { id: "robo_pasajero_metro", name: "Robo a pasajero en metro", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A PASAJERO A BORDO DEL METRO" },
                    { id: "robo_repartidor", name: "Robo a repartidor", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A REPARTIDOR" },
                    { id: "robo_transportista", name: "Robo a transportista", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO A TRASPORTISTA" },
                    { id: "robo_moto_violencia", name: "Robo de motocicleta con violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE MOTOCICLETA CON VIOLENCIA" },
                    { id: "robo_moto_sin_violencia", name: "Robo de motocicleta sin violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE MOTOCICLETA SIN VIOLENCIA" },
                    { id: "robo_vehiculo_particular_violencia", name: "Robo de vehículo particular con violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO DE SERVICIO PARTICULAR CON VIOLENCIA" },
                    { id: "robo_vehiculo_publico_sin_violencia", name: "Robo de vehículo público sin violencia", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO DE SERVICIO PÚBLICO SIN VIOLENCIA" },
                    { id: "robo_vehiculo", name: "Robo de vehículo", path: "/shapefiles/Delitos/Delitos con vehiculos implicados/ROBO DE VEHICULO" }
                ]
            }
        ]
    },
    {
        id: "ni_una_menos",
        name: "Registros (Ni una menos)",
        layers: [
            { id: "acoso", name: "Acoso y agresión", path: "/shapefiles/Ni una menos/Acoso y agresióin" },
            { id: "asaltos", name: "Asaltos", path: "/shapefiles/Ni una menos/Asaltos" },
            { id: "fraudes", name: "Fraudes", path: "/shapefiles/Ni una menos/Fraudes" },
            { id: "intento_asalto", name: "Intento de asalto", path: "/shapefiles/Ni una menos/Intento de asalto" }
        ]
    },
    {
        id: "socio_demograficas",
        name: "Socio Demográficas",
        layers: [
            { id: "marginacion", name: "Grado de Marginación", path: "/shapefiles/Socio demografico/GradoMarginación" },
            { id: "ageb", name: "AGEB CDMX", path: "/shapefiles/Socio demografico/ids_ageb_cdmx" }
        ]
    }
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

function Legend({ config }: { config: any }) {
    return (
        <div className="absolute bottom-10 right-10 z-[1000] bg-white p-5 rounded-xl shadow-2xl border border-gray-100 font-outfit min-w-[200px] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-sm font-extrabold text-gray-800 mb-4 border-b pb-2 tracking-tight">{config.legendTitle}</h3>
            <div className="space-y-3">
                {Object.entries(config.mapping).map(([label, color]: [string, any]) => {
                    if (label.includes("informaci")) return null;
                    return (
                        <div key={label} className="flex items-center gap-3 group">
                            <div 
                                className="w-5 h-5 rounded shadow-sm border border-black/5 group-hover:scale-110 transition-transform" 
                                style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-xs font-semibold text-gray-600 group-hover:text-black transition-colors">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function MapViewer() {
    const [layers, setLayers] = useState<any[]>([]);
    const [baseLayer, setBaseLayer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const colorIndex = useRef(0);

    // Keep track of which predefined layers are toggled ON
    const [activePredefined, setActivePredefined] = useState<Record<string, boolean>>({});
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        sociales: true,
        delitos: false,
        ni_una_menos: false,
        socio_demograficas: false
    });

    const toggleCategory = (id: string) => {
        setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getNextColor = () => {
        const c = predefinedColors[colorIndex.current % predefinedColors.length];
        colorIndex.current += 1;
        return c;
    };

    useEffect(() => {
        const loadDefaults = async () => {
            try {
                // Prepend origin to avoid "Invalid URL" error in shpjs
                const baseUrl = window.location.origin;
                const base = await shp(baseUrl + "/shapefiles/09mun");
                setBaseLayer(base);
            } catch (e) {
                console.error("Failed to load base layer", e);
            }
        };
        loadDefaults();
    }, []);



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
                // Prepend origin and encode to avoid "Invalid URL" error in shpjs
                const baseUrl = window.location.origin;
                const fullPath = baseUrl + encodeURI(layerConfig.path);
                const geojson = await shp(fullPath);
                const loadedLayer = {
                    id: layerConfig.id,
                    name: layerConfig.name,
                    data: geojson,
                    color: layerConfig.color || getNextColor(),
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


                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <h2 className="text-xl font-bold text-mapPrimary mb-4">Menús Disponibles</h2>

                    <div className="bg-[#e3f2fd] p-4 rounded-lg flex gap-3 mb-6">
                        <Info className="text-mapPrimary shrink-0" size={20} />
                        <p className="text-sm text-mapPrimary font-medium leading-tight">
                            Seleccione las categorías para visualizar las capas.
                        </p>
                    </div>

                    <div className="space-y-2">
                        {LAYER_CATEGORIES.map(category => (
                            <div key={category.id} className="border-b border-gray-100 last:border-0 pb-2">
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-mapPrimary">
                                            {openCategories[category.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                        <span className={`font-semibold text-lg ${openCategories[category.id] ? 'text-mapPrimary' : 'text-gray-700'} group-hover:text-mapPrimary transition-colors`}>
                                            {category.name}
                                        </span>
                                    </div>
                                </button>

                                {openCategories[category.id] && (
                                    <div className="pl-8 pr-2 space-y-3 mt-1 pb-2">
                                        {category.layers?.map(layer => (
                                            <label key={layer.id} className="flex items-center gap-3 cursor-pointer group/item">
                                                <input
                                                    type="checkbox"
                                                    checked={!!activePredefined[layer.id]}
                                                    onChange={() => togglePredefinedLayer(layer)}
                                                    className="w-4 h-4 text-mapPrimary rounded border-gray-300 focus:ring-mapPrimary accent-mapPrimary cursor-pointer"
                                                />
                                                <span className="text-sm text-gray-600 group-hover/item:text-black transition-colors">
                                                    {layer.name}
                                                </span>
                                            </label>
                                        ))}

                                        {category.subcategories?.map(sub => (
                                            <div key={sub.id} className="space-y-2 pt-2 border-t border-gray-50 mt-4 first:mt-0 first:border-0 first:pt-0">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">{sub.name}</h3>
                                                <div className="space-y-3 pl-1">
                                                    {sub.layers.map(layer => (
                                                        <label key={layer.id} className="flex items-center gap-3 cursor-pointer group/item">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!activePredefined[layer.id]}
                                                                onChange={() => togglePredefinedLayer(layer)}
                                                                className="w-4 h-4 text-mapPrimary rounded border-gray-300 focus:ring-mapPrimary accent-mapPrimary cursor-pointer"
                                                            />
                                                            <span className="text-sm text-gray-600 group-hover/item:text-black transition-colors">
                                                                {layer.name}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                style={(feature) => {
                                    const config = CHOROPLETH_CONFIG[layer.id];
                                    if (config && feature) {
                                        const val = feature.properties?.[config.column] || "Sin información";
                                        const color = config.mapping[val] || "#ffffff";
                                        return {
                                            fillColor: color,
                                            color: '#666666',
                                            weight: 1,
                                            fillOpacity: 0.7
                                        };
                                    }
                                    return {
                                        color: layer.color,
                                        weight: 2,
                                        opacity: 1,
                                        fillOpacity: 0.4
                                    };
                                }}
                                onEachFeature={(feature, featureLayer) => {
                                    if (feature.properties) {
                                        const config = CHOROPLETH_CONFIG[layer.id];
                                        let html = '<div class="font-outfit text-sm" style="max-height: 250px; overflow: auto; min-width: 220px; padding: 4px;">';
                                        
                                        // Highlight the classification if it's a choropleth layer
                                        if (config && feature.properties[config.column]) {
                                            const val = feature.properties[config.column];
                                            const color = config.mapping[val] || "#333";
                                            html += `
                                                <div class="mb-4 p-3 rounded-lg border-l-4 shadow-sm" style="border-left-color: ${color}; background-color: ${color}15">
                                                    <div class="text-[10px] uppercase font-bold text-gray-500 mb-1">${config.legendTitle}</div>
                                                    <div class="text-base font-extrabold" style="color: ${color}">${val}</div>
                                                </div>
                                            `;
                                        }

                                        Object.entries(feature.properties).slice(0, 10).forEach(([k, v]) => {
                                            if (config && k === config.column) return; // Skip as it's already shown
                                            html += `<div class="border-b last:border-b-0 py-1.5 flex justify-between gap-4"><span class="font-bold text-gray-500 text-[10px] uppercase">${k}</span> <span class="text-gray-900 font-semibold text-right">${v}</span></div>`;
                                        });
                                        html += '</div>';
                                        featureLayer.bindPopup(html);
                                    }
                                }}
                            />
                        </div>
                    ))}
                </MapContainer>

                {/* Legend for Sociodemographic layers */}
                {layers.filter(l => l.active && CHOROPLETH_CONFIG[l.id]).map(layer => (
                    <Legend key={`legend-${layer.id}`} config={CHOROPLETH_CONFIG[layer.id]} />
                ))}

                {/* Top Banner for Sociodemographic titles */}
                {layers.some(l => l.active && CHOROPLETH_CONFIG[l.id]) && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl px-4 pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-md text-mapPrimary px-6 py-4 rounded-2xl shadow-2xl border border-white/20 text-center animate-in fade-in zoom-in duration-500">
                            <h3 className="text-sm md:text-base font-black tracking-tight leading-tight">
                                {CHOROPLETH_CONFIG[layers.findLast(l => l.active && CHOROPLETH_CONFIG[l.id])?.id]?.headerTitle}
                            </h3>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
