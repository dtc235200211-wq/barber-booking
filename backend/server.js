const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Kết nối Supabase Cloud Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Kiểm tra kết nối CSDL khi khởi động
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Lỗi kết nối Supabase:", err.stack);
  }
  console.log("Đã kết nối thành công tới Database Supabase!");
  release();
});

// API 1: Lấy danh sách dịch vụ
app.get("/api/services", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM services");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API 2: Tạo đơn đặt lịch mới
app.post("/api/appointments", async (req, res) => {
  const { customer_name, phone, service_id, booking_date, booking_time } =
    req.body;
  try {
    const check = await pool.query(
      "SELECT * FROM appointments WHERE booking_date = $1 AND booking_time = $2 AND status != $3",
      [booking_date, booking_time, "Cancelled"],
    );
    if (check.rows.length > 0) {
      return res
        .status(400)
        .json({
          message: "Khung giờ này đã có người đặt! Vui lòng chọn giờ khác.",
        });
    }

    const newBooking = await pool.query(
      "INSERT INTO appointments (customer_name, phone, service_id, booking_date, booking_time) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [customer_name, phone, service_id, booking_date, booking_time],
    );
    res.json({ message: "Đặt lịch thành công!", data: newBooking.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy thành công tại cổng http://localhost:${PORT}`);
});
