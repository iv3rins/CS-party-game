import { createHash, randomBytes, randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import type { Principal, Session } from './domain.js';
import type { Repository } from './repository.js';
import { ServiceError } from './services.js';

const USERNAME=/^[\p{Script=Han}A-Za-z0-9_]{3,18}$/u;
export const normalizeUsername=(value:string)=>value.toLocaleLowerCase('en-US');
export const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');

export class AuthService {
  constructor(private repository:Repository,private sessionDays=30){}
  private async session(principal:Principal){const token=randomBytes(32).toString('base64url');const expiresAt=new Date(Date.now()+this.sessionDays*86_400_000);await this.repository.createSession(principal,hashToken(token),expiresAt);return{token,expiresAt,principal};}
  async guest(){return this.session({id:randomUUID(),accountId:null,username:null,guest:true});}
  async register(username:string,password:string){if(!USERNAME.test(username))throw new ServiceError('INVALID_USERNAME','用户名需为3至18位中文、英文、数字或下划线');if(password.length<8||password.length>128)throw new ServiceError('INVALID_PASSWORD','密码需为8至128位');const normalized=normalizeUsername(username);if(await this.repository.findAccountByNormalizedUsername(normalized))throw new ServiceError('USERNAME_TAKEN','用户名已存在');const account=await this.repository.createAccount(username,normalized,await argon2.hash(password));return this.session({id:account.id,accountId:account.id,username:account.username,guest:false});}
  async login(username:string,password:string){const account=await this.repository.findAccountByNormalizedUsername(normalizeUsername(username));if(!account||!await argon2.verify(account.passwordHash,password))throw new ServiceError('INVALID_CREDENTIALS','用户名或密码错误');return this.session({id:account.id,accountId:account.id,username:account.username,guest:false});}
  async authenticate(token:string|undefined):Promise<Session|null>{return token?this.repository.findSession(hashToken(token),new Date()):null;}
  async logout(token:string|undefined){if(token)await this.repository.deleteSession(hashToken(token));}
}
