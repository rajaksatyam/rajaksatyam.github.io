export class AppError extends Error {
    public readonly isOperational: boolean = true;

    constructor(
        public readonly message:string,
        public readonly statusCode:number){

        super(message);
        Object.setPrototypeOf(this, AppError.prototype);

        if(Error.captureStackTrace){
             Error.captureStackTrace(this, this.constructor);
        }
    }
}