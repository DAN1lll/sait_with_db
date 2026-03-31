
export async function onRequest(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // Обработка preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // GET /api/employees — получить всех
  if (request.method === 'GET') {
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
  
  // POST /api/employees — добавить сотрудника
  if (request.method === 'POST') {
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
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
