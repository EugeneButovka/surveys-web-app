'use strict'

const pg = require('pg')
const { Client } = pg
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
  const sql_query = `SELECT min("idSurvey") as first FROM "CompletedSurvey" where "idSurvey"=$1`

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
  const sql_query = `SELECT min(id) as next FROM "CompletedSurvey" where id>$1 and "idSurvey"=$2`

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
  const sql_query = `SELECT DISTINCT cs."idSurvey" as "surveyId", Q.id as "questionId", UCA."idAnswer" as "answer"
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
  const sql_getId = `select max(id) as num from "Survey"`
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
  const sql_getId = `select max(id) as num from "Question"`
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
  const sql_query = `INSERT INTO "Survey"(id, title, "idAdmin") VALUES($1, $2, $3)`

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

  const sql_query = `INSERT INTO "Question"(id, "idSurvey", text, type, min, max) VALUES ($1, $2, $3, $1, $2, $3)`
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
  const sql_query = `INSERT INTO "Answer"("idQuestion", text) VALUES ($1, $2)`

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
  const sql_getId = `select max(id) as num from "CompletedSurvey"`
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
  const sql_query = `INSERT INTO "CompletedSurvey"(id, "idSurvey", username) VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE
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
  const sql_query = `INSERT INTO "UserClosedAnswer"("idAnswer", "idCompletedSurvey") VALUES ($1, $2)`
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

exports.deleteUserClosedAnswers = async (idCS) => {
  const sql_query = `DELETE FROM "UserClosedAnswer" where "idCompletedSurvey"=$1`
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
  const sql_query = `INSERT INTO "UserOpenAnswer"("idCompletedSurvey", "idQuestion", text) VALUES ($1, $2, $3)`
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