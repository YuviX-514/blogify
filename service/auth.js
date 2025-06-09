const jwt = require('jsonwebtoken');

const secret = "TonyStark@514"

function createTokenForUser(user){
  const payload = {
    _id: user._id,
    name: user.fullName,
    email : user.email,
    role: user.role,
    profileImageURL: user.profileImageURL,
  }

  const token = jwt.sign(payload, secret);
  return token;
}

function validateToken(token){
  const payload = jwt.verify(token, secret);
  return payload;
}

module.exports={
  createTokenForUser, 
  validateToken,
}