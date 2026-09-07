import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Star, Package, CheckCircle, XCircle } from 'lucide-react';
import { getStoreProducts, redeemStoreProduct, getAthletes } from '../api';

interface Product {
    _id: string;
    name: string;
    description: string;
    pointsCost: number;
    stock: number;
    image?: string;
}

interface Athlete {
    _id: string;
    name: string;
    balance: number;
}

const Store: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [selectedAthlete, setSelectedAthlete] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prods, aths] = await Promise.all([
                getStoreProducts(),
                getAthletes()
            ]);
            setProducts(prods);
            setAthletes(aths);
        } catch {
            toast.error('Error al cargar datos de la tienda');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (productId: string, productName: string, cost: number) => {
        if (!selectedAthlete) {
            toast.error('Por favor, selecciona un atleta primero');
            return;
        }

        const athlete = athletes.find(a => a._id === selectedAthlete);
        if (athlete && athlete.balance < cost) {
            toast.error(`Puntos insuficientes. Tiene ${athlete.balance} pts, necesita ${cost} pts.`);
            return;
        }

        if (!window.confirm(`¿Confirmas el canje de "${productName}" por ${cost} puntos?`)) return;

        setRedeeming(productId);
        try {
            const result = await redeemStoreProduct(selectedAthlete, productId);
            toast.success('¡Canje realizado con éxito!');
            // Update athlete balance locally without full refetch for better UX
            setAthletes(prev =>
                prev.map(a => a._id === selectedAthlete ? { ...a, balance: result.balance } : a)
            );
            // Refresh products to reflect new stock
            const prods = await getStoreProducts();
            setProducts(prods);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al realizar el canje');
        } finally {
            setRedeeming(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400 animate-pulse text-xl">Cargando tienda...</div>
            </div>
        );
    }

    const currentAthlete = athletes.find(a => a._id === selectedAthlete);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                <div>
                    <h1 className="text-3xl font-black text-blue-400 flex items-center gap-2">
                        <ShoppingBag className="w-8 h-8" />
                        TIENDA DE RECOMPENSAS
                    </h1>
                    <p className="text-slate-400 mt-1">Canjea tus puntos por productos oficiales de la academia</p>
                </div>

                <div className="flex flex-col gap-2 min-w-[300px]">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar Atleta</label>
                    <select
                        value={selectedAthlete}
                        onChange={(e) => setSelectedAthlete(e.target.value)}
                        className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">-- Elige un atleta --</option>
                        {[...athletes].sort((a, b) => b.balance - a.balance).map(a => (
                            <option key={a._id} value={a._id}>
                                {a.name} ({a.balance ?? 0} pts)
                            </option>
                        ))}
                    </select>
                    {currentAthlete && (
                        <div className="flex items-center gap-2 text-yellow-500 font-bold px-2">
                            <Star className="w-4 h-4 fill-current" />
                            <span>Balance actual: {currentAthlete.balance ?? 0} pts</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-500">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-xl">No hay productos disponibles en este momento.</p>
                    </div>
                ) : (
                    products.map(product => {
                        const canAfford = currentAthlete ? currentAthlete.balance >= product.pointsCost : false;
                        const isLoading = redeeming === product._id;

                        return (
                            <div key={product._id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all group flex flex-col">
                                <div className="h-48 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <ShoppingBag className="w-16 h-16 text-slate-700" />
                                    )}
                                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-lg text-sm">
                                        {product.pointsCost} PTS
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                                    <p className="text-slate-400 text-sm mb-4 flex-grow">{product.description}</p>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                                            Stock: {product.stock}
                                        </span>
                                        <button
                                            onClick={() => handleRedeem(product._id, product.name, product.pointsCost)}
                                            disabled={!selectedAthlete || !canAfford || isLoading}
                                            className={`px-6 py-2 rounded-lg font-bold transition-all ${
                                                !selectedAthlete || !canAfford || isLoading
                                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg active:scale-95'
                                            }`}
                                        >
                                            {isLoading ? 'Canjeando...' : 'Canjear'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    ¿Cómo funciona el canje?
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                    <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        Los puntos se ganan participando en torneos y eventos especiales.
                    </li>
                    <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        Al canjear, los puntos se descuentan de tu balance inmediatamente.
                    </li>
                    <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        Debes retirar el producto físico en la recepción de la academia.
                    </li>
                    <li className="flex gap-2">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        Los canjes no son reembolsables una vez procesados.
                    </li>
                </ul>
            </section>
        </div>
    );
};

export default Store;
