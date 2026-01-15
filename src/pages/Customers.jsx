import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { User, Search, Trash2, ShoppingBag } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await usersAPI.getAll();
      // Faqat mijozlarni ko'rsatish (CLIENT roli)
      const clientsOnly = response.data.filter(user => user.role === 'CLIENT');
      setCustomers(clientsOnly);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Mijozlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu mijozni o\'chirishni xohlaysizmi?')) return;
    
    try {
      await usersAPI.delete(id);
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Mijozni o\'chirishda xatolik');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(search) ||
      customer.phone?.includes(search) ||
      customer.telegramId?.includes(search)
    );
  });

  if (loading) {
    return <div className="text-center py-8">Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mijozlar</h1>
            <p className="text-sm text-gray-600 mt-1">
              Botga ro'yxatdan o'tgan barcha mijozlar ro'yxati
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{customers.length}</div>
            <div className="text-sm text-gray-600">Jami mijozlar</div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center space-x-3">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            className="input flex-1"
            placeholder="Ism, telefon yoki Telegram ID bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Ma'lumot:</strong> Mijozlar bot'ga <code>/start</code> bosib, telefon raqamini ulashganda 
            avtomatik ro'yxatga qo'shiladi. Ular buyurtma berish uchun Client Bot'dan foydalanadi.
          </p>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mijoz ismi</th>
              <th>Telefon</th>
              <th>Telegram ID</th>
              <th>Buyurtmalar soni</th>
              <th>Ro'yxatdan o'tgan sana</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  {searchTerm ? (
                    <div>
                      <User size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>"{searchTerm}" bo'yicha mijoz topilmadi</p>
                    </div>
                  ) : (
                    <div>
                      <User size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>Mijozlar mavjud emas</p>
                      <p className="text-sm mt-2">Mijozlar Client Bot'ga /start bosib ro'yxatdan o'tganda bu yerda ko'rinadi</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td className="font-medium">
                    <div className="flex items-center space-x-2">
                      <User size={18} className="text-gray-400" />
                      <span>{customer.name || 'Noma\'lum'}</span>
                    </div>
                  </td>
                  <td>{customer.phone || '-'}</td>
                  <td className="font-mono text-sm">{customer.telegramId}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <ShoppingBag size={16} className="text-blue-600" />
                      <span className="font-medium text-blue-600">
                        {customer.orders?.length || 0}
                      </span>
                    </div>
                  </td>
                  <td className="text-sm text-gray-600">
                    {customer.createdAt 
                      ? new Date(customer.createdAt).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Mijozni o'chirish"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {filteredCustomers.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Ko'rsatilmoqda: {filteredCustomers.length} / {customers.length} mijoz
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;

