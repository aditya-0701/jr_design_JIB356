const connection = require('../dbInit.js');
const bcrypt = require('bcrypt');

const Student = function(student) {
    this.gtUsername = student.gtUsername;
    this.firstName = student.firstName;
    this.lastName = student.lastName; 
    this.middleName = student.middleName;
    this.email = student.email;
    this.pwd = student.pwd;
    this.bio = student.bio;

}

const selectVals = `gtUsername, 
                    firstName,
                    lastName,
                    middleName,
                    email,
                    bio`

Student.findStudent = async ( params ) => {
    try {
        const { gtUsername } = params;
    //We can use knex to remove the need to do string interpolation to perform our DB transactions.
        let query = `SELECT gtUsername, 
                     firstName,
                     lastName,
                     middleName,
                     email,
                     bio 
                     FROM Students 
                     WHERE gtUsername = "${gtUsername}"`;

        let student = (await connection.query(query))[0];
        student = student || null;
        if (student) {
            console.log("Student exists");
            let skillQuery = `SELECT skill, id FROM Skills 
                WHERE id IN ( SELECT skillId FROM StudentSkills WHERE gtUsername = "${gtUsername}")`
            student['skills'] = await connection.query(skillQuery); 

            let interestQuery = `SELECT interest, id FROM Interests 
                WHERE id IN ( SELECT interestId FROM StudentInterests WHERE gtUsername = "${gtUsername}")`
            student['interests'] = await connection.query(interestQuery);
            
            let majorQuery = `SELECT major, id FROM Majors 
                WHERE id IN ( SELECT majorId FROM StudentMajors WHERE gtUsername = "${gtUsername}")`
            student['major'] = await connection.query(majorQuery); 
            
            let degreeQuery = `SELECT degree, id FROM Degrees 
                WHERE id IN ( SELECT degreeId FROM StudentDegrees WHERE gtUsername = "${gtUsername}")`
            student['degree'] = await connection.query(degreeQuery); 
            
            let expQuery = `SELECT * FROM Experience WHERE gtUsername = "${gtUsername}"`
            student['experiences'] = await connection.query(expQuery); 
            
            let linkQuery = `SELECT * FROM StudentLinks WHERE gtUsername = "${gtUsername}"`
            student['links'] = await connection.query(linkQuery); 
            
            
            
        }
        return student;
    } catch (e) {
        throw e;
    }
    
}

Student.queryStudent = async ( params ) => {
    const { query } = params; 
    var students = await connection.query(query);
    return students;
};


Student.getAll = async ( params ) => {
    let query = `SELECT gtUsername, firstName, lastName, email FROM Students`;
    let gtUnames = [];
    let onlySearch = true;
    
    if (params.skills) {
        onlySearch = false;
        let skills = 'SELECT gtUsername from StudentSkills WHERE skillId IN ' + connection.escape([params.skills]);
        let skillIds = await connection.query(skills);
        gtUnames.push(skillIds.map(element => element['gtUsername']));
        
    }
    
    if (params.interests) {
        onlySearch = false;
        let interests = 'SELECT gtUsername from StudentInterests WHERE interestId IN ' + connection.escape([params.interests]);
        let interestIds = await connection.query(interests);
        gtUnames.push(interestIds.map(element => element['gtUsername']));
    }
    
      if (params.degree) {
        onlySearch = false;
        let degrees = 'SELECT gtUsername from StudentDegrees WHERE degreeId IN ' + connection.escape([params.degree]);
        let degreeIds = await connection.query(degrees);
        gtUnames.push(degreeIds.map(element => element['gtUsername']));
    }
    
    if (params.major) {
        onlySearch = false;
        let majors = 'SELECT gtUsername from StudentMajors WHERE majorId IN ' + connection.escape([params.major]);
        let majorIds = await connection.query(majors);
        gtUnames.push(majorIds.map(element => element['gtUsername']));
    }
    
    var whereActive = false;
    gtUnames = gtUnames.flat();
    if (gtUnames != null && gtUnames != [] && gtUnames.length != 0) {
        console.log(gtUnames);
        whereActive = true;
        query += ' WHERE gtUsername IN ' + connection.escape(gtUnames);
    } else {
        if (!onlySearch) {
            return [];
        }
    }
    
    if (params.hours) {
        if (whereActive) {
            query += ' AND '    
        } else {
            query += ' WHERE '
            whereActive = true;
        }
        query += 'weekHours >= ' + connection.escape(params.hours);
    }
    
    if (params.search) {
        var searchString = connection.escape(params.search);
        if (whereActive) {
            query += ' AND '
        } else {
            query += ' WHERE '
        }
        query += `MATCH(firstName, lastName, middleName, bio) AGAINST (${searchString})`
    }
    
    
    var students = await connection.query(query);
    return students;
};

