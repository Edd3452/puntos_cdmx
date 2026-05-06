import dynamic from "next/dynamic";

const MapViewer = dynamic(() => import("@/components/MapViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-mapPrimary border-t-transparent"></div>
                <p className="mt-4 text-mapPrimary font-medium">Cargando Mapas...</p>
            </div>
        </div>
    ),
});

export default function Home() {
    return (
        <main className="app-layout">
            <MapViewer />
        </main>
    );
}
