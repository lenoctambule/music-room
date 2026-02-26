import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getMe(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.updateMe(req.user!.userId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const targetId = req.params.id as string;
    const result = await userService.getUserProfile(targetId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function sendFriendRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const friendId = req.params.friendId as string;
    const result = await userService.sendFriendRequest(req.user!.userId, friendId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const friendId = req.params.friendId as string;
    const result = await userService.acceptFriendRequest(req.user!.userId, friendId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const email = req.query.email as string;
    if (!email || email.length < 2) {
      res.status(400).json({ success: false, error: 'Email query must be at least 2 characters' });
      return;
    }
    const results = await userService.searchUsers(email, req.user!.userId);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

export async function getPendingRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getPendingRequests(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getFriends(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.getFriends(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
