const router = require('express').Router();
const passport = require("passport");
const psql = require("../../db/simpleConnect");
const AWS = require("aws-sdk");

 /**
 * @typedef ai_video
 * @property {integer} id - id of the video
 * @property {string} name - the name of the video following videoid_nameofmodel.mp4
 */

/**
 * @route GET /api/videos/ai_videos
 * @group ai_videos
 * @summary Get a list of all ai_videos
 * @returns {Array.<ai_video>} 200 - List of ai videos
 * @returns {Error} 500 - Unexpected database error
 */
router.get("/",passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let queryText = `SELECT * FROM ai_videos`;
    try {
      let ai_videos = await psql.query(queryText);
      res.json(ai_videos);
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }
);

/**
 * @route DELETE /api/videos/ai_videos
 * @group ai_videos
 * @summary Delete an ai_video
 * @param {ai_video} video.body.required - ai video
 * @returns {string} 200 - "deleted"
 * @returns {Error} 500 - Unexpected database or S3 error
 */
router.delete("/", passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let s3 = new AWS.S3();
    let queryText = `DELETE FROM ai_videos WHERE id=$1 RETURNING *`;
    let queryText1 = `DELETE FROM users WHERE username=$1 RETURNING *`;
    let videoName = req.body.video.name;
    let splitName = videoName.split("_");
    let modelNamewithMP4 = splitName[splitName.length - 1];
    const modelName = modelNamewithMP4.split(".mp4")[0];

    try {
      let Objects = [];
      Objects.push({
        Key: process.env.AWS_S3_BUCKET_AIVIDEOS_FOLDER + req.body.video.name
      });
      let params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Delete: {
          Objects: Objects
        }
      };
      let s3Res = await s3.deleteObjects(params, (err, data) => {
        if (err) {
          console.log(err);
          res.status(400).json(err);
        } else {
          console.log("Ai videos deleted");
        }
      });

      let del = await psql.query(queryText, [req.body.video.id]);

      del = await psql.query(queryText1, [modelName]);

      res.json("deleted");
    } catch (error) {
      console.log(error);
      res.status(400).json(error);
    }
  }
);

/**
 * @typedef ai_summary
 * @property {integer} id - ID of the concept
 * @property {string} name - Name of the concept
 * @property {string} rank - Rank of the concept
 * @property {integer} parent - Parent concept
 * @property {string} picture - Concept picture filename
 * @property {integer} conceptid - ID of the concept
 * @property {integer} videoid - ID of the concept
 * @property {string} count - Count of ai annotations in the ai video
 * @property {string} notai - Count of human annotations in the ai video
 */

/**
 * @route GET /api/videos/ai_videos/summary/:name
 * @group ai_videos
 * @summary Get a list of concepts in an ai_video
 * @param {string} name.url.required - name of the video
 * @returns {Array.<ai_summary>} 200 - An array of concepts in the ai video
 * @returns {Error} 500 - Unexpected database error
 */
router.get("/summary/:name", passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let params = [];
    let video = req.params.name;
    let splitted = video.split("_");
    let username = splitted[1].split(".mp4");
    params.push(username[0]); // username
    params.push(splitted[0]); // videoid

    let queryText = `
      SELECT 
        *
      FROM 
        concepts c
      JOIN
        (
          (
            SELECT 
              conceptid, 
              videoid,
              sum(case when username  = $1 then 1 else 0 end) as count,
              sum(case when username  <> $1 and username <> 'tracking' then 1 else 0 end) as notai
            FROM 
              annotations a 
            LEFT JOIN 
              users u ON u.id = a.userid
            GROUP BY
              a.conceptid, a.videoid
          )
        ) AS counts ON counts.conceptid=c.id
      WHERE 
        videoid=$2
      AND
        c.id = ANY(
          SELECT 
            unnest(concepts)
          FROM 
            models m
          LEFT JOIN 
            users u ON m.userid = u.id
          WHERE username = $1
        )
    `;
    try {
      const summary = await psql.query(queryText, params);
      res.json(summary.rows);
    } catch (error) {
      console.log("Error in get /api/videos/aivideos/summary/:videoid");
      console.log(error);
      res.status(500).json(error);
    }
  }
);

module.exports = router;