import { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI, storesAPI, inventoriesAPI } from '../services/api';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', parentId: '' });
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    imageUrl: '',
    categoryId: '',
    inventories: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, storesRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        storesAPI.getAll(),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setStores(storesRes.data);

      // Initialize inventories for each store
      if (storesRes.data.length > 0 && formData.inventories.length === 0) {
        setFormData(prev => ({
          ...prev,
          inventories: storesRes.data.map(store => ({
            storeId: store.id,
            price: '',
            currency: 'SUM',
            stockCount: '0',
          })),
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        code: formData.code,
        imageUrl: formData.imageUrl || null,
        categoryId: formData.categoryId || null,
        inventories: formData.inventories
          .filter(inv => inv.price && inv.price !== '')
          .map(inv => ({
            storeId: parseInt(inv.storeId),
            price: parseFloat(inv.price),
            currency: inv.currency,
            stockCount: parseInt(inv.stockCount || 0),
          })),
      };

      if (editingProduct) {
        // Update product
        await productsAPI.update(editingProduct.id, {
          name: data.name,
          code: data.code,
          imageUrl: data.imageUrl,
          categoryId: data.categoryId,
        });

        // Update inventories
        for (const invData of data.inventories) {
          // Find existing inventory
          const existingInventory = editingProduct.inventories?.find(
            inv => inv.storeId === invData.storeId
          );

          if (existingInventory) {
            // Update existing inventory
            await inventoriesAPI.update(existingInventory.id, {
              price: invData.price,
              currency: invData.currency,
              stockCount: invData.stockCount,
            });
          } else {
            // Create new inventory if doesn't exist
            await inventoriesAPI.create({
              productId: editingProduct.id,
              storeId: invData.storeId,
              price: invData.price,
              currency: invData.currency,
              stockCount: invData.stockCount,
            });
          }
        }
      } else {
        await productsAPI.create(data);
      }
      await fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.error || 'Mahsulotni saqlashda xatolik');
    }
  };

  const handleInventoryChange = (storeId, field, value) => {
    setFormData(prev => ({
      ...prev,
      inventories: prev.inventories.map(inv =>
        inv.storeId === storeId ? { ...inv, [field]: value } : inv
      ),
    }));
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId ? product.categoryId.toString() : '',
      inventories: stores.map(store => {
        const inventory = product.inventories?.find(inv => inv.storeId === store.id);
        return {
          storeId: store.id,
          price: inventory ? inventory.price.toString() : '',
          currency: inventory?.currency || 'SUM',
          stockCount: inventory ? inventory.stockCount.toString() : '0',
        };
      }),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu mahsulotni o\'chirishni xohlaysizmi?')) return;
    
    try {
      await productsAPI.delete(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Mahsulotni o\'chirishda xatolik');
    }
  };

  const openModal = async () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
    
    // Load next suggested code when creating new product
    try {
      const response = await productsAPI.getNextCode();
      if (response.data?.code) {
        setFormData(prev => ({
          ...prev,
          code: response.data.code,
        }));
      }
    } catch (error) {
      console.error('Error loading next code:', error);
      // Continue without auto-filling code if request fails
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      imageUrl: '',
      categoryId: '',
      inventories: stores.map(store => ({
        storeId: store.id,
        price: '',
        currency: 'SUM',
        stockCount: '0',
      })),
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Kategoriya yo\'q';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Noma\'lum';
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: categoryFormData.name,
        parentId: categoryFormData.parentId || null,
      };

      const response = await categoriesAPI.create(data);
      const newCategory = response.data;

      // Refresh categories list
      const categoriesRes = await categoriesAPI.getAll();
      setCategories(categoriesRes.data);

      // Set the newly created category as selected
      setFormData(prev => ({ ...prev, categoryId: newCategory.id.toString() }));

      // Close category modal
      setShowCategoryModal(false);
      setCategoryFormData({ name: '', parentId: '' });
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.error || 'Kategoriyani saqlashda xatolik');
    }
  };

  const openCategoryModal = () => {
    setCategoryFormData({ name: '', parentId: '' });
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setCategoryFormData({ name: '', parentId: '' });
  };

  if (loading) {
    return <div className="text-center py-8">Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mahsulotlar</h1>
        <button onClick={openModal} className="btn btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>Yangi mahsulot</span>
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nomi</th>
              <th>Kodi</th>
              <th>Kategoriya</th>
              <th>Narxi</th>
              <th>Rasm</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  Mahsulotlar mavjud emas
                </td>
              </tr>
            ) : (
              products.map((product) => {
                // Get first inventory price (or show all prices if multiple stores)
                const getPriceDisplay = () => {
                  if (!product.inventories || product.inventories.length === 0) {
                    return <span className="text-gray-400">-</span>;
                  }
                  
                  // If multiple stores, show all prices
                  if (product.inventories.length > 1) {
                    return (
                      <div className="space-y-1">
                        {product.inventories.map((inv, idx) => (
                          <div key={idx} className="text-sm">
                            {inv.price?.toLocaleString('uz-UZ')} {inv.currency}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  // Single price
                  const inv = product.inventories[0];
                  return (
                    <span className="font-medium text-blue-600">
                      {inv.price?.toLocaleString('uz-UZ')} {inv.currency}
                    </span>
                  );
                };

                return (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td className="font-medium">{product.name}</td>
                    <td className="font-mono text-sm">{product.code}</td>
                    <td>{getCategoryName(product.categoryId)}</td>
                    <td>{getPriceDisplay()}</td>
                    <td>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <span className="text-gray-400">Yo'q</span>
                      )}
                    </td>
                    <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NOMI *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Mahsulot nomini kiriting"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kodi
                    <span className="text-xs text-gray-500 ml-1">(bo'sh qoldirilsa avtomatik yaratiladi)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="SKU-00000 (ixtiyoriy)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoriya
                  </label>
                  <select
                    className="select"
                    value={formData.categoryId}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        // Reset select value
                        setTimeout(() => {
                          setFormData(prev => ({ ...prev, categoryId: prev.categoryId }));
                        }, 0);
                        openCategoryModal();
                      } else {
                        setFormData({ ...formData, categoryId: e.target.value });
                      }
                    }}
                  >
                    <option value="">Kategoriya tanlang</option>
                    {categories.length === 0 ? (
                      <option value="__add_new__">+ Kategoriya qo'shish</option>
                    ) : (
                      <>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                        <option value="__add_new__">+ Kategoriya qo'shish</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rasm URL
                  </label>
                  <input
                    type="url"
                    className="input"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded border border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Single Inventory Section - First Store Only */}
                {stores.length > 0 && formData.inventories.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">O'zgarish</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          NARXI *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="input"
                          value={formData.inventories[0].price}
                          onChange={(e) => handleInventoryChange(formData.inventories[0].storeId, 'price', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          VALYUTA
                        </label>
                        <select
                          className="select"
                          value={formData.inventories[0].currency}
                          onChange={(e) => handleInventoryChange(formData.inventories[0].storeId, 'currency', e.target.value)}
                        >
                          <option value="SUM">SUM</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SONI
                        </label>
                        <input
                          type="number"
                          className="input"
                          value={formData.inventories[0].stockCount}
                          onChange={(e) => handleInventoryChange(formData.inventories[0].storeId, 'stockCount', e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingProduct ? 'Saqlash' : 'Qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Yangi kategoriya</h2>
              <button onClick={closeCategoryModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomi *
                </label>
                <input
                  type="text"
                  className="input"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ota-kategoriya (ixtiyoriy)
                </label>
                <select
                  className="select"
                  value={categoryFormData.parentId}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, parentId: e.target.value })}
                >
                  <option value="">Yo'q (Asosiy kategoriya)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Qo'shish
                </button>
                <button type="button" onClick={closeCategoryModal} className="btn btn-secondary">
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
