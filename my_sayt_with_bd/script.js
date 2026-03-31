// script.js — фронтенд логика

// API URL — используем относительный путь к Pages Functions
// Если у вас есть отдельный Worker, замените на его адрес:
// const API_URL = 'https://staff-api.ваш-аккаунт.workers.dev';
const API_URL = '';  // Пустая строка = используем тот же хост

let departments = [];

// Загрузка отделов
async function loadDepartments() {
  try {
    console.log('🔄 Загрузка отделов...');
    const response = await fetch(`${API_URL}/api/departments`);
    
    console.log('📡 Статус ответа:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log('📦 Получен текст:', text.substring(0, 200));
    
    if (!text || text.trim() === '') {
      throw new Error('Пустой ответ от сервера');
    }
    
    departments = JSON.parse(text);
    console.log('✅ Загружено отделов:', departments.length);
    
    const filterSelect = document.getElementById('departmentFilter');
    const formSelect = document.getElementById('departmentId');
    
    if (filterSelect && formSelect) {
      const options = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
      filterSelect.innerHTML = '<option value="">Все отделы</option>' + options;
      formSelect.innerHTML = options;
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки отделов:', error);
    document.getElementById('employeesBody').innerHTML = 
      `<tr><td colspan="8" class="loading">Ошибка: ${error.message}<br>
      Проверьте, что API доступен: ${API_URL || ''}/api/departments</td></tr>`;
  }
}

// Загрузка сотрудников
async function loadEmployees() {
  const search = document.getElementById('searchInput')?.value || '';
  const departmentId = document.getElementById('departmentFilter')?.value || '';
  
  let url = `${API_URL}/api/employees`;
  const params = [];
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (departmentId) params.push(`department_id=${departmentId}`);
  if (params.length) url += '?' + params.join('&');
  
  try {
    console.log('🔄 Загрузка сотрудников:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Пустой ответ');
    }
    
    const employees = JSON.parse(text);
    console.log('✅ Загружено сотрудников:', employees.length);
    renderEmployees(employees);
  } catch (error) {
    console.error('❌ Ошибка загрузки сотрудников:', error);
    document.getElementById('employeesBody').innerHTML = 
      `<tr><td colspan="8" class="loading">Ошибка: ${error.message}</td></tr>`;
  }
}

// Рендер таблицы
function renderEmployees(employees) {
  const tbody = document.getElementById('employeesBody');
  
  if (!employees || employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Нет данных</td></tr>';
    return;
  }
  
  tbody.innerHTML = employees.map(emp => {
    const initials = `${emp.first_name?.charAt(0) || ''}${emp.last_name?.charAt(0) || ''}`;
    const avatarHtml = `<div class="avatar">${initials || '?'}</div>`;
    
    return `
      <tr data-id="${emp.id}">
        <td>${emp.id}</td>
        <td>${avatarHtml}</td>
        <td>${emp.last_name || ''} ${emp.first_name || ''}</td>
        <td>${emp.email || '-'}</td>
        <td>${emp.phone || '-'}</td>
        <td>${emp.department_name || '-'}</td>
        <td>${emp.hire_date || '-'}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit" onclick="editEmployee(${emp.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" onclick="deleteEmployee(${emp.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Добавление/редактирование сотрудника
async function saveEmployee(event) {
  event.preventDefault();
  
  const id = document.getElementById('employeeId').value;
  const employee = {
    first_name: document.getElementById('firstName').value,
    last_name: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    department_id: document.getElementById('departmentId').value,
    hire_date: document.getElementById('hireDate').value
  };
  
  const url = id ? `${API_URL}/api/employees/${id}` : `${API_URL}/api/employees`;
  const method = id ? 'PUT' : 'POST';
  
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee)
    });
    
    if (response.ok) {
      closeModal();
      loadEmployees();
    } else {
      const error = await response.text();
      alert('Ошибка при сохранении: ' + error);
    }
  } catch (error) {
    alert('Ошибка сети: ' + error.message);
  }
}

// Редактирование сотрудника
async function editEmployee(id) {
  try {
    const response = await fetch(`${API_URL}/api/employees/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const employee = await response.json();
    
    document.getElementById('modalTitle').textContent = 'Редактировать сотрудника';
    document.getElementById('employeeId').value = employee.id;
    document.getElementById('firstName').value = employee.first_name || '';
    document.getElementById('lastName').value = employee.last_name || '';
    document.getElementById('email').value = employee.email || '';
    document.getElementById('phone').value = employee.phone || '';
    document.getElementById('departmentId').value = employee.department_id || '';
    document.getElementById('hireDate').value = employee.hire_date || '';
    
    document.getElementById('employeeModal').classList.add('show');
  } catch (error) {
    alert('Ошибка загрузки сотрудника: ' + error.message);
  }
}

// Удаление сотрудника
async function deleteEmployee(id) {
  if (confirm('Удалить сотрудника?')) {
    try {
      const response = await fetch(`${API_URL}/api/employees/${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadEmployees();
      } else {
        alert('Ошибка при удалении');
      }
    } catch (error) {
      alert('Ошибка сети: ' + error.message);
    }
  }
}

// Модальное окно
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Добавить сотрудника';
  document.getElementById('employeeForm').reset();
  document.getElementById('employeeId').value = '';
  document.getElementById('employeeModal').classList.add('show');
}

function closeModal() {
  document.getElementById('employeeModal').classList.remove('show');
}

// Debounce для поиска
let searchTimeout;
function onSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadEmployees(), 300);
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Страница загружена, инициализация...');
  await loadDepartments();
  await loadEmployees();
  
  document.getElementById('searchInput')?.addEventListener('input', onSearch);
  document.getElementById('departmentFilter')?.addEventListener('change', () => loadEmployees());
  document.getElementById('addEmployeeBtn')?.addEventListener('click', openAddModal);
  document.getElementById('employeeForm')?.addEventListener('submit', saveEmployee);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.querySelector('.close')?.addEventListener('click', closeModal);
});
