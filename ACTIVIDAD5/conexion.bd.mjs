import {Pool} from 'pg';

const pool = new Pool({
    host: 'localhost',
    user: 'root',
    password: 'pass',
    database: 'admin',
    port: 5433,
})

export default pool