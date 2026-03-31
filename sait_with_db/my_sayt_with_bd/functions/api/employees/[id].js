
export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // GET /api/employees/:id — получить одного
  if (request.method === 'GET') {
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
  
  // PUT /api/employees/:id — обновить
  if (request.method === 'PUT') {
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
  
  // DELETE /api/employees/:id — удалить
  if (request.method === 'DELETE') {
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
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
