export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS для фронтенда
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Проверка биндинга
    if (!env.BD) {
      return new Response(JSON.stringify({ 
        error: 'Database binding "BD" not configured',
        message: 'Please add D1 binding to this Worker'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // GET /api/test — диагностика
    if (path === '/api/test') {
      try {
        const { results } = await env.BD.prepare('SELECT 1 as test').all();
        return new Response(JSON.stringify({
          status: 'ok',
          bindingExists: true,
          queryResult: results
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // GET /api/departments
    if (path === '/api/departments' && request.method === 'GET') {
      try {
        const { results } = await env.BD.prepare(
          'SELECT * FROM departments ORDER BY name'
        ).all();
        
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // GET /api/employees
    if (path === '/api/employees' && request.method === 'GET') {
      try {
        const { results } = await env.BD.prepare(
          `SELECT e.*, d.name as department_name 
           FROM employees e 
           LEFT JOIN departments d ON e.department_id = d.id 
           ORDER BY e.last_name`
        ).all();
        
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // POST /api/employees
    if (path === '/api/employees' && request.method === 'POST') {
      try {
        const body = await request.json();
        
        const result = await env.BD.prepare(
          `INSERT INTO employees (first_name, last_name, email, phone, department_id, hire_date) 
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          body.first_name, 
          body.last_name, 
          body.email, 
          body.phone, 
          body.department_id, 
          body.hire_date
        ).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          id: result.meta.last_row_id 
        }), {
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
    
    // GET /api/employees/:id
    const idMatch = path.match(/^\/api\/employees\/(\d+)$/);
    if (idMatch && request.method === 'GET') {
      const id = idMatch[1];
      try {
        const employee = await env.BD.prepare(
          `SELECT e.*, d.name as department_name 
           FROM employees e 
           LEFT JOIN departments d ON e.department_id = d.id 
           WHERE e.id = ?`
        ).bind(id).first();
        
        if (!employee) {
          return new Response(JSON.stringify({ error: 'Employee not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        return new Response(JSON.stringify(employee), {
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
      const id = idMatch[1];
      try {
        const body = await request.json();
        
        await env.BD.prepare(
          `UPDATE employees 
           SET first_name = ?, last_name = ?, email = ?, phone = ?, department_id = ?, hire_date = ? 
           WHERE id = ?`
        ).bind(
          body.first_name, 
          body.last_name, 
          body.email, 
          body.phone, 
          body.department_id, 
          body.hire_date,
          id
        ).run();
        
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
    
    // DELETE /api/employees/:id
    if (idMatch && request.method === 'DELETE') {
      const id = idMatch[1];
      try {
        await env.BD.prepare('DELETE FROM employees WHERE id = ?').bind(id).run();
        
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
    
    // Отдаём статический фронтенд
    if (request.method === 'GET') {
      try {
        // Пробуем отдать index.html из assets
        return new Response(await getAsset('index.html'), {
          headers: { 'Content-Type': 'text/html' }
        });
      } catch {
        return new Response('Hello from Worker!', { 
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

// Функция для получения статических файлов
async function getAsset(path) {
  const url = `https://demo-proj.block-cot.workers.dev/${path}`;
  const response = await fetch(url);
  return response.text();
}
