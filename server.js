// 1. 외부 라이브러리 불러오기

const express = require("express");          
const mysql = require("mysql2/promise");    
const cors = require("cors");                

const app = express(); 
const PORT = 3000;     


// 2. 기본 설정 

app.use(cors()); 
app.use(express.json()); 
app.use(express.static(__dirname)); 

// 3. MySQL 연결 설정 

const pool = mysql.createPool({
    host: "localhost",        // DB 서버 주소
    user: "root",             // DB 사용자 이름
    password: "wjddpwns1234", 
    database: "formalize_db", 
    waitForConnections: true, 
    connectionLimit: 10       
});




app.get("/api/test", (req, res) => {
    // 서버가 켜져 있는지 확인
    res.json({
        message: "KickForma 서버가 정상적으로 실행되고 있습니다!"
    });
});

//MySQL 연결 테스트 API
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
                choices.id, -- 선택지 고유 번호
                choices.question_text, -- 선택지(보기) 내용
                choices.target_formation_id, -- 연결된 포메이션 번호
                formations.name AS formation_name -- formations 테이블에서 가져온 실제 포메이션 이름
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

        // 2. 선택한 질문과 연결된 포메이션별 점수 계산
        const placeholders = choiceIds.map(() => "?").join(",");

        // 3. 점수계산을 위한 SQL 쿼리문
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
            WHERE c.id IN (${placeholders}) -- 사용자가 고른 선택지 번호들을 DB에서 골라냄
            GROUP BY f.id, f.name, f.summary, f.tip -- 같은 포메이션끼리 뭉침
            ORDER BY score DESC, f.id ASC -- 점수가 높은 순으로 내림차순
        `;

        // placeholders에 숫자 넣어서 실행
        const [rows] = await pool.query(sql, choiceIds);

        // 만약 매칭된 결과가 하나도 없다면 예외 처리
        if (rows.length === 0) {
            return res.status(404).json({
                message: "선택한 항목과 연결된 포메이션이 없습니다."
            });
        }

        // 1등부터 정렬된 추천 순위표(rows)를 프론트엔드(script.js)로 보내줌
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
                q.id AS question_id,        -- 프론트엔드에서 헷갈리지 않게 '질문 번호' 이름표 붙임
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
                ON q.id = c.question_id     -- 질문 번호와 그 질문에 딸린 보기 번호가 일치하는 것끼리 짝을 지어줌
            ORDER BY q.question_order, c.option_order -- 1번 질문부터, 그리고 그 안에서 1번 보기부터 깔끔하게 정렬!
        `);

        res.json(rows); //rows를 프론트에게 전달

    } catch (error) {
        console.error("질문 조회 오류:", error);
        res.status(500).json({
            message: "질문을 불러오지 못했습니다."
        });
    }
});



// 5. 서버 실행

app.listen(PORT, () => {
    console.log(`KickForma 서버 실행: http://localhost:${PORT}`);
});