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

## Preço na moeda do visitante

`api/precio.js` lê o país do visitante (cabeçalho `x-vercel-ip-country` da Vercel) e busca o câmbio do dólar (ExchangeRate-API, atualizado a cada 6 horas). O app mostra o preço aproximado em MXN, COP, PEN, CLP, BRL ou EUR; nos demais países, em dólar. Os valores em dólar ficam em `CONFIG.price`, no `app/index.html`, e devem ser iguais aos cadastrados na Hotmart.

## Biblioteca de Estudo (upsell)

`app/data/bib/`: Mateus, Marcos, Lucas e João versículo por versículo, Provérbios 1-31 e 194 versículos-chave. Liberada com `#biblioteca-1e145dbf` (upsell US$ 19,90 ou downsell US$ 10,90; os dois entregam o mesmo conteúdo). Quem não tem acesso lê o começo de cada capítulo e vê a oferta.

## Pagamento pendente (boleto, OXXO, PIX)

`https://app-salmos.vercel.app/app/#pendiente-221a4216` libera 21 salmos completos, 3 orações por situação e 7 dias do plano, com aviso de pedido reservado e opção de pagar com cartão. Nunca rebaixa quem já tem acesso completo.

## Acesso por e-mail e webhook Hotmart

- `api/hotmart.js` — webhook Hotmart 2.0 (`/api/hotmart`). Valida o `X-HOTMART-HOTTOK`, grava o status de cada comprador (aprovado, pendente, reembolso, chargeback, cancelado) no Upstash Redis.
- `api/acceso.js` — o app consulta o status pelo e-mail da compra.
- `api/contenido.js` — entrega o conteúdo completo (criptografado em `conteudo/*.enc`) só para e-mails com compra ativa.
- O app em `app/data/` contém só a parte grátis. Link de entrega: `/app/#activar`.

Variáveis na Vercel: `CONTENT_KEY`, `HOTMART_HOTTOK`, `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Upstash), opcional `HOTMART_PRODUCT_BIB` e `ADMIN_EMAILS`.
Para regenerar o conteúdo: `CONTENT_KEY=<hex> python3 tools/split_content.py <pasta_com_json_completos>`.
