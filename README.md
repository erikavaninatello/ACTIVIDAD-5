## Instalación y uso

### 1. Clonar el repositorio

```bash
git clone https://github.com/erikavaninatello/ACTIVIDAD-5.git
cd ACTIVIDAD-5
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Levantar la base de datos con Docker

```bash
docker build -t imagen_admin ./__docker-pg
docker run --name contenedor_admin -e POSTGRES_USER=root -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=admin -p 5433:5432 -d imagen_admin
```

### 4. Correr el servidor

```bash
node index.mjs
```

### 5. Usar la app

- Registro: http://localhost:3000/login → click en Registrarse
- Login: http://localhost:3000/login
- Admin (protegido): http://localhost:3000/admin

## Flujo

1. El usuario se registra → la contraseña se hashea con bcrypt y se guarda en la BD
2. El usuario se loguea → se compara la contraseña con el hash guardado
3. Si es correcto → se genera un session ID con nanoid, se guarda en la BD y se envía como cookie
4. La ruta `/admin` verifica la cookie contra la BD antes de dejar entrar
5. Sin cookie válida → redirige al login
