const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Redis optional (prevents startup crash)
let redisClient;

try {
    redisClient = require('../config/redis');
} catch (err) {

    console.warn(
        '⚠ Redis not configured → Token blacklist disabled'
    );

    redisClient = {
        get: async () => null,
        set: async () => null,
    };
}

async function protect(req, res, next) {
    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {

            token =
                req.headers.authorization.split(' ')[1];

        } else if (
            req.cookies &&
            req.cookies.jwt
        ) {

            token = req.cookies.jwt;
        }

        if (!token) {
            return res
                .status(401)
                .json({
                    message:
                        'Not authenticated',
                });
        }

        // Optional blacklist check
        const blacklisted =
            await redisClient.get(
                `blacklist:${token}`
            );

        if (blacklisted) {
            return res
                .status(401)
                .json({
                    message:
                        'Session expired. Login again.',
                });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user =
            await User.findById(decoded.id);

        if (!user || user.isDeleted) {
            return res
                .status(401)
                .json({
                    message:
                        'Account unavailable',
                });
        }

        req.user = user;
        req.userId = String(user._id);
        req.user.id = String(user._id);

        next();

    } catch (err) {

        return res
            .status(401)
            .json({
                message:
                    'Token invalid or expired',
            });
    }
}

async function optionalAuth(
    req,
    res,
    next
) {
    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith(
                'Bearer'
            )
        ) {

            token =
                req.headers.authorization.split(
                    ' '
                )[1];

        } else if (
            req.cookies &&
            req.cookies.jwt
        ) {

            token = req.cookies.jwt;
        }

        if (!token) {
            return next();
        }

        try {

            const blacklisted =
                await redisClient.get(
                    `blacklist:${token}`
                );

            if (blacklisted) {
                return next();
            }

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

            const user =
                await User.findById(
                    decoded.id
                );

            if (
                user &&
                !user.isDeleted
            ) {
                req.user = user;
                req.userId =
                    String(
                        user._id
                    );

                req.user.id =
                    String(
                        user._id
                    );
            }

        } catch {}

        next();

    } catch {

        next();
    }
}

function restrictTo(...allowedRoles) {
    return (
        req,
        res,
        next
    ) => {

        if (!req.user) {
            return res
                .status(401)
                .json({
                    message:
                        'Not authenticated',
                });
        }

        if (
            !allowedRoles.includes(
                req.user.role
            )
        ) {
            return res
                .status(403)
                .json({
                    message:
                        'Forbidden',
                });
        }

        next();
    };
}

function requireRole(role) {
    return (
        req,
        res,
        next
    ) => {

        if (!req.user) {
            return res
                .status(401)
                .json({
                    message:
                        'Not authenticated',
                });
        }

        if (
            req.user.role !==
            role
        ) {
            return res
                .status(403)
                .json({
                    message:
                        `Requires ${role}`,
                });
        }

        next();
    };
}

function adminOnly(
    req,
    res,
    next
) {

    if (!req.user) {
        return res
            .status(401)
            .json({
                message:
                    'Not authenticated',
            });
    }

    if (
        req.user.role ===
        'admin'
    ) {
        return next();
    }

    return res
        .status(403)
        .json({
            message:
                'Admins only',
        });
}

module.exports = {
    protect,
    optionalAuth,
    restrictTo,
    requireRole,
    adminOnly,
};