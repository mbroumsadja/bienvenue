import express from 'express';
import mariadb from 'mariadb';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';

const app = express();

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'emmanuel',
    password: 'AlphA12+',
    database: 'music',
    port: 3306
});

app.get('/app',(request, reponse) => {
    reponse.status(200).sendFile(('public/index.html'),{ root:'./' });
});

app.get('/',(request, reponse) => {
    reponse.status(200).sendFile(('public/login.html'),{ root:'./'});
});

app.get('/signup',(request, reponse) => {
    reponse.status(200).sendFile(('public/signup.html'),{ root:'./'});
});

app.get(('/'),(request, reponse) => {
    reponse.status(300).redirect('/login');
});

async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Erreur de connexion à la base de données:', error);
        throw error;
    }
}

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Tous les champs sont requis');
    }

    try {
        const conn = await getConnection();
        
        const existingUser = await conn.query(
            'SELECT * FROM users WHERE username = ? OR email = ?', 
            [username, email]
        );

        if (existingUser.length > 0) {
            conn.release();
            return res.status(409).send('Nom d\'utilisateur ou email déjà existant');
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await conn.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
            [username, email, hashedPassword]
        );

        conn.release();
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).send('Erreur du serveur');
    }
});

app.post('/', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Nom d\'utilisateur et mot de passe requis');
    }

    try {
        const conn = await getConnection();

        const users = await conn.query(
            'SELECT * FROM users WHERE username = ?', 
            [username]
        );

        if (users.length === 0) {
            conn.release();
            return res.status(401).send('Utilisateur non trouvé');
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);

        conn.release();

        if (isMatch) {

            res.redirect('/app');
        } else {
            res.status(401).send('Mot de passe incorrect');
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        res.status(500).send('Erreur du serveur');
    }
});

app.listen(2001,() => {
    console.log('serveur tourne sur le port: 2001');
 });