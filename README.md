# Palabra con Poder

App (PWA) de Salmos explicados e orações em espanhol, com página de download grátis.

- `/` — página de vendas com demonstração do app ao vivo
- `/app/` — o app (instalável no celular, funciona sem internet)
- `/app/#preview` — app com o painel de prévia (simula visitante, cliente e cliente com upsell)

## Configurar vendas

No topo do script de `app/index.html`, bloco `CONFIG`:

- `checkout`: link do checkout Hotmart do Plano Completo
- `upsell`: link do checkout da Biblioteca de Estudo
- `links`: páginas de venda dos banners
- `activar`: endereços que liberam o conteúdo. Configure na Hotmart, como página de obrigado:
  - Plano Completo: `https://SEU-DOMINIO/app/#acceso-3f385a2a`
  - Biblioteca (upsell): `https://SEU-DOMINIO/app/#biblioteca-1e145dbf`

Atenção: a liberação é feita no próprio celular. Quem tiver o link consegue liberar, e os arquivos em `app/data/` são públicos. O próximo passo é login com verificação da compra pela Hotmart.

## Deploy

Site estático, sem build. Na Vercel: importar o repositório, Framework "Other", sem comando de build.

Texto bíblico: Reina-Valera 1909 (domínio público).