Student.addStudent = async ( params ) => {
    const inputs = Object.assign({}, params);
    delete inputs.skills;
    delete inputs.interests;
    delete inputs.experiences;
    delete inputs.degree;
    delete inputs.major;
    delete inputs.links;

    if (inputs.gtUsername && inputs.pwd && inputs.firstName && inputs.lastName && inputs.email) {
        let hash = '';
        try {
            hash = await bcrypt.hash(inputs.pwd, 10);
        } catch (e) {
            throw 'ERROR OCCURRED'
        }
        inputs.pwd = hash;
        // let studentParams = [params.gtUsername, params.email, params.firstName, params.lastName, params.middleName, params.bio, params.pwd];
        let query = "INSERT INTO Students SET ?";
        try {
            var students = await connection.query(query, inputs);
        } catch (e) {
            throw e;
        }
        if (students) {
            if (params.skills) {
                var skillsVals = [];
                for (let i = 0; i < params.skills.length; i++) {
                    skillsVals.push([params.gtUsername, params.skills[i]]);
                }
                let skillQuery = `INSERT INTO StudentSkills (gtUsername, skillId) VALUES ?`;
                students['skills'] = await connection.query(skillQuery, [skillsVals]); 
            }
            
            if (params.interests) {
                var interestsVals = [];
                for (let i = 0; i < params.interests.length; i++) {
                    interestsVals.push([params.gtUsername, params.interests[i]]);
                }
                let skillQuery = `INSERT INTO StudentInterests (gtUsername, interestId) VALUES ?`;
                students['interests'] = await connection.query(skillQuery, [interestsVals]); 
            }

            if (params.experiences) {
                // assumes params.experience follows:
                // [[description, company name, start date, end date], ...]
                var experiencesVals = [];
                for (let i = 0; i < params.experiences.length; i++) {
                    let exp = params.experiences[i];
                    let gtU = params.gtUsername;
                    let expVals = [gtU, exp.expDescription, exp.companyName, exp.start_date, exp.end_date, exp.position]
                    // experiencesVals.push(connection.escape(expVals));
                    experiencesVals.push(expVals);
                }
                let experiencesQuery = `INSERT INTO Experience (gtUsername, expDescription, companyName, start_date, end_date, position) VALUES ?`;
                students['experiences'] = await connection.query(experiencesQuery, [experiencesVals]);
            }
            if (params.major) {
                let majorQuery = `INSERT INTO StudentMajors (gtUsername, majorId) VALUES (${connection.escape(params.gtUsername)}, ${connection.escape(params.major)})`;
                students['major'] = await connection.query(majorQuery);
            }
            if (params.degree) {
                let degreeQuery = `INSERT INTO StudentDegrees (gtUsername, degreeId) VALUES (${connection.escape(params.gtUsername)}, ${connection.escape(params.degree)})`;
                students['degree'] = await connection.query(degreeQuery);
            }
            if (params.links) {
                var linksVals = [];
                let gtU = params.gtUsername;
                for (let i = 0; i < params.links.length; i++) {
                    let link = params.links[i];
                    let linkVal = [gtU, link.label, link.address];
                    linksVals.push(linkVal);
                }
                let linkQuery = `INSERT INTO StudentLinks (gtUsername, label, address) VALUES ?`;
                students['links'] = await connection.query(linkQuery, [linksVals]);
            }
        }
        return students;
    } else {
        throw 'ERROR OCCURRED';
    }
}

Student.deleteStudent = async ( params ) => {
    const { gtUsername } = params;
    let query = `DELETE FROM Students WHERE gtUsername = "${gtUsername}"`;
    let student = await connection.query(query);
    return student;
}

