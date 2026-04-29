---
version: 1.4.2
type: bugfix
status: done
locale: uk
models: []
---

# 🚀 Mission: Fix sealed DB store mount error in IndexWorkspaceApp

## 🏁 Overview (Огляд)
Виправлення помилки "Mount registry is sealed" при виклику `nan0ai index`, яка виникає через те, що `storeDb` використовував `this._.db` (що вже запечатано), замість створення нового ізольованого екземпляру `DBFS`.

## 👥 User Stories (Сценарії)
> Як розробник, я хочу виконувати `nan0ai index -p bank --force --skip-data` без помилки "Mount registry is sealed", щоб успішно індексувати свій проєкт.

## 🏗 Data-Driven Architecture (Моделювання)
Немає нових моделей. Змінюється лише ініціалізація `storeDb` в `IndexWorkspaceApp.js`.

## 🎯 Scope (Задачі)
- [x] Виправити `IndexWorkspaceApp.js` `indexFull()`: додати `try/catch` для fallback `storeDb = new DBFS()` якщо надана `this._.db` запечатана (sealed).

## ✅ Acceptance Criteria (DoD)
- [x] Контрактні тести (`task.spec.js`) написані і успішно проходять (Green).
- [x] Помилка "Mount registry is sealed" більше не з'являється при запуску `indexFull()`.
