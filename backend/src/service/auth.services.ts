import { hashPassword, verifyPassword } from "../utility/hashing.utility";
import { createUser, findUser, tokenBlackListRepo } from "../repository/auth.repo";
import type { Auth } from "../validate/auth.validate";
import JWT, { type JwtPayload } from "jsonwebtoken";
import { EnvConfig } from "../config/env.config";
import { AppError } from "../errors/AppErrors.errors";




export const RegisterUser = async (data: Auth.SignUp) => {

  console.log(data)

  const userExists = await findUser(data.userName);
  if (userExists) return "user Already Exists."

  const hashed = await hashPassword(data.password);

  const userData = {
    userName: data.userName,
    email: data.email,
    password: hashed,
  };
  const user = await createUser(userData);

  const token = JWT.sign({ id: user._id }, EnvConfig.JWT_SECRET, { expiresIn: "15m" });

  const FinalUserData = {
    userName: user.userName,
    email: user.email,
    token,
  };
  return FinalUserData;
};

export const signInUser = async (data: Auth.SignIn) => {
  const user = await findUser(data.userName, true);

  if (!user) { throw new AppError("Incorrect username/passwrod", 401) }
  if (!user.password) { throw new AppError("Incorrect username/passwrod", 401) }
  const validate = await verifyPassword(data.password, user.password)
  console.log(validate)

  if (!validate) { throw new AppError("Incorrect username/password", 401) }

  const token = JWT.sign({ id: user._id }, EnvConfig.JWT_SECRET, { expiresIn: "15m" });

  return {
    userName: user.userName,
    email: user.email,
    token
  }
}

export const tokenBlackListService = async (data: string) => {
  const DecodedToken = JWT.decode(data) as JwtPayload
  if (!DecodedToken || typeof DecodedToken.exp !== "number" || typeof DecodedToken.iat !== "number") {
    throw new AppError("Unotherize Access", 401)
  }

  const tokenData = {
    token: data,
    expiresAt: new Date(DecodedToken.exp * 1000),
    createdAt: new Date(DecodedToken.iat * 1000)
  }

  return await tokenBlackListRepo(tokenData)


}
