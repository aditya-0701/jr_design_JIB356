const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');
const connection = require('./dbInit');

var failure = (err = 'unauthorized access') => {
  return {
    body: JSON.stringify({
      message: 'Unauthorized access attempted. Please check your login parameters.',
      error: err
    }),
    statusCode: 401,
    headers: {
      'Content-Type': 'appliction/json'
    }
  };
};

const Login = {};

Login.loginUser = async ( params ) => {
  const { gtUsername, password } = params;
  // Need to implement for Alumni
  const query = `SELECT gtUsername, pwd
        FROM Students
        WHERE gtUsername = "${gtUsername}"`;
    // if (role == "" || role == "Students" /*|| role == "Alumni"*/) {
    //     let query = `SELECT username, pwd
    //     FROM Alumni
    //     WHERE id = "${gtUsername}"`;
    // }
  try {
    const user = (await connection.query(query))[0];
    if (!user) return failure('User not found');
    const match = await bcrypt.compare(password, user.pwd);
    if (match) {
      // Randomly generated session ID
      const uid = uuid();
      // Expiry set to 1 hour from current time
      const expiry = ((new Date()).getTime() + 3 * 3600000) / 1000;
      const insert = 'REPLACE INTO StudentSessions SET ?';
      const session = await connection.query(insert, {
        sessionId: uid,
        gtUsername: user.gtUsername,
        expiry: expiry
      });
      return {
        body: JSON.stringify({
          message: 'Successful login. Session active for 1 hour.',
          sessionId: uid,
          expiry: expiry,
          query: session
        }),
        statusCode: 200,
        headers: {
          'Content-Type': 'appliction/json'
        }
      };
    } else return failure();
  } catch (e) {
    return failure(e);
  }
  // } else {
  //     return failure();
  // }
};

Login.validateSession = async ( params ) => {
  // return params;
  var { gtUsername, sessionId } = params;
  const query = `SELECT gtUsername
        FROM Students
        WHERE gtUsername = "${gtUsername}"`;
  try {
    const user = (await connection.query(query))[0];
    if (!user) return failure('User not found');

    const sessionQuery = `SELECT gtUsername, sessionId, expiry
            FROM StudentSessions
            WHERE gtUsername = "${gtUsername}"`;
    const session = (await connection.query(sessionQuery))[0];

    const currTime = (new Date()).getTime() / 1000;
    if (session.sessionId === sessionId &&
            session.expiry > currTime) {
      const uid = uuid();
      // Expiry set to 1 hour from current time
      const expiry = ((new Date()).getTime() + 3 * 3600000) / 1000;
      const insert = 'REPLACE INTO StudentSessions SET ?';
      const newSession = await connection.query(insert, {
        sessionId: uid,
        gtUsername: user.gtUsername,
        expiry: expiry
      });
      console.log(newSession);
      return {
        body: JSON.stringify({
          message: 'Successful login. Session currently active. New sessionId generated.',
          oldExpiry: session.expiry,
          sessionId: uid,
          expiry: expiry
        }),
        statusCode: 200,
        headers: {
          'Content-Type': 'appliction/json'
        }
      };
    } else {
      return {
        body: JSON.stringify({
          message: 'Session not active. The session is expired or invalid session ID.'
        }),
        statusCode: 401,
        headers: {
          'Content-Type': 'appliction/json'
        }
      };
    }
  } catch (e) {
    // return params;
    return failure(e);
  }
};

module.exports = Login;
