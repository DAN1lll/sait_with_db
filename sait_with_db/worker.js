export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // ========== API ENDPOINTS ==========
    
    // Проверка KV
    if (path === '/api/test') {
      if (!env.STAFF_KV) {
        return new Response(JSON.stringify({
          success: false,
          error: 'KV binding not configured',
          availableBindings: Object.keys(env)
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      const data = await loadData(env);
      return new Response(JSON.stringify({
        success: true,
        message: 'KV is working!',
        kvExists: true,
        departmentsCount: data.departments.length,
        employeesCount: data.employees.length
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // GET /api/departments
    if (path === '/api/departments') {
      const data = await loadData(env);
      return new Response(JSON.stringify(data.departments), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // GET /api/employees
    if (path === '/api/employees') {
      const data = await loadData(env);
      const employeesWithDept = data.employees.map(emp => ({
        ...emp,
        department_name: data.departments.find(d => d.id === emp.department_id)?.name || ''
      }));
      return new Response(JSON.stringify(employeesWithDept), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // POST /api/employees
    if (path === '/api/employees' && request.method === 'POST') {
      try {
        const data = await loadData(env);
        const body = await request.json();
        const newId = data.nextId;
        const newEmployee = { id: newId, ...body };
        data.employees.push(newEmployee);
        data.nextId = newId + 1;
        await saveData(env, data);
        
        return new Response(JSON.stringify({ success: true, id: newId }), {
          status: 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // DELETE /api/employees/:id
    const idMatch = path.match(/^\/api\/employees\/(\d+)$/);
    if (idMatch && request.method === 'DELETE') {
      try {
        const id = parseInt(idMatch[1]);
        const data = await loadData(env);
        data.employees = data.employees.filter(e => e.id !== id);
        await saveData(env, data);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // PUT /api/employees/:id
    if (idMatch && request.method === 'PUT') {
      try {
        const id = parseInt(idMatch[1]);
        const data = await loadData(env);
        const body = await request.json();
        const index = data.employees.findIndex(e => e.id === id);
        if (index !== -1) {
          data.employees[index] = { ...data.employees[index], ...body };
          await saveData(env, data);
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        return new Response(JSON.stringify({ error: 'Employee not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // ========== СТАТИКА ==========
    // Для всех остальных запросов — отдаём статику через ASSETS
    return env.ASSETS.fetch(request);
  }
};

// Функции работы с KV
async function loadData(env) {
  let data = await env.STAFF_KV.get('data', 'json');
  if (!data) {
    // Инициализация тестовыми данными
    data = {
      departments: [
        { id: 1, name: 'Разработка' },
        { id: 2, name: 'Дизайн' },
        { id: 3, name: 'Маркетинг' }
      ],
      employees: [
        { id: 1, first_name: 'Иван', last_name: 'Петров', email: 'ivan@company.com', phone: '+7 (999) 123-45-67', department_id: 1, hire_date: '2023-01-15' },
        { id: 2, first_name: 'Мария', last_name: 'Сидорова', email: 'maria@company.com', phone: '+7 (999) 234-56-78', department_id: 2, hire_date: '2023-02-20' },
        { id: 3, first_name: 'Алексей', last_name: 'Иванов', email: 'alex@company.com', phone: '+7 (999) 345-67-89', department_id: 1, hire_date: '2023-03-10' }
      ],
      nextId: 4
    };
    await env.STAFF_KV.put('data', JSON.stringify(data));
  }
  return data;
}

async function saveData(env, data) {
  await env.STAFF_KV.put('data', JSON.stringify(data));
}
