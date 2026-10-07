import { db } from "../db.js";

export async function GetUserData(req, res, next) {
  try {
    const results = await db.query(`SELECT id, email, role
      FROM users
      ORDER BY id`);
    console.log("req on getUserData", results);
    res.status(200).json({
      message: "Users fetched successfully",
      data: results.rows,
    });
  } catch (err) {
    console.log("error", err);
    next(err);
  }
}
export async function PostUsers(req, res) {
  const userData = Object.values(req.body);
  console.log("here is the values", userData);

  const QueryGen =
    "INSERT INTO users (name, age, email, phone, address) VALUES($1,$2,$3,$4,$5)";

  await db.query(QueryGen, userData);
  res.json({ message: "success" });
}

export async function DeleteUsers(req, res) {
  const id = req.params.id;

  try {
    const result = await db.query(` DELETE FROM users WHERE id=$1 `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "success", deletedUser: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// export async function GetUserById(req, res) {
//   const { id } = req.params;
//   try {
//     const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
//     console.log("result on getUserByyId", result);

//     if (result.rowCount === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     console.log("get id", result.rows[0]);
//   } catch (err) {
//     console.log("error", err);
//     next(err);
//   }
// }

export async function GetUserById(req, res) {
  try {
    const singleUser = await db.query("SELECT * FROM users WHERE id=$1", [
      req.params.id,
    ]);
    console.log("singleUser", singleUser);

    if (singleUser.rows.length === 0) {
      return res.json({ message: "No data found" });
    }

    res.json({ data: singleUser.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function updateUserById(req, res) {
  const { id } = req.params;
  const userData = req.body;

  const fields = Object.keys(userData);
  const values = Object.values(userData);

  const setClause = fields
    .map((field, index) => `${field}=$${index + 1}`)
    .join(", ");
  console.log("setClause", setClause);
  try {
    const result = await db.query(
      `UPDATE users SET ${setClause} WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("fields", fields);
    console.log("values", values);
    console.log("got id", result.rows);
    res.json({ message: "user found", data: result.rows[0] });
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function DeleteUserById(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query("DELETE FROM users WHERE id = [id]");
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No user found" });
    }
    res
      .status(200)
      .json({ message: "User found", deletedUser: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
}
