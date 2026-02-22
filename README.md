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
| POST   | /api/upload/image | Admin | Upload de imagem |

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
