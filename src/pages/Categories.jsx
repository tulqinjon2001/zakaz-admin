import { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import { Plus, Edit, Trash2, X, ChevronRight, ChevronDown } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [formData, setFormData] = useState({ name: '', parentId: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Kategoriyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (categories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach(cat => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(cat.id));
        }
      } else {
        rootCategories.push(categoryMap.get(cat.id));
      }
    });

    return rootCategories;
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (categoryTree, level = 0) => {
    return categoryTree.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      
      return (
        <div key={category.id} className="mb-2">
          <div
            className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-50 ${
              level > 0 ? 'ml-6' : ''
            }`}
            style={{ paddingLeft: `${level * 24 + 8}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-600" />
                ) : (
                  <ChevronRight size={16} className="text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6"></div>
            )}
            <span className="flex-1 font-medium">{category.name}</span>
            <span className="text-sm text-gray-500">ID: {category.id}</span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(category)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        parentId: formData.parentId || null,
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, data);
      } else {
        await categoriesAPI.create(data);
      }
      await fetchCategories();
      setShowModal(false);
      setFormData({ name: '', parentId: '' });
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Kategoriyani saqlashda xatolik');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      parentId: category.parentId ? category.parentId.toString() : '' 
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kategoriyani o\'chirishni xohlaysizmi? Sub-kategoriyalar ham o\'chiriladi.')) return;
    
    try {
      await categoriesAPI.delete(id);
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Kategoriyani o\'chirishda xatolik');
    }
  };

  const openModal = (parentId = null) => {
    setEditingCategory(null);
    setFormData({ name: '', parentId: parentId ? parentId.toString() : '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', parentId: '' });
  };

  const getAllCategoriesFlat = (cats) => {
    let result = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result = result.concat(getAllCategoriesFlat(cat.children));
      }
    });
    return result;
  };

  const categoryTree = buildTree(categories);
  const allCategoriesFlat = getAllCategoriesFlat(categoryTree);

  if (loading) {
    return <div className="text-center py-8">Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kategoriyalar</h1>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>Yangi kategoriya</span>
        </button>
      </div>

      <div className="card">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Kategoriyalar mavjud emas
          </div>
        ) : (
          <div className="space-y-1">
            {renderCategoryTree(categoryTree)}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCategory ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
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
                  Ota-kategoriya (sub-kategoriya uchun)
                </label>
                <select
                  className="select"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="">Yo'q (Asosiy kategoriya)</option>
                  {allCategoriesFlat
                    .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} (ID: {category.id})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingCategory ? 'Saqlash' : 'Qo\'shish'}
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

export default Categories;
