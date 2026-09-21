export interface Question {
	id: string;
	assessmentId: string;
	title: string;
	description: string;
	score: number;
	displayOrder: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateQuestionRequest {
	title: string;
	description: string;
	score: number;
	displayOrder: number;
}

export interface UpdateQuestionRequest {
	title: string;
	description: string;
	score: number;
	displayOrder: number;
}
