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
    
    // Проверка D1 биндинга
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'D1 binding "DB" not configured',
        fix: 'Add [[d1_databases]] to wrangler.toml'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // ========== API ENDPOINTS ==========
    
    // GET /api/test — проверка D1
    if (path === '/api/test') {
      try {
        const { results } = await env.DB.prepare('SELECT 1 as test').all();
        return new Response(JSON.stringify({
          success: true,
          message: 'D1 database is working!',
          test: results
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
    if (path === '/api/departments') {
      try {
        const { results } = await env.DB.prepare(
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
    if (path === '/api/employees') {
      try {
        const { results } = await env.DB.prepare(
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
    
    // GET /api/employees/:id
    const idMatch = path.match(/^\/api\/employees\/(\d+)$/);
    if (idMatch && request.method === 'GET') {
      const id = idMatch[1];
      try {
        const employee = await env.DB.prepare(
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
    
    // POST /api/employees
    if (path === '/api/employees' && request.method === 'POST') {
      try {
        const body = await request.json();
        const result = await env.DB.prepare(
          `INSERT INTO employees (first_name, last_name, email, phone, department_id, hire_date) 
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          body.first_name, body.last_name, body.email, body.phone, 
          body.department_id, body.hire_date
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
    
    // PUT /api/employees/:id
    if (idMatch && request.method === 'PUT') {
      const id = idMatch[1];
      try {
        const body = await request.json();
        await env.DB.prepare(
          `UPDATE employees 
           SET first_name = ?, last_name = ?, email = ?, phone = ?, department_id = ?, hire_date = ? 
           WHERE id = ?`
        ).bind(
          body.first_name, body.last_name, body.email, body.phone, 
          body.department_id, body.hire_date, id
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
        await env.DB.prepare('DELETE FROM employees WHERE id = ?').bind(id).run();
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
    
    // ========== СТАТИКА ==========
    // Все остальные запросы — отдаём статику через Assets
    return env.ASSETS.fetch(request);
  }
};
