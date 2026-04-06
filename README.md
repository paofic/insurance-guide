# Страхование — просто и понятно

Интерактивный гайд по страхованию для подростков с AI-чатом на базе OpenRouter.

## Стек

- Фронтенд: чистый HTML/CSS/JS, без фреймворков
- Бэкенд: Vercel Serverless Function (`api/chat.js`)
- Модель: `qwen/qwen3-4b:free` через OpenRouter

## Деплой на Vercel

### 1. Получи API-ключ OpenRouter

1. Зарегистрируйся на [openrouter.ai](https://openrouter.ai)
2. Перейди в **Keys** → создай новый ключ
3. Скопируй ключ (начинается с `sk-or-...`)

### 2. Залей проект на GitHub

```bash
git init
git add .
git commit -m "init"
gh repo create insurance-guide --public --push
```

### 3. Задеплой на Vercel

**Вариант A — через сайт:**
1. Открой [vercel.com](https://vercel.com) → **Add New Project**
2. Импортируй репозиторий с GitHub
3. В разделе **Environment Variables** добавь:
   - `OPENROUTER_API_KEY` = твой ключ от OpenRouter
   - `SITE_URL` = URL твоего сайта (например, `https://insurance-guide.vercel.app`)
4. Нажми **Deploy**

**Вариант B — через CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
# При запросе добавь переменные окружения
```

### 4. Проверь деплой

Открой ссылку, которую выдал Vercel. Чат должен отвечать на вопросы о страховании.

## Локальный запуск

```bash
npm i -g vercel
vercel dev
```

Сайт будет доступен на `http://localhost:3000`.  
Не забудь создать файл `.env.local`:

```
OPENROUTER_API_KEY=sk-or-...
SITE_URL=http://localhost:3000
```

## Структура проекта

```
insurance-guide/
├── index.html        # Весь фронтенд
├── api/
│   └── chat.js       # Serverless-прокси к OpenRouter
├── vercel.json       # Конфиг Vercel
└── README.md
```
