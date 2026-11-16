import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const fallbackNext = req.nextUrl.searchParams.get('next') || '/';
  const safeNext = fallbackNext.startsWith('/') ? fallbackNext : '/';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FocusLearn — Autenticação Google</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #0f172a;
        color: #f8fafc;
        text-align: center;
        padding: 24px;
      }
      .card {
        max-width: 380px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 28px 24px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 700;
      }
      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: #cbd5e1;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Concluindo login com Google...</h1>
      <p id="status">Você pode fechar esta janela caso ela não feche automaticamente.</p>
    </div>
    <script>
      (function () {
        var payload = {
          type: 'SUPABASE_OAUTH_CALLBACK',
          search: window.location.search || '',
          hash: window.location.hash || ''
        };

        try {
          if (typeof BroadcastChannel !== 'undefined') {
            var bc = new BroadcastChannel('focuslearn_oauth');
            bc.postMessage(payload);
            bc.close();
          }
        } catch (_) {}

        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(payload, '*');
          } catch (_) {}
          setTimeout(function () {
            window.close();
          }, 120);
          return;
        }

        var params = new URLSearchParams(window.location.search || '');
        var hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
        var flowType = params.get('type') || hashParams.get('type');
        var target = flowType === 'recovery'
          ? '/recuperar-senha'
          : ${JSON.stringify(safeNext)};

        setTimeout(function () {
          window.location.replace(target + (window.location.search || '') + (window.location.hash || ''));
        }, 120);
      })();
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
