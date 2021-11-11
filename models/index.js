const fs = require('fs')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const config = require('./../config');

async function validateDatabase(db, logger) {
    try {
        db = await open({
            filename: config.databaseFile,
            driver: sqlite3.Database,
            mode: sqlite3.OPEN_READWRITE
        });
        await db.get('SELECT * FROM accounts LIMIT 1')
        await db.get('SELECT * FROM devices LIMIT 1')
        await db.get('SELECT * FROM drives LIMIT 1')
        await db.get('SELECT * FROM drive_segments LIMIT 1')

    } catch (exception) {
        logger.error(exception);
        process.exit();
    }
}




module.exports = async (logger) => {
    let db;

    // check whether the database file exists
    if (!fs.existsSync(config.databaseFile)) {
        if (fs.existsSync('database.empty.sqlite')) {
            logger.warn('Database file does not exist, copying empty database template...')
            try {
                fs.copyFileSync('database.empty.sqlite', config.databaseFile)
                logger.info('Copied empty database to', config.databaseFile)
            } catch (e) {
                logger.error('Failed to copy database template', e)
            }

        } else {
            logger.warn('Database file does not exist', config.databaseFile)
        }
    }

    try {
        db = await open({
            filename: config.databaseFile,
            driver: sqlite3.Database,
            mode: sqlite3.OPEN_READWRITE
        });

    } catch (exception) {
        logger.error(exception);
        process.exit();
    }

    // I'm not sure we _really_ need to wait for this, since it'll exit the application if it's invalid anyway.

    await validateDatabase(db, logger);


    return {
        models: {
            drivesModel: require('./drives')(db),
            users: require('./users')(db),

            // TODO remove access to DB queries from non models
            __db: db // to be removed when db queries are removed from outside models.
        }
    }
}
