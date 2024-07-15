'use strict'

const pg = require('pg')
const {Client} = pg
const db = new Client()
db.connect()
//const sqlite = require('sqlite3')
const bcrypt = require('bcrypt')

// open the database
// const db = new sqlite.Database('surveys.db', (err) => {
//   if (err) {
//     throw err
//   }
// })

exports.getSurvey = (idSurvey) => {
  const sql_query = 'SELECT * FROM "Survey" where id = $1'

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idSurvey], (err, row) => {
      if (err) {
        reject(err)
      } else if (row === undefined) {
        reject({error: '"Survey" not found!'})
      } else {
        resolve(row.rows[0])
      }
    })
  })
}

exports.getFirstSurveyByTitle = (title) => {
  const sql_query = `SELECT *
                     FROM "Survey"
                     where title = $1
                     ORDER BY id desc LIMIT 1`

  return new Promise((resolve, reject) => {
    db.query(sql_query, [title], (err, row) => {
      if (err) {
        reject(err)
      } else if (row === undefined) {
        reject({error: '"Survey" not found!'})
      } else {
        resolve(row.rows[0])
      }
    })
  })
}

exports.getCompletedSurvey = (idCS) => {
  const sql_query = 'SELECT * FROM "CompletedSurvey" where id = $1'

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idCS], (err, row) => {
      if (err) {
        reject(err)
      } else if (row === undefined) {
        reject({error: 'Results not found!'})
      } else {
        resolve(row.rows[0])
      }
    })
  })
}

exports.getIdCompletedFirstSurvey = (idSurvey) => {
  const sql_query = `SELECT min("idSurvey") as first
                     FROM "CompletedSurvey"
                     where "idSurvey"=$1`

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idSurvey], (err, row) => {
      if (err) {
        reject(err)
      } else if (row === undefined) {
        reject({error: '"Survey" not found!'})
      } else {
        resolve(row.rows[0])
      }
    })
  })
}

exports.getIdCompletedNextSurvey = (idCS, idSurvey) => {
  const sql_query = `SELECT min(id) as next
                     FROM "CompletedSurvey"
                     where id
                         >$1
                       and "idSurvey"=$2`

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idCS, idSurvey], (err, row) => {
      if (err) {
        reject(err)
      } else if (row === undefined) {
        reject({error: '"Survey" not found!'})
      } else {
        resolve(row.rows[0])
      }
    })
  })
}

const getIdCompletedSurveyForUsername = (idSurvey, username) => {
  const sql_query = `SELECT *
                     FROM "CompletedSurvey"
                     where "idSurvey" = $1
                       and username = $2
                     ORDER BY id desc LIMIT 1`

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idSurvey, username], (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row.rows[0])
      }
    })
  })
}

exports.getAllCompletedSurveysWithAnswersForUsername = (username) => {
  const sql_query = `SELECT DISTINCT cs."idSurvey"  as "surveyId",
                                     Q.id           as "questionId",
                                     UCA."idAnswer" as "answer"
                     FROM "CompletedSurvey" CS
                              INNER JOIN "Question" Q on cs."idSurvey" = Q."idSurvey"
                              INNER JOIN "Answer" A on Q.id = A."idQuestion"
                              INNER JOIN "UserClosedAnswer" UCA on A.id = UCA."idAnswer"
                     where username = $1`

  return new Promise((resolve, reject) => {
    db.query(sql_query, [username], (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row.rows)
      }
    })
  })
}

exports.getQuestions = (idSurvey) => {
  const sql_query = 'SELECT * FROM "Question" where "idSurvey" = $1'

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idSurvey], (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows.rows)
      }
    })
  })
}

exports.getAnswers = (idQuestion) => {
  const sql_query = 'SELECT * FROM "Answer" where "idQuestion" = $1'

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idQuestion], (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows.rows)
      }
    })
  })
}

exports.getUserClosedAnswers = (idQuestion, idCS) => {
  const sql_query = 'select "idAnswer" ' +
      'from "UserClosedAnswer", "Answer" ' +
      'where "Answer"."idQuestion" = $1 and "idCompletedSurvey" = $2 ' +
      'and "Answer".id = "UserClosedAnswer"."idAnswer"'

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idQuestion, idCS], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.rows);
      }
    })
  })
}

exports.getUserOpenAnswers = (idQuestion, idCS) => {
  const sql_query = 'SELECT text ' +
      'from "UserOpenAnswer" ' +
      'where "idQuestion" = $1 and "idCompletedSurvey" = $2'

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idQuestion, idCS], (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row.rows[0])
      }
    })
  })
}

exports.getSurveys = () => {
  const sql_getSurveys = 'SELECT * FROM "Survey"'

  return new Promise((resolve, reject) => {
    db.query(sql_getSurveys, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.rows);
      }
    })
  })
}

exports.getAdminSurveys = (idAdmin) => {
  const sql_getSurveys = 'select min("CompletedSurvey".id) as next, "Survey".id, "Survey".title, count("CompletedSurvey".id) as count '
      +
      'from "Survey" left join "CompletedSurvey" on "Survey".id = "CompletedSurvey"."idSurvey" '
      +
      'where idAdmin = $1 ' +
      'group by ("Survey".id)' +
      'order by "Survey".id desc'

  return new Promise((resolve, reject) => {
    db.query(sql_getSurveys, [idAdmin], (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows.rows)
      }
    })
  })
}

