import jwt from 'jsonwebtoken';

const checkToken = async (req, res, next) => {
    try {
        let token = null;
        // 1. Try to get token from Authorization header
        if (req.headers.authorization && typeof req.headers.authorization === 'string') {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            } else {
                token = authHeader; // fallback
            }
        }

        // 2. Fallback to session token
        if (!token && req.session && req.session.token) {
            token = req.session.token;
        }

        // 3. If no token found
        if (!token) {
            return res.status(401).json({ msg: 'Unauthorized: no token provided', success: false });
        }

        // 4. Verify token
        const decoded = jwt.verify(token, process.env.EXPRESS_JWT_KEY);
        if (!decoded || !decoded._id) {
            return res.status(403).json({ msg: 'Invalid token payload', success: false });
        }

        // 5. Attach decoded user info to req
        req.user = decoded;
        req.id = decoded._id;

        next(); // Move to next middleware/route

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired', success: false });
        }

        return res.status(403).json({
            msg: 'Token verification failed',
            success: false,
            error: error.message,
        });
    }
};


function isLoggedIn(req, res, next) {
    if (req.session.isAuthenticated) {
        return next(); // user is logged in
    } else {
        return res.redirect('/api/user/login'); // or res.status(401).json(...)
    }
}

function isLoggedOut(req, res, next) {
    if (req.session?.isAuthenticated) {
        return res.redirect('/api/home');  // user is logged in
    } else {
        return next(); // allow access
    }
}



export { checkToken,  isLoggedIn, isLoggedOut};
