```markdown
![Status](https://img.shields.io/badge/status-active-success)
![Frontend](https://img.shields.io/badge/frontend-JavaScript-blue)
![Backend](https://img.shields.io/badge/backend-Node.js-green)
![Database](https://img.shields.io/badge/database-PostgreSQL-blue)

# 💼 EmpleaLink – Portal de Empleo

Plataforma web desarrollada para conectar empresas con candidatos, permitiendo la gestión de ofertas laborales, postulaciones, perfiles profesionales y un sistema de interacción mediante foro y notificaciones.

---

## 🚀 Descripción del Proyecto

**EmpleaLink** es un portal de empleo que permite:

- A empresas publicar y gestionar vacantes
- A candidatos crear su perfil profesional y postularse
- Visualizar candidatos y gestionar procesos de reclutamiento
- Interactuar mediante un foro con sistema de reportes y moderación
- Recibir notificaciones y alertas de empleo

Este proyecto fue desarrollado como parte de un trabajo académico, cumpliendo con requerimientos funcionales y técnicos definidos.

---

## 🧩 Funcionalidades Principales

### 👤 Candidatos
- Crear y editar perfil profesional
- Agregar experiencia laboral y educación
- Registrar habilidades
- Guardar empleos
- Postularse a vacantes
- Configurar alertas de empleo
- Recibir notificaciones

### 🏢 Empresas
- Crear y editar perfil de empresa
- Subir logo e información institucional
- Crear, editar y cerrar ofertas laborales
- Ver candidatos postulados
- Aceptar, rechazar o marcar candidatos para entrevista

### 📢 Gestión de Ofertas
- Visualización de ofertas activas y cerradas
- Filtros dinámicos
- Estadísticas de vacantes
- Redirección a perfil del candidato

### 💬 Foro
- Publicación de posts y comentarios
- Respuestas en hilo
- Sistema de reportes
- Moderación por administrador

### 🔔 Notificaciones
- Generación automática de notificaciones
- Integración con alertas de empleo
- Visualización en navbar (campana)
- Marcado como leídas dinámicamente

---

## 🗄️ Base de Datos

El sistema utiliza **PostgreSQL** con las siguientes entidades principales:

- `users` – Usuarios del sistema
- `profiles` – Perfiles de candidatos
- `company_profiles` – Perfiles de empresas
- `job_posts` – Ofertas laborales
- `job_post_applications` – Postulaciones
- `job_alerts` – Alertas de empleo
- `notifications` – Notificaciones
- `forum_posts` / `forum_comments` – Foro
- `forum_reports` / `moderation_actions` – Moderación

---

## 🔌 API

La aplicación consume una API REST desplegada en:
https://portal-empleo-api-production.up.railway.app


### Endpoints principales:

| Recurso | Endpoint |
|--------|--------|
| Usuarios | `/users` |
| Perfiles | `/profiles` |
| Empresas | `/company-profiles` |
| Vacantes | `/job-posts` |
| Postulaciones | `/applications` |
| Alertas | `/job-alerts` |
| Notificaciones | `/notifications` |
| Foro | `/forum-posts`, `/forum-comments` |
| Reportes | `/forum/reports` |
| Moderación | `/moderation-actions` |

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Bootstrap 5

### Backend (API)
- Node.js
- Express
- PostgreSQL

### Herramientas
- Git & GitHub
- Railway (deploy API)
- VS Code

---

## 📁 Estructura del Proyecto
📦 Portal-de-Trabajo
┣ 📂 css
┣ 📂 js
┣ 📂 media
┣ 📄 index.html
┣ 📄 dashboardEmpresa.html
┣ 📄 perfilEmpresa.html
┣ 📄 perfilUsuario.html
┣ 📄 perfilCandidato.html
┣ 📄 gestionDeOfertas.html
┣ 📄 foro.html
┣ 📄 README.md


---

## ⚙️ Instalación y Uso

1. Clonar el repositorio:

```bash
git clone https://github.com/Douglas0625/Portal-de-Trabajo.git
```
1. CLonar el repositorio de la API:

```bash
git clone https://github.com/Dytox/Portal-Empleo-API.git
```