const getIdSurvey = () => {
  const sql_getId = `select max(id) as num
                     from "Survey"`
  return new Promise((resolve, reject) => {
    db.query(sql_getId, [], (err, row) => {
      if (err) {
        reject(err)
      } else if (row === undefined) {
        reject(err)
      } else {
        resolve(row.rows[0].num)
      }
    })
  })
}

const getIdQuestion = () => {
  const sql_getId = `select max(id) as num
                     from "Question"`
  return new Promise((resolve, reject) => {
    db.query(sql_getId, [], (err, row) => {
      if (err) {
        reject(err)
      } else if (row === undefined) {
        reject(err)
      } else {
        resolve(row.rows[0].num)
      }
    })
  })
}

exports.insertSurvey = async (survey, idAdmin) => {
  const surveyId = await getIdSurvey() + 1
  const sql_query = `INSERT INTO "Survey"(id, title, "idAdmin")
                     VALUES ($1, $2, $3)`

  return new Promise((resolve, reject) => {
    db.query(sql_query, [surveyId, survey.title, idAdmin], (error) => {
      if (error) {
        reject(error)
      } else {
        resolve(surveyId)
      }
    })
  })
}

exports.insertQuestion = async (idSurvey, question) => {
  const idQuestion = await getIdQuestion() + 1

  const sql_query = `INSERT INTO "Question"(id, "idSurvey", text, type, min, max)
                     VALUES ($1, $2, $3, $1, $2, $3)`
  return new Promise((resolve, reject) => {
    db.query(sql_query,
        [idQuestion, idSurvey, question.text, question.type, question.min,
          question.max], (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(idQuestion)
          }
        })
  })
}

exports.insertAnswer = async (idQuestion, answer) => {
  const sql_query = `INSERT INTO "Answer"("idQuestion", text)
                     VALUES ($1, $2)`

  return new Promise((resolve, reject) => {
    db.query(sql_query, [idQuestion, answer.text], (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true)
      }
    })
  })
}

const getIdCompletedSurvey = () => {
  const sql_getId = `select max(id) as num
                     from "CompletedSurvey"`
  return new Promise((resolve, reject) => {
    db.query(sql_getId, [], (err, row) => {
      if (err) {
        reject(err)
      } else if (row === undefined) {
        reject("Results not found!")
      } else {
        resolve(row.rows[0].num)
      }
    })
  })
}

exports.insertOrReplaceCompletedSurvey = async (idSurvey, username) => {
  const compSurvey = await getIdCompletedSurveyForUsername(idSurvey, username)
  const compSurveyId = compSurvey?.id || await getIdCompletedSurvey() + 1
  const sql_query = `INSERT INTO "CompletedSurvey"(id, "idSurvey", username)
                     VALUES ($1, $2, $3) ON CONFLICT (id) DO
  UPDATE
      SET "idSurvey" = excluded."idSurvey",
      username = excluded.username`

  return new Promise((resolve, reject) => {
    db.query(sql_query, [compSurveyId, idSurvey, username], (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(compSurveyId)
      }
    })
  })
}

exports.insertUserClosedAnswer = async (idAnswer, idCS) => {
  const sql_query = `INSERT INTO "UserClosedAnswer"("idAnswer", "idCompletedSurvey")
                     VALUES ($1, $2)`
  return new Promise((resolve, reject) => {
    db.query(sql_query, [idAnswer, idCS], (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true)
      }
    })
  })
}

exports.deleteUserAnswers = async (idCS) => {
  return Promise.all([exports.deleteUserClosedAnswers(idCS),
    exports.deleteUserOpenAnswers(idCS)])
}

exports.deleteUserClosedAnswers = async (idCS) => {
  const sql_query = `DELETE
                     FROM "UserClosedAnswer"
                     where "idCompletedSurvey" = $1`
  return new Promise((resolve, reject) => {
    db.query(sql_query, [idCS], (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true)
      }
    })
  })
}

exports.deleteUserOpenAnswers = async (idCS) => {
  const sql_query = `DELETE
                     FROM "UserOpenAnswer"
                     where "idCompletedSurvey" = $1;`
  return new Promise((resolve, reject) => {
    db.query(sql_query, [idCS], (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true)
      }
    })
  })
}

exports.insertUserOpenAnswer = async (idCS, idQuestion, text) => {
  const sql_query = `INSERT INTO "UserOpenAnswer"("idCompletedSurvey", "idQuestion", text)
                     VALUES ($1, $2, $3)`
  return new Promise((resolve, reject) => {
    db.query(sql_query, [idCS, idQuestion, text], (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true)
      }
    })
  })
}

