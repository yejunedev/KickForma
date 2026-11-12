//외부 라이브러리
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = 3000;

// 기본 설정
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

// MySQL 연결 설정
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "wjddpwns1234",
    database: "formalize_db",
    waitForConnections: true,
    connectionLimit: 10
});

// 서버 확인용 주소
app.get("/api/test", (req, res) => {
    res.json({
        message: "KickForma 서버가 정상적으로 실행되고 있습니다!"
    });
});

// MySQL 연결 테스트
app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS connected");

        res.json({
            message: "MySQL 연결 성공!",
            result: rows[0]
        });
    } catch (error) {
        console.error("DB 연결 오류:", error.message);

        res.status(500).json({
            message: "MySQL 연결에 실패했습니다."
        });
    }
});

// 포메이션 목록 조회 API
app.get("/api/formations", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, name, summary, tip FROM formations"
        );

        res.json(rows);
    } catch (error) {
        console.error("포메이션 조회 오류:", error.message);

        res.status(500).json({
            message: "포메이션 목록을 불러오지 못했습니다."
        });
    }
});

// 선택 질문 조회 API
app.get("/api/choices", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                choices.id,
                choices.question_text,
                choices.target_formation_id,
                formations.name AS formation_name
            FROM choices
            JOIN formations
                ON choices.target_formation_id = formations.id
        `);

        res.json(rows);
    } catch (error) {
        console.error("선택 질문 조회 오류:", error.message);

        res.status(500).json({
            message: "선택 질문을 불러오지 못했습니다."
        });
    }
});


// 포메이션 추천 API
app.post("/api/recommend", async (req, res) => {
    try {
        const { choiceIds } = req.body;

        // 선택한 질문 ID 확인
        if (!Array.isArray(choiceIds) || choiceIds.length === 0) {
            return res.status(400).json({
                message: "전술 항목을 하나 이상 선택해 주세요."
            });
        }

        // 선택한 질문과 연결된 포메이션별 점수 계산
        const placeholders = choiceIds.map(() => "?").join(",");

        const sql = `
            SELECT
                f.id,
                f.name,
                f.summary,
                f.tip,
                COUNT(*) AS score
            FROM choices c
            JOIN formations f
                ON c.target_formation_id = f.id
            WHERE c.id IN (${placeholders})
            GROUP BY f.id, f.name, f.summary, f.tip
            ORDER BY score DESC, f.id ASC
        `;

        const [rows] = await pool.query(sql, choiceIds);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "선택한 항목과 연결된 포메이션이 없습니다."
            });
        }

        res.json({
            message: "포메이션 추천 결과입니다.",
            recommendations: rows
        });

    } catch (error) {
        console.error("포메이션 추천 오류:", error.message);

        res.status(500).json({
            message: "포메이션 추천에 실패했습니다."
        });
    }
});


// 질문 8개와 선택지 32개 가져오기
app.get("/api/questions", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                q.id AS question_id,
                q.title,
                q.description,
                q.question_order,
                c.id AS choice_id,
                c.question_text,
                c.option_icon,
                c.option_description,
                c.option_order
            FROM questions q
            JOIN choices c
                ON q.id = c.question_id 
            ORDER BY q.question_order, c.option_order
        `);

        res.json(rows);//배열 프론트에게 전달

    } catch (error) {
        console.error("질문 조회 오류:", error);
        res.status(500).json({
            message: "질문을 불러오지 못했습니다."
        });
    }
});



// 서버 실행
app.listen(PORT, () => {
    console.log(`KickForma 서버 실행: http://localhost:${PORT}`);
});
