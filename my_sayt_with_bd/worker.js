//worker.js - Cloudflare Worker с API для работы с БД

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/employees - получить всех сотрудников
    if (path === '/api/employees' && request.method === 'GET') {
      try {
        const departmentId = url.searchParams.get('department_id');
        const search = url.searchParams.get('search');
        
        let query = `
          SELECT e.*, d.name as department_name 
          FROM employees e
          LEFT JOIN departments d ON e.department_id = d.id
        `;
        const params = [];
        
        if (departmentId) {
          query += ' WHERE e.department_id = ?';
          params.push(departmentId);
        } else if (search) {
          query += ' WHERE e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?';
          const like = `%${search}%`;
          params.push(like, like, like);
        }
        
        query += ' ORDER BY e.last_name, e.first_name';
        
        const { results } = await env.DB.prepare(query).bind(...params).all();
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

    // GET /api/employees/:id - получить одного сотрудника
    if (path.match(/^\/api\/employees\/\d+$/) && request.method === 'GET') {
      const id = path.split('/').pop();
      const employee = await env.DB.prepare(
        'SELECT e.*, d.name as department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE e.id = ?'
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
    }

    // POST /api/employees - добавить сотрудника
    if (path === '/api/employees' && request.method === 'POST') {
      const body = await request.json();
      
      const result = await env.DB.prepare(
        'INSERT INTO employees (first_name, last_name, email, phone, department_id, hire_date) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        body.first_name, body.last_name, body.email, body.phone, body.department_id, body.hire_date
      ).run();
      
      return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // PUT /api/employees/:id - обновить сотрудника
    if (path.match(/^\/api\/employees\/\d+$/) && request.method === 'PUT') {
      const id = path.split('/').pop();
      const body = await request.json();
      
      await env.DB.prepare(
        'UPDATE employees SET first_name = ?, last_name = ?, email = ?, phone = ?, department_id = ?, hire_date = ? WHERE id = ?'
      ).bind(
        body.first_name, body.last_name, body.email, body.phone, body.department_id, body.hire_date, id
      ).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // DELETE /api/employees/:id - удалить сотрудника
    if (path.match(/^\/api\/employees\/\d+$/) && request.method === 'DELETE') {
      const id = path.split('/').pop();
      
      await env.DB.prepare('DELETE FROM employees WHERE id = ?').bind(id).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // GET /api/departments - получить отделы
    if (path === '/api/departments' && request.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM departments ORDER BY name').all();
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 404 для неизвестных API маршрутов
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};