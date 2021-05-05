const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json())
const { Sequelize, DataTypes } = require('sequelize');

// conect to database
const sequelize = new Sequelize('postgres://postgresql-sinuous-30280');

// get users table
const User = sequelize.define('user', {
    // user_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    //     primaryKey: true
    // },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, { timestamps: false }
);
console.log(User === sequelize.models.user); // true

// get vacation table
const Vacation = sequelize.define('vacation', {
    vac_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false
    },
    start_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    followers_mount: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
}, { timestamps: false, tableName: 'vacation' }
);
console.log(Vacation === sequelize.models.vacation); // true

// get followers table
const follower = sequelize.define('follower', {
    follower_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true
    },
    vacation: {
        type: DataTypes.INTEGER,
        allowNull: false,
        foreignKey: true
    },
}, { timestamps: false }
);
console.log(follower === sequelize.models.follower); // true

app.get('/', (req, res) => {
    User.findAll()
    res.send( User.findAll());
});

// rgister
app.post('/signUp', async (req, res) => {
    const { first_name, last_name, user_name, password } = req.body;
    const db = await User.findAll()

    db.map(user => {
        if (user.user_name === user_name) {
            return res.send('user name exzist');
        }
    });
    // return res.send('llllll')
    const addUser = await User.create({
        first_name, last_name, user_name, password
    },
        { fields: ['first_name', 'last_name', 'user_name', 'password'] }
    );
    res.send("addUser");
})

// log in
app.post('/logIn', async (req, res) => {
    const { user_name, password } = req.body;
    const signIn = await User.findAll({
        where: { user_name: user_name, password: password }
    });
    if (signIn.length == 0) {
        return res.send({ error: 'user name or password dosnet match' });
    }
    res.send(signIn);
});

// //get users list
// app.get('/usersList', async (req, res) => {
//     const usersArr = await User.findAll();
//     res.send(usersArr);
// })

// get vacation list 
app.get('/vaction/:id', async (req, res) => {
    const vacList = await sequelize.query(
        `SELECT vacation.vacation.* ,follower_id FROM vacation.vacation
        left join vacation.followers
        on (vac_id=vacation and vacation.followers.user = ${req.params.id})
        ORDER BY follower_id DESC`);
    res.send(vacList);
});

//search vacation
app.post('/searchVacation', async (req, res) => {
    const vacList = await sequelize.query(
        `SELECT vacation.vacation.* ,follower_id FROM vacation.vacation
        left join vacation.followers
        on (vac_id=vacation and vacation.followers.user = ${req.body.user}) 
        where description like '%${req.body.search}%' 
        ORDER BY follower_id DESC` );
    res.send(vacList);
})

async function isFollow(user, vacation) {
    const isfoloow = await follower.findAll({
        where: { user, vacation }
    })
    if (isfoloow.length == 0) {
        return ('false');
    }
    return 'true';
}

// check if user follow some vacation and add or remove it
app.post('/isFollow', async (req, res) => {
    const { user, vacation } = req.body;
    //add 
    if (await isFollow(user, vacation) === 'false') {
        const folloe = await follower.create({ user, vacation }, { fields: ['user', 'vacation'] });
        await sequelize.query(`update vacation.vacation set followers_mount = followers_mount + 1  where vac_id = ${vacation};`)
        return res.send("folloe");
    }
    //remove follower
    else if (await isFollow(user, vacation) === 'true') {
        await follower.destroy({
            where: { user, vacation }
        })
        await sequelize.query(`update vacation.vacation set followers_mount = followers_mount - 1  where vac_id = ${vacation};`)

        res.send('dlete follow');
    }
})

///////////////////////////////admin

//get vacation list for admin (admin)
app.get('/vactionAdmin', async (req, res) => {
    const aa = await Vacation.findAll();
    res.send(aa);
});

// add vacation (admin)
app.post('/addVacation', async (req, res) => {
    const { description, location, image, start_at, end_at, price } = req.body;
    const addVac = await Vacation.create({
        description, location, image, start_at, end_at, price
    },
        { fields: ['description', 'location', 'image', 'start_at', 'end_at', 'price'] }
    )
    res.send(addVac);
});

// edit vacation
app.post('/editVacation', async (req, res) => {
    const { description, location, image, start_at, end_at, price, vacId } = req.body;
    const re = await Vacation.update({ description, location, image, start_at, end_at, price }, { where: { vac_id: vacId.vac_id } })
    res.send(re)
})

//delete vacation (admin)
app.post('/deleteVacation', async (req, res) => {
    await follower.destroy({
        where: { vacation: req.body.vacId }
    })
    await Vacation.destroy({
        where: { vac_id: req.body.vacId }
    })
    res.send('deleteVac');
})

// get vacationFollowed
app.get('/vacationFollowed', async (req, res) => {
    const vac = await sequelize.query('SELECT * FROM vacation.vacation where followers_mount > 0;');
    res.send(vac);
})

app.listen(process.env.PORT || 3001, console.log(`app on port ${process.env.PORT}`));