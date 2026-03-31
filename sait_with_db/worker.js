export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Простой тест D1
    if (url.pathname === '/api/test') {
      if (!env.DB) {
        return new Response(JSON.stringify({
          error: 'DB binding not found',
          availableBindings: Object.keys(env)
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      try {
        const { results } = await env.DB.prepare('SELECT 1 as test').all();
        return new Response(JSON.stringify({
          success: true,
          message: 'D1 is working!',
          data: results
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Главная страница
    return new Response('Worker is running! Try /api/test', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
