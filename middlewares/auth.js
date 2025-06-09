const {validateToken} = require('../service/auth')

function checkForAuthenticationCookie(cookieName){
  return (req, res, next)=>{
    const tokenCookieValue = req.cookies[cookieName];
    if(!tokenCookieValue) {
      res.locals.user = null;  // explicitly clear if no token
      return next();
    }

    try{
        const userPayload = validateToken(tokenCookieValue);
        req.user = userPayload;
        res.locals.user = userPayload;  // pass user data to templates here
    }catch(error){
      res.locals.user = null;
    }
    return next();
  }
}

module.exports = {
  checkForAuthenticationCookie,
}