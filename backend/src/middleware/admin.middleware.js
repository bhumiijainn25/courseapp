const jwt = require("jsonwebtoken");


async function adminMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer")){
         return res.status(401).json({
           message: "No token provided"
        })
    }
    const token = authHeader.split(" ")[1];


    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN)
        
      
        req.adminId = decoded.id;

        next();
    
    
    }catch(err){
        console.log("Invalid token or expired token");
        return res.status(401).json({
            message: "Invalid token or expired token"
        })
    }
}

module.exports = adminMiddleware;