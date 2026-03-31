// worker.js — упрощённая версия для отладки
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Обработка OPTIONS (CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    console.log(`📨 Request: ${request.method} ${path}`);

    // ПРОВЕРКА: просто вернуть список сотрудников (мок-данные)
    if (path === '/api/employees' && request.method === 'GET') {
      // Проверяем, есть ли доступ к D1
      if (!env.DB) {
        console.error('❌ DB binding is not available!');
        return new Response(JSON.stringify({ 
          error: 'Database not configured',
          message: 'D1 binding "DB" is missing'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      try {
        // Пытаемся получить данные из D1
        const { results } = await env.DB.prepare('SELECT * FROM employees LIMIT 10').all();
        console.log(`✅ Found ${results.length} employees`);
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('❌ Database error:', error.message);
        return new Response(JSON.stringify({ 
          error: 'Database query failed',
          details: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Получить отделы
    if (path === '/api/departments' && request.method === 'GET') {
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

    // Тестовый эндпоинт для проверки
    if (path === '/api/test' && request.method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        message: 'Worker is running',
        dbAvailable: !!env.DB
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Если ничего не подошло — отдать index.html
    if (request.method === 'GET') {
      try {
        const html = await fetch('https://my_sayt_with_bd.pages.dev/index.html');
        return html;
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
