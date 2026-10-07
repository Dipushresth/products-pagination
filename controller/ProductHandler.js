import { db } from "../db.js";

// Columns we allow sorting by — never trust req.query directly in SQL
const SORTABLE_COLUMNS = [
  "id",
  "name",
  "price",
  "category",
  "stock",
  "created_at",
];

export async function GetProducts(req, res, next) {
  try {
    let {
      page = 1,
      limit = 5,
      sortBy = "id",
      order = "asc",
      search = "",
      category,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 5;

    // whitelist sortBy and order to prevent SQL injection
    if (!SORTABLE_COLUMNS.includes(sortBy)) sortBy = "id";
    order = order.toLowerCase() === "desc" ? "DESC" : "ASC";

    const offset = (page - 1) * limit;

    // build WHERE clause dynamically
    const conditions = [];

    const values = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`,
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // total count for pagination metadata
    const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // main query — sortBy/order are whitelisted above, safe to interpolate
    const dataQuery = `
      SELECT * FROM products
      ${whereClause}
      ORDER BY ${sortBy} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataValues = [...values, limit, offset];

    const result = await db.query(dataQuery, dataValues);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.log("error", err);
    next(err);
  }
}

export async function GetProductById(req, res, next) {
  try {
    const result = await db.query("SELECT * FROM products WHERE id=$1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function PostProducts(req, res, next) {
  try {
    const { name, description, price, category, stock } = req.body || {};
    console.log("req.body", req.body);

    if (!name || price === undefined) {
      return res.status(400).json({ message: "name and price are required" });
    }

    const result = await db.query(
      `INSERT INTO products (name, description, price, category, stock)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, price, category, stock ?? 0],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateProductById(req, res, next) {
  try {
    const { name, description, price, category, stock } = req.body;
    const { id } = req.params;

    const existing = await db.query("SELECT * FROM products WHERE id=$1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const current = existing.rows[0];

    const result = await db.query(
      `UPDATE products
       SET name=$1, description=$2, price=$3, category=$4, stock=$5
       WHERE id=$6 RETURNING *`,
      [
        name ?? current.name,
        description ?? current.description,
        price ?? current.price,
        category ?? current.category,
        stock ?? current.stock,
        id,
      ],
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function DeleteProducts(req, res, next) {
  try {
    const result = await db.query(
      "DELETE FROM products WHERE id=$1 RETURNING *",
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Deleted", data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
