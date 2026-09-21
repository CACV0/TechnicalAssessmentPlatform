class AppError extends Error {
	public readonly statusCode: number;
	public readonly serverStatusCode: string;

	constructor(statusCode: number, serverStatusCode: string, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.serverStatusCode = serverStatusCode;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default AppError;
