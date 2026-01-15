import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { Plus, Edit, Trash2, X, User, Search } from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    telegramId: '',
    role: 'CLIENT',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await usersAPI.getAll();
      // Faqat xodimlarni ko'rsatish (mijozlarsiz)
      const staffOnly = response.data.filter(user => user.role !== 'CLIENT');
      setEmployees(staffOnly);
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Xodimlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPhone = async () => {
    if (!searchPhone || searchPhone.length < 5) {
      alert('Telefon raqamni to\'liq kiriting');
      return;
    }

    try {
      // Search users by phone
      const response = await usersAPI.getAll();
      const results = response.data.filter(user => 
        user.phone && user.phone.includes(searchPhone)
      );

      if (results.length === 0) {
        alert('Bu telefon raqam bilan foydalanuvchi topilmadi.\n\nFoydalanuvchi bot\'ga /start bosishi va telefon raqamini ulashishi kerak.');
        return;
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      alert('Qidiruvda xatolik');
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      telegramId: user.telegramId,
      role: user.role || 'CLIENT',
    });
    setSearchResults([]);
    setSearchPhone(''); // Clear search input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEmployee) {
        // Tahrirlash
        await usersAPI.update(editingEmployee.id, {
          name: formData.name,
          phone: formData.phone,
          telegramId: formData.telegramId,
          role: formData.role,
        });
      } else {
        // Yangi qo'shish
        if (!selectedUser) {
          alert('Avval telefon raqam orqali foydalanuvchini toping');
          return;
        }
        
        // Update user's role
        await usersAPI.update(selectedUser.id, {
          role: formData.role,
        });
        
        console.log('User role updated:', selectedUser.id, formData.role);
      }
      
      await fetchEmployees();
      setShowModal(false);
      resetForm();
      alert('Xodim muvaffaqiyatli saqlandi!');
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(error.response?.data?.error || 'Xodimni saqlashda xatolik');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || '',
      phone: employee.phone || '',
      telegramId: employee.telegramId || '',
      role: employee.role || 'CLIENT',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu xodimni o\'chirishni xohlaysizmi?')) return;
    
    try {
      await usersAPI.delete(id);
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Xodimni o\'chirishda xatolik');
    }
  };

  const openModal = () => {
    setEditingEmployee(null);
    setSelectedUser(null);
    setSearchPhone('');
    setSearchResults([]);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      telegramId: '',
      role: 'CLIENT',
    });
    setSearchPhone('');
    setSearchResults([]);
    setSelectedUser(null);
  };

  const getRoleLabel = (role) => {
    const labels = {
      'CLIENT': 'Mijoz',
      'ADMIN': 'Administrator',
      'ORDER_RECEIVER': 'Buyurtma qabul qiluvchi',
      'ORDER_PICKER': 'Buyurtma yig\'uvchi',
      'COURIER': 'Dostavkachi',
    };
    return labels[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      'CLIENT': 'bg-gray-100 text-gray-800',
      'ADMIN': 'bg-red-100 text-red-800',
      'ORDER_RECEIVER': 'bg-blue-100 text-blue-800',
      'ORDER_PICKER': 'bg-purple-100 text-purple-800',
      'COURIER': 'bg-green-100 text-green-800',
    };
    return classes[role] || 'bg-gray-100 text-gray-800';
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    resetForm();
  };

  if (loading) {
    return <div className="text-center py-8">Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Xodimlar</h1>
          <p className="text-sm text-gray-600 mt-1">Tizim xodimlari (mijozlarsiz)</p>
        </div>
        <button onClick={openModal} className="btn btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>Yangi xodim</span>
        </button>
      </div>

      <div className="card">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Ma'lumot:</strong> Bu ro'yxatda faqat <strong>xodimlar</strong> ko'rsatiladi (Admin, Qabul qiluvchi, Yig'uvchi, Kuryer). 
            <strong>Mijozlar</strong> (CLIENT) bu ro'yxatda ko'rinmaydi - ular alohida "Mijozlar" bo'limida ko'rinadi.
          </p>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ism</th>
              <th>Telefon</th>
              <th>Telegram ID</th>
              <th>Rol</th>
              <th>Buyurtmalar soni</th>
              <th>Ro'yxatdan o'tgan sana</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  Xodimlar mavjud emas. Telefon raqam orqali qidirib, xodim rolini belgilang.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td className="font-medium">{employee.name || 'Noma\'lum'}</td>
                  <td>{employee.phone || '-'}</td>
                  <td className="font-mono text-sm">{employee.telegramId}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(employee.role)}`}>
                      {getRoleLabel(employee.role)}
                    </span>
                  </td>
                  <td>{employee.orders?.length || 0}</td>
                  <td className="text-sm text-gray-600">
                    {employee.createdAt 
                      ? new Date(employee.createdAt).toLocaleDateString('uz-UZ')
                      : '-'}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
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
                {editingEmployee ? 'Xodimni tahrirlash' : 'Yangi xodim'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                {!editingEmployee && !selectedUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foydalanuvchini qidirish
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="tel"
                        className="input flex-1"
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                      />
                      <button
                        type="button"
                        onClick={handleSearchPhone}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        <Search size={18} />
                        <span>Qidirish</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Foydalanuvchi bot'ga /start bosib, telefon raqamini ulashgan bo'lishi kerak.
                    </p>
                    
                    {searchResults.length > 0 && (
                      <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-700">
                            {searchResults.length} ta foydalanuvchi topildi:
                          </p>
                        </div>
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.phone}</div>
                            <div className="text-xs text-gray-400">Telegram ID: {user.telegramId}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(selectedUser || editingEmployee) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ism
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Xodim ismini kiriting"
                        readOnly={!editingEmployee}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon raqami
                      </label>
                      <input
                        type="tel"
                        className="input bg-gray-50"
                        value={formData.phone}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telegram ID
                      </label>
                      <input
                        type="text"
                        className="input bg-gray-50 font-mono"
                        value={formData.telegramId}
                        readOnly
                      />
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Telegram ID avtomatik aniqlandi
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol *
                      </label>
                      <select
                        className="select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        <option value="ADMIN">Administrator</option>
                        <option value="ORDER_RECEIVER">Buyurtma qabul qiluvchi</option>
                        <option value="ORDER_PICKER">Buyurtma yig'uvchi</option>
                        <option value="COURIER">Dostavkachi</option>
                      </select>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600">
                          <strong>Administrator:</strong> Barcha jarayonlar haqida xabar oladi
                        </p>
                        <p className="text-xs text-gray-600">
                          <strong>Buyurtma qabul qiluvchi:</strong> Yangi buyurtmalarni qabul qiladi/bekor qiladi
                        </p>
                        <p className="text-xs text-gray-600">
                          <strong>Buyurtma yig'uvchi:</strong> Buyurtmalarni yig'ish jarayonini boshqaradi
                        </p>
                        <p className="text-xs text-gray-600">
                          <strong>Dostavkachi:</strong> Buyurtmalarni yetkazib beradi
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingEmployee ? 'Saqlash' : 'Qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

