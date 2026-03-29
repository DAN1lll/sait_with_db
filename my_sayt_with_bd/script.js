// script.js — фронтенд логика

const API_URL = window.location.origin; // Worker обрабатывает /api/*

let departments = [];

// Загрузка отделов
async function loadDepartments() {
  const response = await fetch('/api/departments');
  departments = await response.json();
  
  const filterSelect = document.getElementById('departmentFilter');
  const formSelect = document.getElementById('departmentId');
  
  const options = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  
  filterSelect.innerHTML = '<option value="">Все отделы</option>' + options;
  formSelect.innerHTML = options;
}

// Загрузка сотрудников
async function loadEmployees() {
  const search = document.getElementById('searchInput').value;
  const departmentId = document.getElementById('departmentFilter').value;
  
  let url = '/api/employees';
  const params = [];
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (departmentId) params.push(`department_id=${departmentId}`);
  if (params.length) url += '?' + params.join('&');
  
  const response = await fetch(url);
  const employees = await response.json();
  
  renderEmployees(employees);
}

// Рендер таблицы
function renderEmployees(employees) {
  const tbody = document.getElementById('employeesBody');
  
  if (employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Нет данных</td></tr>';
    return;
  }
  
  tbody.innerHTML = employees.map(emp => {
    const initials = `${emp.first_name?.charAt(0) || ''}${emp.last_name?.charAt(0) || ''}`;
    const avatarHtml = emp.avatar 
      ? `<img src="${emp.avatar}" class="avatar-img">`
      : `<div class="avatar">${initials || '?'}</div>`;
    
    return `
      <tr data-id="${emp.id}">
        <td>${emp.id}</td>
        <td>${avatarHtml}</td>
        <td>${emp.last_name} ${emp.first_name}</td>
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
  
  const url = id ? `/api/employees/${id}` : '/api/employees';
  const method = id ? 'PUT' : 'POST';
  
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee)
  });
  
  if (response.ok) {
    closeModal();
    loadEmployees();
  } else {
    alert('Ошибка при сохранении');
  }
}

// Редактирование сотрудника
async function editEmployee(id) {
  const response = await fetch(`/api/employees/${id}`);
  const employee = await response.json();
  
  document.getElementById('modalTitle').textContent = 'Редактировать сотрудника';
  document.getElementById('employeeId').value = employee.id;
  document.getElementById('firstName').value = employee.first_name;
  document.getElementById('lastName').value = employee.last_name;
  document.getElementById('email').value = employee.email || '';
  document.getElementById('phone').value = employee.phone || '';
  document.getElementById('departmentId').value = employee.department_id || '';
  document.getElementById('hireDate').value = employee.hire_date || '';
  
  document.getElementById('employeeModal').classList.add('show');
}

// Удаление сотрудника
async function deleteEmployee(id) {
  if (confirm('Удалить сотрудника?')) {
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    loadEmployees();
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
  await loadDepartments();
  await loadEmployees();
  
  document.getElementById('searchInput').addEventListener('input', onSearch);
  document.getElementById('departmentFilter').addEventListener('change', () => loadEmployees());
  document.getElementById('addEmployeeBtn').addEventListener('click', openAddModal);
  document.getElementById('employeeForm').addEventListener('submit', saveEmployee);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.querySelector('.close').addEventListener('click', closeModal);
});