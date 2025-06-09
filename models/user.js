const { createHmac, randomBytes } = require("crypto");

const { Schema, model } = require("mongoose");
const { createTokenForUser } = require("../service/auth");

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profileImageURL: {
      type: String,
      default: "/images/default.png",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  const user = this;

  if (!user.isModified("password")) return;

  const salt = randomBytes(16).toString();
  const hashPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");

  this.salt = salt;
  this.password = hashPassword;

  next();
});

userSchema.static('matchPasswordAndGenerateToken', async function(email, password){
  const user = await this.findOne({email});
  if(!user)throw new Error("User not found");
  const salt = user.salt;
  const hashPassword = user.password;

  const hashProvidedPassword = createHmac("sha256", salt)
    .update(password)
    .digest("hex");

    if (hashProvidedPassword !== hashPassword)throw new Error("Invalid password");

    const token = createTokenForUser(user);
    return token;

})

const User = model("user", userSchema);

module.exports = User;
