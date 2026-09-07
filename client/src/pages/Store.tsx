import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Star, Package, CheckCircle, XCircle, Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { getStoreProducts, createStoreProduct, updateStoreProduct, deleteStoreProduct, redeemStoreProduct, getAthletes } from '../api';
import { useAuth } from '../contexts/AuthContext';

interface Product {
    _id: string;
    name: string;
    description: string;
    pointsCost: number;
    stock: number;
    image?: string;
    isActive?: boolean;
}

interface Athlete {
    _id: string;
    name: string;
    balance: number;
}

interface ProductFormData {
    name: string;
    description: string;
    pointsCost: number | '';
    stock: number | '';
    image: string;
    isActive: boolean;
}

const initialFormState: ProductFormData = {
    name: '',
    description: '',
    pointsCost: '',
    stock: '',
    image: '',
    isActive: true
};

const Store: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [products, setProducts] = useState<Product[]>([]);
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [selectedAthlete, setSelectedAthlete] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<string | null>(null);

    // Modal state for Admin product creation / editing
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(initialFormState);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [isAdmin]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prods, aths] = await Promise.all([
                getStoreProducts(isAdmin),
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

    const handleOpenCreateModal = () => {
        setEditingProduct(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            pointsCost: product.pointsCost,
            stock: product.stock,
            image: product.image || '',
            isActive: product.isActive !== undefined ? product.isActive : true
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData(initialFormState);
    };

    const handleSubmitProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('El nombre del producto es obligatorio');
            return;
        }
        if (formData.pointsCost === '' || Number(formData.pointsCost) < 0) {
            toast.error('Ingresa un costo de puntos válido');
            return;
        }
        if (formData.stock === '' || Number(formData.stock) < 0) {
            toast.error('Ingresa un stock válido');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                pointsCost: Number(formData.pointsCost),
                stock: Number(formData.stock),
                image: formData.image.trim() || undefined,
                isActive: formData.isActive
            };

            if (editingProduct) {
                await updateStoreProduct(editingProduct._id, payload);
                toast.success('Producto actualizado exitosamente');
            } else {
                await createStoreProduct(payload);
                toast.success('Producto creado exitosamente');
            }

            handleCloseModal();
            const refreshedProducts = await getStoreProducts(isAdmin);
            setProducts(refreshedProducts);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al guardar el producto');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (productId: string, productName: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar "${productName}"?`)) return;

        try {
            await deleteStoreProduct(productId);
            toast.success('Producto eliminado con éxito');
            setProducts(prev => prev.filter(p => p._id !== productId));
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al eliminar el producto');
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
            setAthletes(prev =>
                prev.map(a => a._id === selectedAthlete ? { ...a, balance: result.balance } : a)
            );
            const prods = await getStoreProducts(isAdmin);
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

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    {isAdmin && (
                        <button
                            onClick={handleOpenCreateModal}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 border border-blue-400/30 cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            Nuevo Producto
                        </button>
                    )}

                    <div className="flex flex-col gap-1 min-w-[280px]">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seleccionar Atleta</label>
                        <select
                            value={selectedAthlete}
                            onChange={(e) => setSelectedAthlete(e.target.value)}
                            className="bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Elige un atleta --</option>
                            {[...athletes].sort((a, b) => b.balance - a.balance).map(a => (
                                <option key={a._id} value={a._id}>
                                    {a.name} ({a.balance ?? 0} pts)
                                </option>
                            ))}
                        </select>
                        {currentAthlete && (
                            <div className="flex items-center gap-2 text-yellow-500 font-bold px-1 text-sm mt-1">
                                <Star className="w-4 h-4 fill-current" />
                                <span>Balance actual: {currentAthlete.balance ?? 0} pts</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-700/50 p-8">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-xl font-medium text-slate-400 mb-4">No hay productos disponibles en este momento.</p>
                        {isAdmin && (
                            <button
                                onClick={handleOpenCreateModal}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-lg inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                            >
                                <Plus className="w-5 h-5" />
                                Crear el primer producto
                            </button>
                        )}
                    </div>
                ) : (
                    products.map(product => {
                        const canAfford = currentAthlete ? currentAthlete.balance >= product.pointsCost : false;
                        const isLoading = redeeming === product._id;
                        const isOutOfStock = product.stock <= 0;
                        const isInactive = product.isActive === false;

                        return (
                            <div
                                key={product._id}
                                className={`bg-slate-800 rounded-2xl overflow-hidden border ${
                                    isInactive
                                        ? 'border-red-900/50 opacity-75'
                                        : isOutOfStock
                                        ? 'border-slate-700 opacity-90'
                                        : 'border-slate-700 hover:border-blue-500/50'
                                } transition-all group flex flex-col relative shadow-lg`}
                            >
                                <div className="h-48 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <ShoppingBag className="w-16 h-16 text-slate-700" />
                                    )}

                                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-lg text-sm">
                                        {product.pointsCost} PTS
                                    </div>

                                    {isAdmin && (
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            {isInactive && (
                                                <span className="bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow">
                                                    Inactivo
                                                </span>
                                            )}
                                            {isOutOfStock && (
                                                <span className="bg-amber-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow">
                                                    Agotado
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex-grow flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="text-xl font-bold text-white leading-tight">{product.name}</h3>
                                            {isAdmin && (
                                                <div className="flex items-center gap-1 shrink-0 bg-slate-900/70 p-1 rounded-lg border border-slate-700">
                                                    <button
                                                        onClick={() => handleOpenEditModal(product)}
                                                        title="Editar producto"
                                                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product._id, product.name)}
                                                        title="Eliminar producto"
                                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-slate-400 text-sm mb-4 line-clamp-3">{product.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                        <span className={`text-xs font-bold uppercase tracking-widest ${isOutOfStock ? 'text-red-400' : 'text-slate-400'}`}>
                                            Stock: {product.stock}
                                        </span>
                                        <button
                                            onClick={() => handleRedeem(product._id, product.name, product.pointsCost)}
                                            disabled={!selectedAthlete || !canAfford || isLoading || isOutOfStock || isInactive}
                                            className={`px-5 py-2 rounded-lg font-bold transition-all ${
                                                !selectedAthlete || !canAfford || isLoading || isOutOfStock || isInactive
                                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg active:scale-95 cursor-pointer'
                                            }`}
                                        >
                                            {isLoading ? 'Canjeando...' : isOutOfStock ? 'Sin Stock' : 'Canjear'}
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

            {/* Modal para Crear / Editar Producto */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShoppingBag className="w-6 h-6 text-blue-400" />
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto para Canje'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitProduct} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Nombre del Producto *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Kimono BJJ Pro, Parche Oficial..."
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Descripción *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Descripción del producto y detalles..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                        Costo en Puntos *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        placeholder="Ej: 500"
                                        value={formData.pointsCost}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pointsCost: e.target.value === '' ? '' : Number(e.target.value) }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                        Stock Inicial *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        placeholder="Ej: 10"
                                        value={formData.stock}
                                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value === '' ? '' : Number(e.target.value) }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <ImageIcon className="w-4 h-4 text-slate-400" />
                                    URL de Imagen (Opcional)
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                    value={formData.image}
                                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {editingProduct && (
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-slate-300 cursor-pointer">
                                        Producto activo y visible para canje
                                    </label>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2.5 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting ? 'Guardando...' : editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store;
