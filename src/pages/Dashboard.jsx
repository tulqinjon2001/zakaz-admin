import { useEffect, useState } from 'react';
import { storesAPI, categoriesAPI, productsAPI, ordersAPI } from '../services/api';
import { Store, FolderTree, Package, ShoppingCart } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    stores: 0,
    categories: 0,
    products: 0,
    orders: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [storesRes, categoriesRes, productsRes, ordersRes] = await Promise.all([
          storesAPI.getAll(),
          categoriesAPI.getAll(),
          productsAPI.getAll(),
          ordersAPI.getAll(),
        ]);

        const orders = ordersRes.data;
        const pendingOrders = orders.filter(order => order.status === 'PENDING').length;

        setStats({
          stores: storesRes.data.length,
          categories: categoriesRes.data.length,
          products: productsRes.data.length,
          orders: orders.length,
          pendingOrders,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Do\'konlar', value: stats.stores, icon: Store, color: 'bg-blue-500' },
    { label: 'Kategoriyalar', value: stats.categories, icon: FolderTree, color: 'bg-green-500' },
    { label: 'Mahsulotlar', value: stats.products, icon: Package, color: 'bg-purple-500' },
    { label: 'Buyurtmalar', value: stats.orders, icon: ShoppingCart, color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stats.pendingOrders > 0 && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="text-yellow-600" size={24} />
            <div>
              <p className="font-semibold text-yellow-800">
                {stats.pendingOrders} ta kutilayotgan buyurtma mavjud
              </p>
              <p className="text-sm text-yellow-700">
                Buyurtmalar sahifasiga o'tib, statusni yangilang
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
