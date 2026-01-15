import { useState, useEffect } from 'react';
import { storesAPI } from '../services/api';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '' });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await storesAPI.getAll();
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
      alert('Do\'konlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStore) {
        await storesAPI.update(editingStore.id, formData);
      } else {
        await storesAPI.create(formData);
      }
      await fetchStores();
      setShowModal(false);
      setFormData({ name: '', address: '' });
      setEditingStore(null);
    } catch (error) {
      console.error('Error saving store:', error);
      alert('Do\'konni saqlashda xatolik');
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({ name: store.name, address: store.address });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu do\'konni o\'chirishni xohlaysizmi?')) return;
    
    try {
      await storesAPI.delete(id);
      await fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      alert('Do\'konni o\'chirishda xatolik');
    }
  };

  const openModal = () => {
    setEditingStore(null);
    setFormData({ name: '', address: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStore(null);
    setFormData({ name: '', address: '' });
  };

  if (loading) {
    return <div className="text-center py-8">Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Do'konlar</h1>
        <button onClick={openModal} className="btn btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>Yangi do'kon</span>
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nomi</th>
              <th>Manzil</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  Do'konlar mavjud emas
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id}>
                  <td>{store.id}</td>
                  <td className="font-medium">{store.name}</td>
                  <td>{store.address}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(store)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(store.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingStore ? 'Do\'konni tahrirlash' : 'Yangi do\'kon'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomi *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manzil *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingStore ? 'Saqlash' : 'Qo\'shish'}
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">
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

export default Stores;
