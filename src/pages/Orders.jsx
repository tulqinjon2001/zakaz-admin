import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await ordersAPI.getAll(params);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Buyurtmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Buyurtma statusini yangilashda xatolik');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      PENDING: 'badge badge-pending',
      ACCEPTED: 'badge badge-accepted',
      PREPARING: 'badge badge-preparing',
      READY_FOR_DELIVERY: 'badge bg-indigo-100 text-indigo-800',
      SHIPPING: 'badge badge-shipped',
      COMPLETED: 'badge badge-completed',
      CANCELLED: 'badge bg-red-100 text-red-800',
    };
    return classes[status] || 'badge bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Kutilmoqda',
      ACCEPTED: 'Qabul qilindi',
      READY_FOR_DELIVERY: 'Dostavka uchun tayyor',
      CANCELLED: 'Bekor qilindi',
      PREPARING: 'Tayyorlanmoqda',
      SHIPPED: 'Yuborildi',
      COMPLETED: 'Tugallandi',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusOptions = [
    { value: '', label: 'Barchasi' },
    { value: 'PENDING', label: 'Kutilmoqda' },
    { value: 'ACCEPTED', label: 'Qabul qilindi' },
    { value: 'PREPARING', label: 'Yig\'ilmoqda' },
    { value: 'READY_FOR_DELIVERY', label: 'Dostavka uchun tayyor' },
    { value: 'SHIPPING', label: 'Yo\'lda' },
    { value: 'COMPLETED', label: 'Tugallandi' },
    { value: 'CANCELLED', label: 'Bekor qilindi' },
  ];

  if (loading) {
    return <div className="text-center py-8">Yuklanmoqda...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Buyurtmalar</h1>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            className="select w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Foydalanuvchi</th>
              <th>Do'kon</th>
              <th>Jami narx</th>
              <th>Status</th>
              <th>Sana</th>
              <th>Statusni o'zgartirish</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  Buyurtmalar mavjud emas
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium">#{order.id}</td>
                  <td>
                    <div>
                      <div className="font-medium">{order.user?.name || 'Noma\'lum'}</div>
                      <div className="text-sm text-gray-500">{order.user?.phone || ''}</div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="font-medium">{order.store?.name}</div>
                      <div className="text-sm text-gray-500">{order.store?.address}</div>
                    </div>
                  </td>
                  <td className="font-medium">
                    {order.totalPrice?.toLocaleString('uz-UZ')} {order.items?.[0]?.currency || ''}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(order.status)}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td>
                    <select
                      className="select text-sm"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="PENDING">Kutilmoqda</option>
                      <option value="ACCEPTED">Qabul qilindi</option>
                      <option value="PREPARING">Yig'ilmoqda</option>
                      <option value="READY_FOR_DELIVERY">Dostavka uchun tayyor</option>
                      <option value="SHIPPING">Yo'lda</option>
                      <option value="COMPLETED">Tugallandi</option>
                      <option value="CANCELLED">Bekor qilindi</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal (optional - can be added later) */}
      {orders.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Jami: {orders.length} ta buyurtma
        </div>
      )}
    </div>
  );
};

export default Orders;
