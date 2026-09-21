import { STATUS_CODES } from 'http';

export type Severity = 'INFO' | 'ERROR';

export interface StatusResponse {
	StatusCode: number;
	StatusDesc: string;
	Severity: Severity;
	ServerStatusCode: string;
	ServerStatusDesc: string;
}

export interface ApiResponse<T = unknown> {
	RqUID: string;
	Status: StatusResponse;
	EndDt: string;
	Data?: T;
}

class ApiResponseBuilder {
	public success<T>(
		rqUID: string,
		statusCode: number,
		serverStatusCode: string,
		serverStatusDesc: string,
		data?: T
	): ApiResponse<T> {
		return {
			RqUID: rqUID,
			Status: {
				StatusCode: statusCode,
				StatusDesc: STATUS_CODES[statusCode] || 'Success',
				Severity: 'INFO',
				ServerStatusCode: serverStatusCode,
				ServerStatusDesc: serverStatusDesc,
			},
			EndDt: new Date().toISOString(),
			...(data !== undefined && { Data: data }),
		};
	}

	public error(
		rqUID: string,
		statusCode: number,
		serverStatusCode: string,
		serverStatusDesc: string
	): ApiResponse {
		return {
			RqUID: rqUID,
			Status: {
				StatusCode: statusCode,
				StatusDesc: STATUS_CODES[statusCode] || 'Error',
				Severity: 'ERROR',
				ServerStatusCode: serverStatusCode,
				ServerStatusDesc: serverStatusDesc,
			},
			EndDt: new Date().toISOString(),
		};
	}
}

export default new ApiResponseBuilder();
