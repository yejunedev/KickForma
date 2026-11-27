// 외부 라이브러리 불러오기
const express = require("express");          
const mysql = require("mysql2/promise");    
const cors = require("cors");                

const app = express(); 
const PORT = process.env.Port || 3000;     

// 기본 설정 
app.use(cors()); 
app.use(express.json()); 
app.use(express.static(__dirname)); 

// MySQL 연결 설정 (로컬 & 클라우드 배포 겸용)
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "wjddpwns1234",
    database: process.env.DB_NAME || "formalize_db",
    ssl: process.env.DB_HOST ? { rejectUnauthorized: true } : undefined,
    waitForConnections: true, 
    connectionLimit: 10      
});

app.get("/api/test", (req, res) => {
    res.json({
        message: "KickForma 서버가 정상적으로 실행되고 있습니다!"
    });
});

// MySQL 연결 테스트 API
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

app.post("/api/recommend", async (req, res) => {
    try {
        const { choiceIds } = req.body;

        if (!Array.isArray(choiceIds) || choiceIds.length === 0) {
            return res.status(400).json({
                message: "전술 항목을 하나 이상 선택해 주세요."
            });
        }

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

// 질문 8개와 선택지 32개 한 번에 다 가져오기
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

        res.json(rows);
    } catch (error) {
        console.error("질문 조회 오류:", error);
        res.status(500).json({
            message: "질문을 불러오지 못했습니다."
        });
    }
});

// ==========================================
// [추가 1] 회원가입 API (POST /api/register)
// ==========================================
app.post("/api/register", async (req, res) => {
    try {
        const { username, password, nickname } = req.body;

        if (!username || !password || !nickname) {
            return res.status(400).json({
                message: "아이디, 비밀번호, 닉네임을 모두 입력해 주세요."
            });
        }

        const [result] = await pool.query(
            "INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)",
            [username, password, nickname]
        );

        res.status(201).json({
            message: "회원가입이 완료되었습니다!",
            userId: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "이미 사용 중인 아이디입니다."
            });
        }
        console.error("회원가입 오류:", error.message);
        res.status(500).json({
            message: "회원가입 처리 중 오류가 발생했습니다."
        });
    }
});

// ==========================================
// [추가 2] 로그인 API (POST /api/login)
// ==========================================
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "아이디와 비밀번호를 입력해 주세요."
            });
        }

        const [rows] = await pool.query(
            "SELECT id, username, nickname FROM users WHERE username = ? AND password = ?",
            [username, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "아이디 또는 비밀번호가 일치하지 않습니다."
            });
        }

        res.json({
            message: "로그인 성공!",
            user: rows[0]
        });
    } catch (error) {
        console.error("로그인 오류:", error.message);
        res.status(500).json({
            message: "로그인 처리 중 오류가 발생했습니다."
        });
    }
});

// ==========================================
// [추가 3] 추천 결과 저장 API (POST /api/results)
// ==========================================
app.post("/api/results", async (req, res) => {
    try {
        const { userId, formationId, score } = req.body;

        if (!userId || !formationId || score === undefined) {
            return res.status(400).json({
                message: "저장할 결과 데이터가 부족합니다."
            });
        }

        const [result] = await pool.query(
            "INSERT INTO user_results (user_id, formation_id, score) VALUES (?, ?, ?)",
            [userId, formationId, score]
        );

        res.status(201).json({
            message: "추천 결과가 내 전술함에 저장되었습니다!",
            resultId: result.insertId
        });
    } catch (error) {
        console.error("결과 저장 오류:", error.message);
        res.status(500).json({
            message: "결과 저장 중 오류가 발생했습니다."
        });
    }
});

// ==========================================
// [추가 4] 내 추천 기록 조회 API (GET /api/results/:userId)
// ⭐ 핵심: users + user_results + formations 3중 JOIN!
// ==========================================
app.get("/api/results/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                ur.id AS result_id,
                u.nickname,
                f.name AS formation_name,
                f.summary,
                f.tip,
                ur.score,
                ur.created_at
            FROM user_results ur
            JOIN users u ON ur.user_id = u.id
            JOIN formations f ON ur.formation_id = f.id
            WHERE ur.user_id = ?
            ORDER BY ur.created_at DESC
        `, [userId]);

        res.json(rows);
    } catch (error) {
        console.error("기록 조회 오류:", error.message);
        res.status(500).json({
            message: "추천 기록을 불러오지 못했습니다."
        });
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`KickForma 서버 실행: http://localhost:${PORT}`);
});