Student.updateStudent = async ( params ) => {
    const { gtUsername } = params;
    const inputs = Object.assign({}, params);
    delete inputs.gtUsername;
    delete inputs.skills;
    delete inputs.interests;
    delete inputs.experiences;
    delete inputs.degree;
    delete inputs.major;
    delete inputs.links;
    
    var query = 'UPDATE Students SET ? WHERE gtUsername = ' + connection.escape(gtUsername);
    if (inputs.hasOwnProperty('pwd')) {
        if (inputs.pwd != null && inputs.pwd != '') {
            try {
                let hash = await bcrypt.hash(params.pwd, 10);
                inputs.pwd = hash;
            } catch (e) {
                throw 'ERROR OCCURRED'
            }
        }
    }
    
    if (inputs == null || JSON.stringify(inputs) === JSON.stringify({})) 
        query = `SELECT ${selectVals} FROM Students WHERE gtUsername = ` + connection.escape(gtUsername);
    
    let student = await connection.query(query, inputs);
    
    if (params.skills) {
        var skillsVals = [];
        for (let i = 0; i < params.skills.length; i++) {
            skillsVals.push([gtUsername, params.skills[i]]); // Should we connection escape here too?
        }
        // TODO: delete before insert
        let deleteQuery = `DELETE FROM StudentSkills WHERE gtUsername = ${connection.escape(gtUsername)}`;
        let skillQuery = "INSERT INTO StudentSkills (gtUsername, skillId) VALUES ?";
        await connection.query(deleteQuery);
        student['skills'] = await connection.query(skillQuery, [skillsVals]); 
    }
            
    if (params.interests) {
        var interestsVals = [];
        for (let i = 0; i < params.interests.length; i++) {
            interestsVals.push([params.gtUsername, params.interests[i]]);
        }
        let deleteQuery = `DELETE FROM StudentInterests WHERE gtUsername = ${connection.escape(gtUsername)}`;
        let skillQuery = `INSERT INTO StudentInterests (gtUsername, interestId) VALUES ?`;
        await connection.query(deleteQuery);
        student['interests'] = await connection.query(skillQuery, [interestsVals]); 
    }

    if (params.experiences) {
        // assumes params.experience follows:
        // [[description, company name, start date, end date], ...]
        var experiencesVals = [];
        for (let i = 0; i < params.experiences.length; i++) {
            let exp = params.experiences[i];
            let gtU = params.gtUsername;
            let expVals = [gtU, exp.expDescription, exp.companyName, exp.start_date, exp.end_date, exp.position]
            // experiencesVals.push(connection.escape(expVals));
            experiencesVals.push(expVals);
        }
        let deleteQuery = `DELETE FROM Experience WHERE gtUsername = ${connection.escape(gtUsername)}`;
        let experiencesQuery = `INSERT INTO Experience (gtUsername, expDescription, companyName, start_date, end_date, position) VALUES ?`;
        await connection.query(deleteQuery);
        student['experiences'] = await connection.query(experiencesQuery, [experiencesVals]);
    }
    
    if (params.major) {
        let deleteQuery = `DELETE FROM StudentMajors WHERE gtUsername = ${connection.escape(gtUsername)}`;
        let insertQuery = `INSERT INTO StudentMajors (gtUsername, majorId) VALUES (${connection.escape(gtUsername)}, ${connection.escape(params.major)})`;
        await connection.query(deleteQuery);
        student['major'] = await connection.query(insertQuery);
    }

    if (params.degree) {
        let deleteQuery = `DELETE FROM StudentDegrees WHERE gtUsername = ${connection.escape(gtUsername)}`;
        let insertQuery = `INSERT INTO StudentDegrees (gtUsername, degreeId) VALUES (${connection.escape(gtUsername)}, ${connection.escape(params.degree)})`;
        await connection.query(deleteQuery);
        student['degree'] = await connection.query(insertQuery);
    }
    
    if (params.links) {
        var linksVals = [];
        
        for (let i = 0; i < params.links.length; i++) {
            let link = params.links[i];
            let linkVal = [gtUsername, link.label, link.address];
            linksVals.push(linkVal);
        }
        let deleteQuery = `DELETE FROM StudentLinks WHERE gtUsername = ${connection.escape(gtUsername)}`;
        let linkQuery = `INSERT INTO StudentLinks (gtUsername, label, address) VALUES ?`;
        await connection.query(deleteQuery);
        student['links'] = await connection.query(linkQuery, [linksVals]);
    }
    
    return student;
}

