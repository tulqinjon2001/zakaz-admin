import { useState, useEffect } from "react";
import { usersAPI } from "../services/api";
import { Plus, Edit, Trash2, X } from "lucide-react";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    telegramId: "",
    role: "ORDER_RECEIVER", // Default role for employees (not CLIENT)
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await usersAPI.getAll();
      // Faqat xodimlarni ko'rsatish (mijozlarsiz)
      const staffOnly = response.data.filter((user) => user.role !== "CLIENT");
      setEmployees(staffOnly);
    } catch (error) {
      console.error("Error fetching employees:", error);
      alert("Xodimlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.name.trim()) {
      alert("Ismni kiriting");
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      alert("Telefon raqamni kiriting");
      return;
    }

    try {
      if (editingEmployee) {
        // Tahrirlash
        // Normalize phone: remove spaces, ensure + prefix
        const normalizedPhone = formData.phone
          .trim()
          .replace(/\s/g, "")
          .replace(/^\+?/, "+");
        
        const updateData = {
          name: formData.name.trim(),
          phone: normalizedPhone,
          role: formData.role,
        };

        // Add telegramId if provided
        if (formData.telegramId && formData.telegramId.trim()) {
          updateData.telegramId = formData.telegramId.trim();
        }
        
        await usersAPI.update(editingEmployee.id, updateData);
      } else {
        // Yangi qo'shish - create user with placeholder telegramId
        // When user starts the bot and shares phone, it will be matched and updated
        
        // Normalize phone: remove spaces, ensure + prefix
        const normalizedPhone = formData.phone
          .trim()
          .replace(/\s/g, "")
          .replace(/^\+?/, "+");
        
        const phoneDigitsOnly = normalizedPhone.replace(/[^0-9]/g, "");
        const placeholderTelegramId = `phone_${phoneDigitsOnly}`;

        // Check if user with this phone already exists (check multiple formats)
        const allUsersResponse = await usersAPI.getAll();
        const existingUser = allUsersResponse.data.find(
          (u) => {
            if (!u.phone) return false;
            const userPhone = u.phone.replace(/\s/g, "").replace(/^\+?/, "+");
            return userPhone === normalizedPhone || 
                   u.phone.replace(/[^0-9]/g, "") === phoneDigitsOnly;
          }
        );

        if (existingUser) {
          // Update existing user's role and name
          await usersAPI.update(existingUser.id, {
            name: formData.name.trim(),
            phone: normalizedPhone, // Save normalized phone
            role: formData.role,
          });
        } else {
          // Create new user
          // Use manually entered telegramId if provided, otherwise use placeholder
          const telegramIdToUse = formData.telegramId?.trim() || placeholderTelegramId;
          
          await usersAPI.create({
            name: formData.name.trim(),
            phone: normalizedPhone, // Save normalized phone
            telegramId: telegramIdToUse,
            role: formData.role,
          });
        }
      }

      await fetchEmployees();
      setShowModal(false);
      resetForm();
      alert("Xodim muvaffaqiyatli saqlandi!");
    } catch (error) {
      console.error("Error saving employee:", error);
      if (error.response?.data?.error?.includes("already exists")) {
        // User with this phone already exists, try to update
        try {
          const response = await usersAPI.getAll();
          const existingUser = response.data.find(
            (u) => u.phone === formData.phone.trim()
          );

          if (existingUser) {
            await usersAPI.update(existingUser.id, {
              name: formData.name.trim(),
              role: formData.role,
            });
            await fetchEmployees();
            setShowModal(false);
            resetForm();
            alert("Xodim muvaffaqiyatli yangilandi!");
            return;
          }
        } catch (updateError) {
          console.error("Error updating existing user:", updateError);
        }
      }
      alert(error.response?.data?.error || "Xodimni saqlashda xatolik");
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || "",
      phone: employee.phone || "",
      telegramId: employee.telegramId || "",
      role: employee.role || "ORDER_RECEIVER", // Default role for employees (not CLIENT)
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu xodimni o'chirishni xohlaysizmi?")) return;

    try {
      const response = await usersAPI.delete(id);
      await fetchEmployees();
      
      // Show success message from backend (may include info about cascade deleted orders)
      const successMessage = response.data?.message || "Xodim muvaffaqiyatli o'chirildi!";
      alert(successMessage);
    } catch (error) {
      console.error("Error deleting employee:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Show detailed error message from backend
      const errorData = error.response?.data || {};
      const errorMessage = errorData.error || "Xodimni o'chirishda xatolik";
      
      if (error.response?.status === 404) {
        alert("❌ Xodim topilmadi. Ro'yxat yangilanmoqda...");
        await fetchEmployees();
      } else {
        alert(`❌ Xatolik: ${errorMessage}`);
      }
    }
  };

  const openModal = () => {
    setEditingEmployee(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      telegramId: "",
      role: "ORDER_RECEIVER", // Default role for employees (not CLIENT)
    });
  };

  const getRoleLabel = (role) => {
    const labels = {
      CLIENT: "Mijoz",
      ADMIN: "Administrator",
      ORDER_RECEIVER: "Buyurtma qabul qiluvchi",
      ORDER_PICKER: "Buyurtma yig'uvchi",
      COURIER: "Dostavkachi",
    };
    return labels[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      CLIENT: "bg-gray-100 text-gray-800",
      ADMIN: "bg-red-100 text-red-800",
      ORDER_RECEIVER: "bg-blue-100 text-blue-800",
      ORDER_PICKER: "bg-purple-100 text-purple-800",
      COURIER: "bg-green-100 text-green-800",
    };
    return classes[role] || "bg-gray-100 text-gray-800";
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
          <p className="text-sm text-gray-600 mt-1">
            Tizim xodimlari (mijozlarsiz)
          </p>
        </div>
        <button
          onClick={openModal}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Yangi xodim</span>
        </button>
      </div>

      <div className="card">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Ma'lumot:</strong> Bu ro'yxatda faqat{" "}
            <strong>xodimlar</strong> ko'rsatiladi (Admin, Qabul qiluvchi,
            Yig'uvchi, Kuryer).
            <strong>Mijozlar</strong> (CLIENT) bu ro'yxatda ko'rinmaydi - ular
            alohida "Mijozlar" bo'limida ko'rinadi.
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
                  Xodimlar mavjud emas. Telefon raqam orqali qidirib, xodim
                  rolini belgilang.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td className="font-medium">{employee.name || "Noma'lum"}</td>
                  <td>{employee.phone || "-"}</td>
                  <td className="font-mono text-sm">{employee.telegramId}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(
                        employee.role
                      )}`}
                    >
                      {getRoleLabel(employee.role)}
                    </span>
                  </td>
                  <td>{employee.orders?.length || 0}</td>
                  <td className="text-sm text-gray-600">
                    {employee.createdAt
                      ? new Date(employee.createdAt).toLocaleDateString("uz-UZ")
                      : "-"}
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
                {editingEmployee ? "Xodimni tahrirlash" : "Yangi xodim"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ism *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Xodim ismini kiriting"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon raqami *
                  </label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+998 90 123 45 67"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Foydalanuvchi bot'ga /start bosib, telefon raqamini
                    ulashganda avtomatik tizimga ulanadi.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram ID
                  </label>
                  <input
                    type="text"
                    className="input font-mono text-sm"
                    value={formData.telegramId}
                    onChange={(e) =>
                      setFormData({ ...formData, telegramId: e.target.value })
                    }
                    placeholder="phone_998901234567 yoki 123456789"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Telegram foydalanuvchi ID'si. Bo'sh qoldirilsa, telefon raqamidan avtomatik yaratiladi.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol *
                  </label>
                  <select
                    className="select"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="ADMIN">Administrator</option>
                    <option value="ORDER_RECEIVER">
                      Buyurtma qabul qiluvchi (Operator)
                    </option>
                    <option value="ORDER_PICKER">Buyurtma yig'uvchi</option>
                    <option value="COURIER">Dostavkachi</option>
                  </select>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">
                      <strong>Administrator:</strong> Barcha jarayonlar haqida
                      xabar oladi
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Buyurtma qabul qiluvchi:</strong> Yangi
                      buyurtmalarni qabul qiladi/bekor qiladi
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Buyurtma yig'uvchi:</strong> Buyurtmalarni yig'ish
                      jarayonini boshqaradi
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Dostavkachi:</strong> Buyurtmalarni yetkazib
                      beradi
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary flex-1"
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingEmployee ? "Saqlash" : "Qo'shish"}
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
