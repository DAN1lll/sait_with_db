export default {
  async fetch(request, env) {
    if (!env.BD) {
      return new Response(JSON.stringify({ error: 'Database not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const result = await env.BD.prepare(
        "SELECT * FROM employees LIMIT 10"
      ).all();
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
