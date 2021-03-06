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

// Process to login a user
Login.loginUser = async ( params ) => {
  const role = (params.role == null) ? 'S' : params.role;
  const { gtUsername, password, username } = params;
  
  
  var query = `SELECT gtUsername, pwd
        FROM Students
        WHERE gtUsername = "${gtUsername}"`;
  if (role === 'A') {
    query = `SELECT username, pwd
        FROM Alumni
        WHERE username = "${username}"`
  }
  
  try {
    const user = (await connection.query(query))[0];
    if (!user) return failure('User not found');
    const match = await bcrypt.compare(password, user.pwd);
    if (match) {
      // Randomly generated session ID
      const uid = uuid();
      // Expiry set to 3 hours from current time
      const hours = 3;
      const expiry = ((new Date()).getTime() + hours * 3600000) / 1000;
      
      var insert = 'REPLACE INTO StudentSessions SET ?';
      var insertVals = {
        sessionId: uid,
        gtUsername: user.gtUsername,
        expiry: ~~expiry
      }
      if (role === 'A') {
        insert = `REPLACE INTO AlumniSessions SET ?`
        insertVals = {
        sessionId: uid,
        username: user.username,
        expiry: ~~expiry
      }
      }
      
      const session = await connection.query(insert, insertVals);
      return {
        body: JSON.stringify({
          message: 'Successful login. Session active for 1 hour.',
          sessionId: uid,
          expiry: ~~expiry
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
};

// Check to see if user has logged in recently
Login.validateSession = async ( params ) => {
  var { gtUsername, sessionId } = params;
  const query = `SELECT gtUsername
        FROM Students
        WHERE gtUsername = "${gtUsername}"`;
  try {
    const user = (await connection.query(query))[0];
    if (!user) return failure('User not found');
    // If user exists then renew SESSIONID
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
