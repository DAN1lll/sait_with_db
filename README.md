 
# Postal Track System

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![D1 Database](https://img.shields.io/badge/D1-Database-FF9A00?style=flat-square&logo=sqlite)](https://developers.cloudflare.com/d1/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> Современная система отслеживания почтовых отправлений 

## Особенности

-  **Реальное отслеживание** — Полная история перемещений посылки
-  **Современный UI** — Адаптивный дизайн с анимациями
-  **API-first подход** — REST API для интеграции с любыми системами
-  **Безопасность** — Защита от XSS, SQL-инъекций, Rate limiting
-  **Производительность** — Cloudflare Workers + D1 на глобальной сети

## Архитектура
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Frontend │────▶│ API Worker │────▶│ D1 Database │
│ (Pages) │ │ (Workers) │ │ (SQLite) │
└─────────────────┘ └─────────────────┘ └─────────────────┘
│ │ │
└───────────────────────┴────────────────────────┘

### Технологии

| Компонент | Технология | Назначение |
|-----------|-----------|------------|
| **Frontend** | HTML5/CSS3/JS | Интерфейс пользователя |
| **API** | Cloudflare Workers | Серверная логика |
| **Database** | Cloudflare D1 | Хранение данных |
| **Deployment** | Cloudflare Pages | Хостинг фронтенда |

## 📋 Функционал

### Публичные эндпоинты
- `GET /api/postal/track/:id` — Отслеживание посылки
- `GET /api/postal/offices` — Список отделений
- `GET /api/test` — Проверка API

### Административные (с API ключом)
- `POST /api/postal/shipment` — Создание посылки
- `POST /api/postal/status` — Обновление статуса
- `DELETE /api/postal/shipment/:id` — Удаление
