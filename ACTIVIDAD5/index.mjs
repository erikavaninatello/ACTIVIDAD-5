import express from 'express';
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import { nanoid } from 'nanoid'
import pool from './conexion.bd.mjs'


// ← AGREGAR ESTO TEMPORALMENTE
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('Error de conexión:', err.message)
    } else {
        console.log('Conexión exitosa a la BD:', res.rows[0])
    }
})

const PUERTO = 3000

////////////////

////////////////
const app = express();

app.use(cookieParser())


app.use(express.json()) // ---> req.body -> un objeto JS
app.use(express.urlencoded({extended:true})) // ---> req.body -> un objeto JS

// hacer publicas estas carpetas para acceder desde el navegador

// -> /admin -> peticion (./fronts/front-admin)
app.use('/admin', async (req, res, next) => {
    const userSessionId = req.cookies.sessionId
    if (!userSessionId) return res.redirect('/login')

    const resultado = await pool.query(
        'SELECT session_id FROM usuarios WHERE session_id = $1',
        [userSessionId]
    )
    if (resultado.rowCount === 0) {
        return res.redirect('/login')
    }
    next()
}, express.static('./fronts/front-admin'))

// -> /login -> peticion (./fronts/front-login)
app.use('/login', express.static('./fronts/front-login'))


// Configuracion rutas login y registro
app.post('/autenticar', async (req, res)=>{
    const { usuario, pass } = req.body

    if (!usuario || !pass) {
        return res.status(400).send('Usuario y contraseña son requeridos')
    }

    let verificado = false
    try {
        // Busca el hash del usuario en la BD
        const resultado = await pool.query(
            'SELECT password_hash FROM usuarios WHERE username = $1',
            [usuario]
        )
        // Compara la contraseña ingresada con el hash guardado
        verificado = await bcrypt.compare(pass, resultado.rows[0].password_hash)
    } catch (error) {
        return res.status(401).send('Error al verificar la contraseña')
    }

    if (verificado) {
        // Genera un ID de sesión único con nanoid
        const sesionId = nanoid(21)
        // Guarda el session_id en la BD
        const resultado = await pool.query(
            'UPDATE usuarios SET session_id = $1 WHERE username = $2 RETURNING session_id',
            [sesionId, usuario]
        )
        // Crea la cookie con el session_id
        res.cookie('sessionId', resultado.rows[0].session_id, {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000, // 1 día
        })
        res.redirect('/admin')
    } else {
        res.status(401).send('Usuario o contraseña incorrectos')
    }
})



app.post('/registrar', async (req, res)=>{
    // 1 - Obtengo los datos del formulario
    // const usuario = req.body.usuario
    // const pass = req.body.pass
    const {usuario, pass} = req.body

    // 2 - chequear datos
    if(!usuario || !pass){
        return res.status(400).json({
            mensaje: 'Datos incompletos'
        })
    }

    // 3 - Hashing
    // Utilizar try/catch
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pass, salt);

    const resultado = await pool.query(`
        INSERT INTO usuarios
            (username, password_hash)
        VALUES
            ($1, $2)
        RETURNING id, username
        `,
        [
            usuario,
            hash
        ]
    )
    // Si todo OK
    if(resultado.rowCount > 0){
        return res.status(201).json({mensaje:'usuario registrado', usuario: resultado.rows[0].username})
    }
    // Si no:
    res.status(500).json({
        mensaje: 'No se pudo reslizar el registr'
    })
})

app.get('/logout', (req, res) => {
    res.cookie('sessionId', '', { maxAge: 0 })
    res.redirect('/login')
})

app.listen(PUERTO, () => {
    console.log(`Servidor escuchando en el puerto ${PUERTO}`);
});
