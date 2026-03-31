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
    
    // ========== API ENDPOINTS ==========
    
    // Тестовый эндпоинт
    if (path === '/api/test') {
      // Проверяем, есть ли D1 биндинг
      if (!env.DB) {
        return new Response(JSON.stringify({
          success: false,
          error: 'D1 binding "DB" not configured',
          availableBindings: Object.keys(env)
        }), {
          status: 200,  // 200, чтобы увидеть ошибку в браузере
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      try {
        const { results } = await env.DB.prepare('SELECT 1 as test').all();
        return new Response(JSON.stringify({
          success: true,
          message: 'D1 database binding works!',
          test: results
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // GET /api/departments
    if (path === '/api/departments') {
      if (!env.DB) {
        return new Response(JSON.stringify({ error: 'DB binding not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      try {
        const { results } = await env.DB.prepare('SELECT * FROM departments').all();
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
      if (!env.DB) {
        return new Response(JSON.stringify({ error: 'DB binding not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
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
    
    // ========== СТАТИКА ==========
    // Если не API — отдаём index.html из папки sait_with_db
    try {
      // Пытаемся получить файл из assets
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        return asset;
      }
    } catch (e) {
      // Если нет ASSETS, просто возвращаем текст
    }
    
    return new Response('API is ready! Use /api/test, /api/departments, /api/employees', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