Student.getStudentSkills = async ( params ) => {
    const { gtUsername } = params;
    let query = `SELECT skill FROM Skills WHERE id IN (SELECT skillId from StudentSkills WHERE gtUsername = ${connection.escape(gtUsername)})`;
    let skills = await connection.query(query);
    return skills;
}

Student.updateStudentSkills = async (params) => {
    const {gtUsername, newSkills} = params;
    var skillsVals = [];
    for (let i = 0; i < newSkills.length; i++) {
        skillsVals.push([gtUsername, newSkills[i]]);
    }
    let skillQuery1 = `DELETE FROM StudentSkills WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let skillQuery2 = `INSERT IGNORE INTO StudentSkills (gtUsername, skillId) VALUES ?`;
    await connection.query(skillQuery1);
    let skills = await connection.query(skillQuery2, [skillsVals]); 
    return skills
}

Student.deleteAllStudentSkills = async (params) => {
    const {gtUsername} = params;
    let skillQuery = `DELETE FROM StudentSkills WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let skills = await connection.query(skillQuery); 
    return skills
}

Student.getStudentInterests = async ( params ) => {
    const { gtUsername } = params;
    let query = `SELECT interest FROM Interests WHERE id IN (SELECT interestId FROM StudentInterests WHERE gtUsername = ${connection.escape(gtUsername)})`;
    let interests = await connection.query(query);
    return interests;
}

Student.updateStudentInterests = async ( params ) => {
    const {gtUsername, newInterests} = params;
    let interestVals = [];
    for (let i = 0; i < newInterests.length; i++) {
        interestVals.push([gtUsername, newInterests[i]]);
    }
    let query1 = `DELETE FROM StudentInterests WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let query2 = `INSERT IGNORE INTO StudentInterests (gtUsername, interestId) VALUES ?`;
    await connection.query(query1);
    let interests = await connection.query(query2, [interestVals]); 
    return interests;
}

Student.deleteAllStudentInterests = async (params) => {
    const {gtUsername} = params;
    let query = `DELETE FROM StudentInterests WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let interests = await connection.query(query);
    return interests;
}

Student.getStudentExperiences = async ( params ) => {
    const { gtUsername } = params;
    let query = `SELECT * FROM Experience WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let experiences = connection.query(query);
    return experiences;
}

Student.updateStudentExperiences = async ( params ) => {
    // newExperiences must have all the columns from Experience except gtUsername
    // if experience already exists then id must be included, otherwise id must be null
    const {gtUsername, newExperiences} = params;
    var experiencesVals = [];
    for (let i = 0; i < newExperiences.length; i++) {
        newExperiences[i].splice(1, 0, gtUsername)
        experiencesVals.push(newExperiences[i]);
    }
    let experiencesQuery1 = `DELETE FROM Experience WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let experiencesQuery2 = `INSERT IGNORE INTO Experience (id, gtUsername, expDescription, companyName, start_date, end_date, position) VALUES ?`;
    // find way to batch update
    await connection.query(experiencesQuery1);
    let experiences = await connection.query(experiencesQuery2, [experiencesVals]);
    return experiences;
}

Student.deleteAllStudentExperiences = async (params) => {
    const {gtUsername} = params;
    let query = `DELETE FROM Experience WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let experiences = await connection.query(query);
    return experiences;
}

Student.getStudentProjectInterests = async (params) => {
    const { gtUsername } = params;
    let query = `SELECT * FROM Projects WHERE id IN (SELECT projectId from StudentSavedProjects WHERE gtUsername = ${connection.escape(gtUsername)})`;
    let projects = connection.query(query);
    return projects;
}

Student.addProjectInterest = async ( params ) => {
    // TODO: Talk with aditya if this should be replaced with update?
    const { gtUsername, projectIDs } = params;
    var interestParams = [];
    //gtUsername = connection.escape(gtUsername);
    for (let i = 0; i < projectIDs.length; i++) {
        interestParams.push([gtUsername, projectIDs[i]]);
    }
    let query = `INSERT IGNORE INTO StudentSavedProjects (gtUsername, projectId) VALUES ?`;
    var projects = await connection.query(query, [interestParams]);
    return projects;
}

Student.updateProjectInterests = async (params) => {
    const { gtUsername, projectIDs } = params;
    var interestParams = [];
    for (let i = 0; i < projectIDs.length; i++) {
        interestParams.push([gtUsername, projectIDs[i]]);
    }
    // TODO: Talk with aditya the best way to update this
    //       - Delete Then Insert?
    let deleteQuery = `DELETE FROM StudentSavedProjects WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let query = `INSERT IGNORE INTO StudentSavedProjects (gtUsername, projectId) VALUES ?`;
    await connection.query(deleteQuery);
    var projects = await connection.query(query, [interestParams]);
    return projects;
}

