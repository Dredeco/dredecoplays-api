# Dredeco Plays Blog API

API RESTful para gerenciamento de blog estilo Dredeco Plays, construída com Node.js + Express + MySQL.

## Requisitos

- Node.js >= 18.x
- MySQL >= 5.7

## Instalação Local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 3. Criar o banco de dados no MySQL
mysql -u root -p -e "CREATE DATABASE dredecoplays_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Executar migrations
npm run migrate

# 5. Popular com dados iniciais
npm run seed

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

## Endpoints da API

### Auth

| Método | Rota            | Auth | Descrição           |
| ------ | --------------- | ---- | ------------------- |
| POST   | /api/auth/login | -    | Login               |
| GET    | /api/auth/me    | JWT  | Usuário autenticado |

### Posts

| Método | Rota                   | Auth  | Descrição               |
| ------ | ---------------------- | ----- | ----------------------- |
| GET    | /api/posts             | -     | Listar posts (paginado) |
| GET    | /api/posts/featured    | -     | Post em destaque        |
| GET    | /api/posts/popular     | -     | Mais lidos              |
| GET    | /api/posts/recent      | -     | Recentes                |
| GET    | /api/posts/:slug/seo   | -     | Metadados SEO (JSON)    |
| GET    | /api/posts/:slug       | -     | Post por slug           |
| POST   | /api/posts             | Admin | Criar post              |
| PUT    | /api/posts/:id         | Admin | Editar post             |
| DELETE | /api/posts/:id         | Admin | Remover post            |
| PATCH  | /api/posts/:id/publish | Admin | Publicar/despublicar    |

### Categories

| Método | Rota                        | Auth  | Descrição          |
| ------ | --------------------------- | ----- | ------------------ |
| GET    | /api/categories             | -     | Listar categorias  |
| GET    | /api/categories/:slug/posts | -     | Posts da categoria |
| POST   | /api/categories             | Admin | Criar categoria    |
| PUT    | /api/categories/:id         | Admin | Editar categoria   |
| DELETE | /api/categories/:id         | Admin | Remover categoria  |

### Tags, Products, Users

Seguem o mesmo padrão CRUD com proteção JWT admin.

### Upload

| Método | Rota              | Auth  | Descrição        |
| ------ | ----------------- | ----- | ---------------- |
| POST   | /api/upload/image | Admin | Upload de imagem (gera original + WebP) |

**Resposta `POST /api/upload/image` (201):**

```json
{
  "data": {
    "url": "https://api.dredecoplays.com.br/uploads/1234567890-123456.png",
    "webpUrl": "https://api.dredecoplays.com.br/uploads/1234567890-123456.webp",
    "width": 1200,
    "height": 800
  }
}
```

Imagens com largura inferior a 1200px são ampliadas para 1200px (proporção mantida). É gerada uma variante `.webp` (PNG/JPG e demais formatos suportados). Envio já em WebP retorna o mesmo arquivo em `url` e `webpUrl`.

### SEO (público)

| Método | Rota           | Auth | Descrição                                      |
| ------ | -------------- | ---- | ---------------------------------------------- |
| GET    | /sitemap.xml   | -    | Sitemap XML (posts publicados + páginas fixas) |
| GET    | /feed.xml      | -    | Feed RSS 2.0 (20 posts mais recentes)          |
| GET    | /api/posts/:slug/seo | - | JSON para meta tags e JSON-LD no front-end |

**Headers:** `sitemap.xml` — `Content-Type: application/xml`, `Cache-Control: public, max-age=3600`.  
**Headers:** `feed.xml` — `Content-Type: application/rss+xml`, `Cache-Control: public, max-age=1800`.  
**Headers:** `/api/posts/:slug/seo` — `Cache-Control: public, max-age=600`.

**Exemplo `GET /api/posts/meu-post/seo` (200):**

```json
{
  "title": "Título do post",
  "description": "Resumo com até 160 caracteres…",
  "slug": "meu-post",
  "url": "https://dredecoplays.com.br/blog/meu-post",
  "canonicalUrl": "https://dredecoplays.com.br/blog/meu-post",
  "publishedAt": "2026-03-21T10:00:00.000Z",
  "updatedAt": "2026-03-21T10:00:00.000Z",
  "author": {
    "name": "Nome do Autor",
    "url": "https://dredecoplays.com.br/autor/nome-do-autor"
  },
  "category": { "name": "Guias & Dicas", "slug": "guias-dicas" },
  "image": {
    "url": "https://api.dredecoplays.com.br/uploads/imagem.jpg",
    "width": 1200,
    "height": 630,
    "alt": "Título do post"
  },
  "readingTime": 6,
  "tags": ["steam", "games"]
}
```

`404` se o post não existir ou não estiver publicado.

## Parâmetros de Query - GET /api/posts

| Parâmetro | Tipo   | Descrição                         |
| --------- | ------ | --------------------------------- |
| page      | number | Página (default: 1)               |
| limit     | number | Itens por página (default: 10)    |
| category  | string | Filtrar por slug da categoria     |
| tag       | string | Filtrar por slug da tag           |
| search    | string | Busca por título/excerpt          |
| status    | string | draft ou published (apenas admin) |

## Deploy na Hostinger

### 1. Banco de Dados

No cPanel da Hostinger, crie um banco MySQL e anote as credenciais.

### 2. Node.js App

- Vá em **Node.js** no cPanel
- Clique em **Create Application**
- **Node.js version:** 18.x ou superior
- **Application mode:** Production
- **Application root:** public_html/api (ou o diretório desejado)
- **Application startup file:** server.js
- Clique em **Create**

### 3. Upload dos arquivos

Faça upload de todos os arquivos (exceto `node_modules/` e `.env`) via FTP ou Git.

### 4. Configurar variáveis de ambiente

No painel Node.js do cPanel, adicione as variáveis do `.env.example` com os valores de produção.

### 5. Instalar dependências e rodar migrations

No terminal SSH do cPanel:

```bash
cd ~/public_html/api
npm install --production
npm run migrate
npm run seed
```

### 6. Iniciar a aplicação

Clique em **Start** no painel Node.js do cPanel.

## Estrutura do Projeto

```
├── src/
│   ├── config/          # Configurações de DB e JWT
│   ├── controllers/     # Lógica dos endpoints
│   ├── middlewares/     # Auth, validação, upload, erros
│   ├── models/          # Models Sequelize
│   └── routes/          # Definição das rotas
├── migrations/          # Migrations do banco
├── seeders/             # Dados iniciais
├── public/uploads/      # Imagens enviadas
├── server.js            # Entry point
└── .env.example         # Exemplo de variáveis
```
