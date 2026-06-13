import { Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { generateToken, AuthRequest } from '../middleware';
import Joi from 'joi';

const schema = {
  register: Joi.object({
    email: Joi.string().email().max(255).required().messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Please enter your email',
      'any.required': 'Please enter your email',
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'string.empty': 'Please enter a password',
      'any.required': 'Please enter a password',
    }),
    name: Joi.string().max(255).required().messages({
      'string.empty': 'Please enter your name',
      'any.required': 'Please enter your name',
    }),
  }),
  login: Joi.object({
    email: Joi.string().max(255).required().messages({
      'string.empty': 'Please enter your email',
      'any.required': 'Please enter your email',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Please enter your password',
      'any.required': 'Please enter your password',
    }),
  }),
};

export const register = async (req: AuthRequest, res: Response) => {
  const { error, value } = schema.register.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email, password, name } = value;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'That email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email);

    res.status(201).json({ user, token });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'That email is already registered' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { error, value } = schema.login.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email, password } = value;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const token = generateToken(user.id, user.email);
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [
      req.user?.userId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
