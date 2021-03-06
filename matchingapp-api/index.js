const student = require('./src/controllers/studentController.js');
const alumni = require('./src/controllers/alumniController.js');
const login = require('./src/login.js');

const four03 = () => {
  return {
    body: JSON.stringify({
      message: 'Invalid request. Method not found or invalid endpoint.',
      status: 403
    }),
    statusCode: 403,
    contentType: 'appliction/json'
  };
};

/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */
exports.handler = async (event) => {
  // Process request
  const { rawPath, rawQueryString = null, body } = event;
  const pathArr = rawPath.split('/');
  const mainPath = pathArr[1];
  const parsedBody = (body) ? JSON.parse(body) : null;
  const query = (rawQueryString != null && rawQueryString !== '') ? parseQuery(rawQueryString) : null;
  const method = event.requestContext.http.method;
  const pathParams = event.pathParameters || null;
  // Handle Routing for the API
  switch ( mainPath ) {
    case 'student':
      switch ( method ) {
        case 'GET':
          if (pathParams) {
            return await student.findOne( pathParams );
          } else {
            return await student.getAll( query );
          }
        case 'PUT':
          return student.update( parsedBody );

        case 'POST':
          return student.create( parsedBody );

        case 'DELETE':
          return student.delete( query );

        default:
          return four03();
      }
    case 'alumni':
      switch (method) {
        case 'GET':
          if (query) {
            return alumni.findByName(query);
          } else {
            return alumni.getAll();
          }
        case 'PUT':
          return alumni.update( parsedBody );

        case 'POST':
          // return event
          return alumni.create( parsedBody );

        case 'DELETE':
          return alumni.delete( query );

        default:
          return four03();
      }
    case 'login':
      switch (method) {
        case 'GET':
          if (query) {
            return login.validateSession( query );
          } else {
            return login.loginUser( parsedBody );
          }
        case 'POST':
          return login.loginUser( parsedBody );
        default:
          return four03();
      }
    case 'skills':
      switch (method) {
        case 'GET':
          return student.getStudentSkills(query);
        case 'PUT':
          return student.updateStudentSkills(parsedBody);
        case 'DELETE':
          return student.deleteAllStudentSkills(query);
        default:
          return four03();
      }
    case 'interests':
      switch (method) {
        case 'GET':
          return student.getStudentInterests(query);
        case 'PUT':
          return student.updateStudentInterests(parsedBody);
        case 'DELETE':
          return student.deleteAllStudentInterests(query);
        default:
          return four03();
      }
    case 'experiences':
      switch (method) {
        case 'GET':
          return student.getStudentExperiences(query);
        case 'PUT':
          return student.updateStudentExperiences(parsedBody);
        case 'DELETE':
          return student.deleteAllStudentExperiences(query);
        default:
          return four03();
      }
    case 'projectInterests':
      switch (method) {
        case 'GET':
          return student.getStudentProjectInterests(query);
        case 'PUT':
          return student.updateProjectInterests(parsedBody);
        case 'POST':
          return student.addProjectInterest(parsedBody);
        case 'DELETE':
          if (pathParams) {
            return await student.deleteStudentProjectInterests( pathParams );
          } else {
            return student.deleteAllStudentProjectInterests(query);
          }
        default:
          return four03();
      }
    case 'projects':
      switch (method) {
        case 'GET':
          if (pathParams) {
            console.log('find');
            return await alumni.findProject( pathParams );
          } else {
            return alumni.getAllProjects( query );
          }
        case 'PUT':
          return alumni.updateProject(parsedBody);
        case 'POST':
          return alumni.addProject( parsedBody );
        case 'DELETE':
          return alumni.deleteProject(query);
        default:
          return four03();
      }
    case 'studentMajor':
      switch (method) {
        case 'GET':
          return student.getStudentMajor(query);
        case 'PUT':
          return student.updateStudentMajor(parsedBody);
        case 'POST':
        case 'DELETE':
          return student.deleteStudentMajor(query);
        default:
          return four03();
      }
    case 'studentDegree':
      switch (method) {
        case 'GET':
          return student.getStudentDegree(query);
        case 'PUT':
          return student.updateStudentDegree(parsedBody);
        case 'POST':
        case 'DELETE':
          return student.deleteStudentDegree(query);
        default:
          return four03();
      }
    case 'studentLinks':
      switch (method) {
        case 'GET':
          return student.getStudentLinks(query);
        case 'PUT':
          return student.updateStudentLinks(parsedBody);
        case 'POST':
        case 'DELETE':
          return student.deleteStudentLinks(query);
        default:
          return four03();
      }
    case 'alumniSavedStudents':
      switch (method) {
        case 'GET':
          // console.log('alumni saved students');
          return alumni.getSavedStudents(query);
        case 'PUT':
          return alumni.updateSavedStudents(parsedBody);
        case 'POST':
          return alumni.addSavedStudents(parsedBody);
        case 'DELETE':
          if (pathParams) {
            // return event;
            return await alumni.deleteSavedStudent(pathParams);
          } else {
            return alumni.deleteAllSavedStudents(query);
          }
        default:
          return four03();
      }
    case 'alumniProjects':
      switch (method) {
        case 'GET':
          return alumni.getAlumniProjects(query);
        default:
          return four03();
      }
    default:
      return four03();
  }
};

function parseQuery (queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    var decodedValue = decodeURIComponent(pair[1] || '');
    if (decodedValue.includes('[')) {
      decodedValue = JSON.parse(decodedValue);
    }
    query[decodeURIComponent(pair[0])] = decodedValue;
  }
  return query;
}
