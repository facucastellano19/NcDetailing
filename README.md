# 🚗 NcDetailing - Sistema de Gestión para Taller de Car Detailing (Backend)

> **Solución Real para Negocio en Producción** - Sistema integral desarrollado para la transformación digital de **NcDetailing**, un taller especializado en Car Detailing. Este proyecto, nacido como trabajo final de carrera, soluciona problemáticas reales de gestión y será implementado para el uso diario del cliente.

![NodeJS](https://img.shields.io/badge/Node.js-20.x-green?style=flat&logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey?style=flat&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=flat&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)
![Status](https://img.shields.io/badge/Status-Listo%20para%20Producción-success)

## 🎯 Contexto y Objetivo del Proyecto

Este software fue diseñado a medida para **resolver una necesidad de negocio real**: la falta de control centralizado en un taller de Car Detailing en crecimiento.

Aunque se presenta como **Proyecto Final para la Tecnicatura Superior en Análisis de Sistemas**, su alcance es profesional. El sistema digitaliza procesos específicos del rubro que antes eran manuales, permitiendo al cliente:
* 📉 **Controlar insumos críticos:** Gestión de stock de productos de limpieza y pulido.
* 🚗 **Historial vehicular:** Seguimiento detallado de los tratamientos realizados a cada vehículo.
* 📊 **Toma de decisiones:** Reportes financieros basados en métricas de ventas reales.
* 🔒 **Seguridad interna:** Auditoría de acciones de los empleados sobre el sistema.

## 👥 Equipo de Desarrollo

Para simular un entorno de trabajo profesional, el desarrollo se dividió en dos áreas especializadas, colaborando mediante metodologías ágiles para asegurar la entrega al cliente:

* **🛠️ Backend, Base de Datos & Infraestructura:** [Facundo Castellano](https://www.linkedin.com/in/facundocastellano/)
    * *Rol:* Arquitecto de Software y DevOps. Responsable de la lógica de negocio, integridad de datos, seguridad y despliegue.
* **🎨 Frontend & Experiencia de Usuario (UX):** [Vanina Lamas](https://github.com/vanLam687)
    * *Rol:* Desarrolladora Frontend. Responsable de traducir los requerimientos del cliente en una interfaz intuitiva y funcional.
    * 🔗 **[Ver Repositorio Frontend](https://github.com/vanLam687)**

---

## 🏗️ Arquitectura Técnica (Backend)

El backend fue construido priorizando la **estabilidad y escalabilidad**, dado que será utilizado en un entorno comercial real.

### Tecnologías Principales
* **Runtime:** Node.js (v20 Alpine en Docker).
* **Framework:** Express.js.
* **Base de Datos:** MySQL 8.0 (con `mysql2` y pool de conexiones).
* **Validaciones:** Joi (Middlewares de validación estricta de esquemas).
* **Seguridad:** Autenticación vía JWT y hashing con bcrypt.
* **Documentación:** Swagger (OpenAPI 3.0) para facilitar la integración con el equipo de Frontend.
* **Infraestructura:** Docker & Docker Compose para un despliegue agnóstico del entorno.

### Soluciones Implementadas
1.  **Gestión Híbrida de Ventas:** El sistema implementa una lógica de negocio bifurcada para adaptarse a la realidad del taller:
    * **Productos:** Control de inventario transaccional con descuento de stock en tiempo real y validación estricta de disponibilidad antes de confirmar la venta.
    * **Servicios de Detailing:** Flujo de trabajo vinculado obligatoriamente a **vehículos** para generar un historial clínico por patente. Incluye un ciclo de vida operativo propio (*Pendiente, En Proceso, Completado*) independiente del estado de pago.
2.  **Auditoría Completa (Audit Log):** Sistema de trazabilidad que registra **quién, cuándo y qué** modificó en el sistema (guardando el estado anterior y nuevo en JSON), requisito clave del cliente para el control interno.
3.  **Soft Deletes:** Implementación de borrado lógico para asegurar que no se pierda historial de ventas o clientes, vital para los reportes financieros.
4.  **Seguridad RBAC:** Control de acceso basado en roles para restringir funciones sensibles (como ajustes de stock o métricas financieras) solo al administrador.
5.  **Inteligencia de Negocio:** Stored Procedures optimizados en base de datos para generar reportes de ingresos y rendimiento en tiempo real sin saturar el servidor.
6.  **Integridad Transaccional (ACID):** Uso de transacciones en base de datos para operaciones críticas. Esto garantiza que, ante un error inesperado durante una venta o alta de cliente, se reviertan automáticamente todos los cambios (Rollback) para evitar inconsistencias de datos o stock corrupto.

---

## 🚀 Instalación y Despliegue

### Opción A: Despliegue con Docker (Producción/Local)
El proyecto está contenerizado para facilitar su puesta en marcha en el servidor del cliente o entornos de prueba:

```bash
# 1. Clonar el repositorio
git clone [https://github.com/facucastellano19/NcDetailing.git](https://github.com/facucastellano19/NcDetailing.git)
cd NcDetailing

# 2. Levantar servicios
docker-compose up --build
````

La API estará disponible en: `http://localhost:3000`

### Opción B: Ejecución Manual

1.  Instalar dependencias:

    ```bash
    npm install
    ```

2.  Configurar Base de Datos:

      * Ejecutar el script `db_init.sql` provisto en la raíz.

3.  Configurar variables de entorno (`.env`):

    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=tu_password
    DB_DATABASE=ncdetailing
    JWT_SECRET=tu_secreto_super_seguro
    ```

4.  Iniciar:

    ```bash
    npm start
    ```

-----

## 📚 Documentación para Desarrolladores

Para facilitar el mantenimiento futuro o la integración de nuevas funcionalidades, la API está completamente documentada.
Acceso a Swagger UI:

👉 **http://localhost:3000/api/docs**

-----

## 🗄️ Modelo de Datos

El diseño de la base de datos relacional soporta la operación diaria del negocio:
*(Script completo disponible en `db_init.sql`)*

  * **Usuarios y Seguridad:** Roles y permisos.
  * **Operativa:** Clientes y Vehículos.
  * **Catálogo:** Productos, Servicios de Detailing y Categorías.
  * **Facturación:** Ventas, Detalles de Venta y Métodos de Pago.
  * **Control:** Logs de Auditoría.

-----

## 📞 Contacto del Desarrollador

**Facundo Castellano**

  * **LinkedIn:** [linkedin.com/in/facundocastellano](https://www.linkedin.com/in/facundocastellano/)
  * **Email:** castellanofacundo05@gmail.com