//user validation
exports.getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM "Admin" WHERE username = $1';
    db.query(sql, [username], (err, row) => {
      if (err) {
        reject(err);
      }// DB error
      else if (row === undefined) {
        resolve(false); // user not found
      } else {
        bcrypt.compare(password, row.hash).then(result => {
          if (result) { // password matches
            resolve({id: row.id, username: row.username});
          } else {
            resolve(false); // password not matching
          }
        }).catch((err) => {
          console.error(err)
        })
      }
    })
  })
}

exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'select * from "Admin" where id = $1';
    db.query(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      }// DB error
      else if (row === undefined) {
        resolve(false);
      }// user not found
      else {
        resolve({id: row.id, username: row.username});
      }
    })
  })
}

exports.workplaceStats = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        with user_angle_vales as (
                 SELECT
                 CS.username  as "username",
                 CAST(UOA.text AS DECIMAL) as value,
                     (CASE WHEN Q.text='right_elbow_angle' OR Q.text='left_elbow_angle' THEN 1 ELSE 0 END) as elbow,
                     (CASE WHEN Q.text='right_eye_angle' OR Q.text='left_eye_angle' THEN 1 ELSE 0 END) as eye
                 FROM "CompletedSurvey" CS
                     INNER JOIN "Survey" S on S.id = CS."idSurvey"
                     INNER JOIN "Question" Q on CS."idSurvey" = Q."idSurvey"
                     INNER JOIN "UserOpenAnswer" UOA on Q.id = UOA."idQuestion"
                 where S.title = 'Angles'
                     ),
        user_problems as (
                 SELECT username, eye, elbow,
                     (CASE WHEN elbow=1 AND (value>110 OR value<80) THEN 1 ELSE 0 END) as elbow_problem,
                     (CASE WHEN eye=1 AND (value>10 OR value<-10) THEN 1 ELSE 0 END) as eye_problem
                 FROM user_angle_vales
                     ),
        user_problems_grouped as (
                 SELECT username, MAX(elbow_problem) as elbow_group_problem,MAX(eye_problem) as eye_group_problem
                 FROM user_problems
                 GROUP BY username
                     )
    SELECT
        sum(elbow_group_problem) as "elbowAngleProblemCount",
        sum(eye_group_problem) as "eyeAngleProblemCount",
        count(*) as "totalAnglesSurveySubmittedCount"
    FROM user_problems_grouped;`;
    db.query(sql, [], (err, row) => {
      if (err || row === undefined) {
        reject(err);
      } else {
        resolve(row.rows[0]);
      }
    })
  })
}

exports.teamBurnoutStats = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        with problems as (
            SELECT
                CS.username  as "username",
                (CASE
                     WHEN A.text='Every day' THEN 4
                     WHEN A.text='Once a week' THEN 3
                     WHEN A.text='Sometimes in the month' THEN 2
                     WHEN A.text='Less than once a month' THEN 1
                     ELSE 0
                    END) as problem_level
            FROM "CompletedSurvey" CS
                     INNER JOIN "Survey" S on S.id = CS."idSurvey"
                     INNER JOIN "Question" Q on  Q."idSurvey" = CS."idSurvey"
                     INNER JOIN "Answer" A on A."idQuestion" = Q.id
                     INNER JOIN "UserClosedAnswer" UCA on UCA."idCompletedSurvey" = CS.id and UCA."idAnswer" = A.id
            where Q.text='How often does the pain occur?'),
             problems_max as (
                 select
                     username,
                     MAX(problem_level) as problmem_level_max
                 from problems
                 GROUP BY username),
             problems_risks as (
                 SELECT
                     (CASE WHEN problmem_level_max=4 THEN 1 ELSE 0 END) as very_high,
                     (CASE WHEN problmem_level_max=3 THEN 1 ELSE 0 END) as high,
                     (CASE WHEN problmem_level_max=2 THEN 1 ELSE 0 END) as medium,
                     (CASE WHEN problmem_level_max=1 THEN 1 ELSE 0 END) as low
                 FROM problems_max)
        select
            sum(very_high) as very_high_count,
            sum(high) as very_high,
            sum(medium) as medium_count,
            sum(low) as low_count
        from problems_risks`;
    db.query(sql, [], (err, row) => {
      if (err || row === undefined) {
        reject(err);
      } else {
        resolve(row.rows[0]);
      }
    })
  })
}

exports.teamComplainsStats = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        with complains as (
            SELECT
                CS.username  as "username",
                S.title as part,
                CAST(A.text as INTEGER) as rate
            FROM "CompletedSurvey" CS
                     INNER JOIN "Survey" S on S.id = CS."idSurvey"
                     INNER JOIN "Question" Q on  Q."idSurvey" = CS."idSurvey"
                     INNER JOIN "Answer" A on A."idQuestion" = Q.id
                     INNER JOIN "UserClosedAnswer" UCA on UCA."idCompletedSurvey" = CS.id and UCA."idAnswer" = A.id
            where Q.text='Rate your pain from 1 to 10'
        )
        select part, count(rate>3) as complains_count from complains
        GROUP BY part`;
    const query = {
      text: sql,
      //rowMode: 'array',
    }

    db.query(query, [], (err, row) => {
      if (err || row === undefined) {
        reject(err);
      } else {
        resolve(row.rows);
      }
    })
  })
}