Student.deleteAllStudentProjectInterests = async (params) => {
    const {gtUsername} = params;
    let query = `DELETE FROM StudentSavedProjects WHERE gtUsername = ${connection.escape(gtUsername)}`;
    var interests = await connection.query(query);
    return interests;
}

Student.deleteStudentProjectInterests = async (params) => {
    const {gtUsername, id} = params;
    let query = `DELETE FROM StudentSavedProjects WHERE gtUsername = ${connection.escape(gtUsername)} AND projectId = ${id}`;
    var interests = await connection.query(query);
    return interests;
}

Student.getStudentMajor = async (params) => {
    const {gtUsername} = params;
    let query = `SELECT major FROM Majors WHERE id IN (SELECT majorId FROM StudentMajors WHERE gtUsername = ${connection.escape(gtUsername)})`;
    var major = await connection.query(query);
    return major;
}
Student.updateStudentMajor = async (params) => {
    const {gtUsername, newMajor} = params;
    let deleteQuery = `DELETE FROM StudentMajors WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let insertQuery = `INSERT INTO StudentMajors (gtUsername, majorId) VALUES (${connection.escape(gtUsername)}, ${connection.escape(newMajor)})`;
    await connection.query(deleteQuery);
    var major = await connection.query(insertQuery);
    return major;
}
Student.deleteStudentMajor = async (params) => {
    const {gtUsername} = params;
    let deleteQuery = `DELETE FROM StudentMajors WHERE gtUsername = ${connection.escape(gtUsername)}`;
    var major = await connection.query(deleteQuery);
    return major;
}

Student.getStudentDegree = async (params) => {
    const {gtUsername} = params;
    let query = `SELECT degree FROM Degrees WHERE id IN (SELECT degreeId FROM StudentDegrees WHERE gtUsername = ${connection.escape(gtUsername)})`;
    var degree = await connection.query(query);
    return degree;
}

Student.updateStudentDegree = async (params) => {
    const {gtUsername, newDegree} = params;
    let deleteQuery = `DELETE FROM StudentDegrees WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let insertQuery = `INSERT INTO StudentDegrees (gtUsername, degreeId) VALUES (${connection.escape(gtUsername)}, ${connection.escape(newDegree)})`;
    await connection.query(deleteQuery);
    var degree = await connection.query(insertQuery);
    return degree;
}

Student.deleteStudentDegree = async (params) => {
    const {gtUsername} = params;
    let deleteQuery = `DELETE FROM StudentDegrees WHERE gtUsername = ${connection.escape(gtUsername)}`;
    var degree = await connection.query(deleteQuery);
    return degree; 
}

Student.getStudentLinks = async (params) => {
    const {gtUsername} = params;
    let query = `SELECT * FROM StudentLinks WHERE gtUsername = ${connection.escape(gtUsername)}`;
    var links = await connection.query(query);
    return links;
}

Student.updateStudentLinks = async (params) => {
    const {gtUsername, newLinks} = params;
    var linksVals = [];
    
    for (let i = 0; i < newLinks.length; i++) {
        newLinks[i].splice(0, 0, gtUsername, null);
        linksVals.push(newLinks[i]);
    }
    let deleteQuery = `DELETE FROM StudentLinks WHERE gtUsername = ${connection.escape(gtUsername)}`;
    let linkQuery = `INSERT INTO StudentLinks (gtUsername, id, label, address) VALUES ?`;
    await connection.query(deleteQuery);
    var links = await connection.query(linkQuery, [linksVals]);
    return links;
}

Student.deleteStudentLinks = async (params) => {
    const {gtUsername} = params;
    let deleteQuery = `DELETE FROM StudentLinks WHERE gtUsername = ${connection.escape(gtUsername)}`;
    var links = await connection.query(deleteQuery);
    return links; 
}

module.exports = Student;